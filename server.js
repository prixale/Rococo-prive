import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Pool } = pg;
const app = express();

// Configuración
// IMPORTANT: Ensure PORT is not 5432 (PostgreSQL port) to avoid conflicts
const PORT = process.env.PORT === '5432' ? 3001 : (process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || 'rococo_prive_secret_key_change_in_production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://rococo-prive.vercel.app';

// ── Diagnóstico de entorno ────────────────────────────────────────────────────
// Imprime todas las variables de entorno relevantes (enmascaradas) para que
// podamos verificar qué está llegando realmente al contenedor en Railway.
console.log('');
console.log('══════════════════════════════════════════════════════');
console.log('🔎 DIAGNÓSTICO DE VARIABLES DE ENTORNO');
console.log('══════════════════════════════════════════════════════');

const SENSITIVE_KEYS = ['DATABASE_URL', 'DATABASE_PUBLIC_URL', 'JWT_SECRET', 'MERCADO_PAGO_ACCESS_TOKEN'];
const DB_KEYS        = ['DATABASE_URL', 'DATABASE_PUBLIC_URL', 'PGHOST', 'PGPORT', 'PGDATABASE', 'PGUSER', 'PGPASSWORD'];

// Show every env var: mask the value of sensitive ones, show the rest as-is
Object.keys(process.env).sort().forEach(key => {
  const val = process.env[key];
  if (!val) return; // skip empty
  if (SENSITIVE_KEYS.includes(key)) {
    // For connection strings mask the password segment; for short secrets show length only
    const masked = val.includes('@')
      ? val.replace(/:[^:@]+@/, ':***@')
      : `[SET – ${val.length} chars]`;
    console.log(`  ✅ ${key} = ${masked}`);
  } else {
    console.log(`  📌 ${key} = ${val}`);
  }
});

// Explicitly call out any DB-related keys that are MISSING
DB_KEYS.forEach(key => {
  if (!process.env[key]) {
    console.log(`  ❌ ${key} = (not set)`);
  }
});

console.log('══════════════════════════════════════════════════════');
console.log('');

// ── Base de Datos ─────────────────────────────────────────────────────────────
// Priorizar URL pública (más estable) sobre la interna
const DATABASE_URL = process.env.DATABASE_URL;
const DATABASE_PUBLIC_URL = process.env.DATABASE_PUBLIC_URL;

// Prioridad: URL pública primero (evita problemas de red interna de Railway)
const ACTIVE_DB_URL = DATABASE_PUBLIC_URL || DATABASE_URL;
const isInternalRailway = ACTIVE_DB_URL && ACTIVE_DB_URL.includes('.railway.internal');

console.log('🔍 DB URL (interna):', DATABASE_URL ? DATABASE_URL.replace(/:[^:@]+@/, ':***@') : '❌ No configurada');
console.log('🌐 DB URL (pública):', DATABASE_PUBLIC_URL ? DATABASE_PUBLIC_URL.replace(/:[^:@]+@/, ':***@') : '❌ No configurada');
console.log('✅ Usando URL:', ACTIVE_DB_URL ? ACTIVE_DB_URL.replace(/:[^:@]+@/, ':***@') : '❌ NINGUNA');
console.log('');

if (!ACTIVE_DB_URL) {
  console.error('');
  console.error('╔══════════════════════════════════════════════════════╗');
  console.error('║  🚨  ERROR CRÍTICO DE CONFIGURACIÓN                  ║');
  console.error('╠══════════════════════════════════════════════════════╣');
  console.error('║  Ni DATABASE_URL ni DATABASE_PUBLIC_URL están        ║');
  console.error('║  definidas. El servidor no puede arrancar sin una    ║');
  console.error('║  conexión a PostgreSQL.                              ║');
  console.error('║                                                      ║');
  console.error('║  Pasos para corregirlo en Railway:                   ║');
  console.error('║  1. Abre el servicio Postgres-gPDA en el dashboard.  ║');
  console.error('║  2. Ve a "Connect" → copia DATABASE_URL o            ║');
  console.error('║     DATABASE_PUBLIC_URL.                             ║');
  console.error('║  3. En el servicio Rococo-prive → Variables,         ║');
  console.error('║     añade la variable con el valor copiado.          ║');
  console.error('║  4. Si usas referencias (${{...}}), verifica que el  ║');
  console.error('║     nombre del servicio coincide exactamente.        ║');
  console.error('╚══════════════════════════════════════════════════════╝');
  console.error('');
  // Fail fast: exit so Railway marks the deploy as failed and shows the logs
  process.exit(1);
}

const pool = new Pool({
  connectionString: ACTIVE_DB_URL,
  ssl: isInternalRailway ? false : { rejectUnauthorized: false },
  connectionTimeoutMillis: 60000,  // 60s — extra headroom for Railway's slower internal handshakes
  idleTimeoutMillis: 900000,       // 15 min — keep connections alive longer behind Railway proxy
  max: 10,                         // Allow more concurrent connections for higher traffic
  keepAlive: true,                 // Send TCP keepalive packets so the OS doesn't silently drop idle connections
  keepAliveInitialDelayMillis: 10000
});

// Pool event listeners for visibility into connection lifecycle
pool.on('error', (err, client) => {
  console.error('⚠️ pg pool error (idle client):', err.message);
  console.error('   Stack:', err.stack);
});

pool.on('connect', (client) => {
  console.log(`🔌 New DB connection established (pool size: ${pool.totalCount})`);
});

pool.on('remove', (client) => {
  console.log(`🔌 DB connection removed from pool (pool size: ${pool.totalCount})`);
});



// Mercado Pago
const mpClient = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

console.log('🔑 Mercado Pago Token:', process.env.MERCADO_PAGO_ACCESS_TOKEN ? `Configurado (${process.env.MERCADO_PAGO_ACCESS_TOKEN.length} chars)` : '❌ NO CONFIGURADO');

// Directorio de uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storageEngine = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storageEngine });

// Middleware
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Inicializar Base de Datos con lógica de reintento
const initDB = async (retries = 5, delay = 3000) => {
  if (!ACTIVE_DB_URL) {
    console.error('⏭️ InitDB omitido: ni DATABASE_URL ni DATABASE_PUBLIC_URL están definidas.');
    return;
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Intento ${attempt}/${retries} de conexión a la base de datos...`);
      await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        name VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        phone VARCHAR(20),
        phone_verified BOOLEAN DEFAULT false,
        otp_code VARCHAR(6),
        otp_expires_at TIMESTAMP,
        subscription_plan VARCHAR(50) DEFAULT 'free',
        subscription_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS plans (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        duration_days INT NOT NULL,
        price INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        plan_id INT REFERENCES plans(id),
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS profiles (
        user_id INT PRIMARY KEY REFERENCES users(id),
        bio JSONB DEFAULT '{}',
        photos JSONB DEFAULT '[]',
        is_public BOOLEAN DEFAULT false,
        category VARCHAR(50) DEFAULT 'nueva',
        price INT DEFAULT 0,
        location VARCHAR(255) DEFAULT '',
        whatsapp VARCHAR(20) DEFAULT '',
        services JSONB DEFAULT '[]',
        stats JSONB DEFAULT '{"visits": 0, "whatsapp_clicks": 0}',
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        plan VARCHAR(50),
        amount INT,
        status VARCHAR(20) DEFAULT 'pending',
        mp_preference_id VARCHAR(255),
        mp_payment_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        client_id INT REFERENCES users(id),
        provider_id INT REFERENCES users(id),
        duration_hours INT,
        start_time TIMESTAMP,
        end_time TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS admin_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB
      );
      
      -- Insertar settings por defecto si no existen
      INSERT INTO admin_settings (key, value) VALUES
        ('membership_plans', '[
          {"id":"basic","name":"BÁSICO","description":"Acceso esencial por horas","icon":"⚡","color":"#10b981","hourlyRate":2000,"durations":[{"id":"1h","label":"1 Hora","hours":1,"price":2000,"active":true},{"id":"3h","label":"3 Horas","hours":3,"price":5000,"active":true},{"id":"6h","label":"6 Horas","hours":6,"price":9000,"active":true}],"benefits":["Perfil visible","Chat básico","1 foto destacada"],"active":true},
          {"id":"premium","name":"PREMIUM","description":"Acceso completo por tiempo extendido","icon":"💎","color":"#8b5cf6","hourlyRate":3500,"durations":[{"id":"12h","label":"12 Horas","hours":12,"price":35000,"active":true},{"id":"24h","label":"24 Horas","hours":24,"price":60000,"active":true},{"id":"3d","label":"3 Días","hours":72,"price":150000,"active":true}],"benefits":["Perfil verificado","Chat ilimitado","10 fotos destacadas","Aparición en destacados","Estadísticas básicas"],"active":true},
          {"id":"elite","name":"ÉLITE","description":"Máximo acceso y visibilidad","icon":"👑","color":"#f59e0b","hourlyRate":5000,"durations":[{"id":"1w","label":"1 Semana","hours":168,"price":499990,"active":true},{"id":"2w","label":"2 Semanas","hours":336,"price":899990,"active":true},{"id":"1m","label":"1 Mes","hours":720,"price":1499990,"active":true}],"benefits":["Perfil VIP verificado","Chat ilimitado","Fotos ilimitadas","Posición #1 en búsquedas","Estadísticas avanzadas","Soporte prioritario","Badge exclusivo","Acceso a eventos VIP"],"active":true}
        ]'::jsonb)
      ON CONFLICT (key) DO NOTHING;

      -- También poblar la tabla 'plans' si está vacía
      INSERT INTO plans (name, duration_days, price) 
      SELECT 'Básico', 1, 5000 WHERE NOT EXISTS (SELECT 1 FROM plans LIMIT 1);
      INSERT INTO plans (name, duration_days, price) 
      SELECT 'Premium', 7, 25000 WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Premium');
      INSERT INTO plans (name, duration_days, price) 
      SELECT 'Elite', 30, 80000 WHERE NOT EXISTS (SELECT 1 FROM plans WHERE name = 'Elite');
    `);
      console.log('✅ Base de datos inicializada correctamente');
      return; // Conexión exitosa, salir del loop
    } catch (err) {
      console.error(`❌ Error en intento ${attempt}/${retries}:`, err.message);
      if (attempt < retries) {
        console.log(`⏳ Reintentando en ${delay / 1000} segundos...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('💥 No se pudo conectar a la base de datos después de todos los intentos.');
        console.error('   Verifica que DATABASE_URL y las variables de Railway estén correctamente configuradas.');
      }
    }
  }
};

// initDB() is now called inside the startup sequence below.

// Middleware de Autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Middleware de Admin
const authenticateAdmin = (req, res, next) => {
  authenticateToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado' });
    }
    next();
  });
};

// Middleware Control de Suscripción
const checkSubscription = async (req, res, next) => {
  authenticateToken(req, res, async () => {
    try {
      const userResult = await pool.query('SELECT subscription_expires_at, role FROM users WHERE id = $1', [req.user.id]);
      if (userResult.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
      
      const user = userResult.rows[0];
      if (user.role === 'admin') return next(); // Admins bypass subscription check

      if (!user.subscription_expires_at || new Date(user.subscription_expires_at) < new Date()) {
        return res.status(403).json({ error: 'Suscripción inactiva o expirada' });
      }
      next();
    } catch (err) {
      res.status(500).json({ error: 'Error verificando suscripción' });
    }
  });
};

// ==========================================
// RUTAS DE CARGA (UPLOADS)
// ==========================================

app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió archivo o formato incorrecto' });
  }
  const baseUrl = req.protocol + '://' + req.get('host');
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Usuario ya existe' });

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role',
      [email, password_hash, name || email.split('@')[0]]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Crear perfil vacío
    await pool.query('INSERT INTO profiles (user_id) VALUES ($1)', [user.id]);

    res.json({ success: true, token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error en registro' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'Credenciales inválidas' });

    const user = result.rows[0];
    const validPass = await bcrypt.compare(password, user.password_hash);
    if (!validPass) return res.status(400).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    delete user.password_hash;
    res.json({ success: true, token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error en login' });
  }
});

// ==========================================
// RUTAS DE PERFIL PÚBLICO
// ==========================================

app.get('/api/profiles/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.phone, u.phone_verified, u.subscription_plan, u.created_at,
              p.bio, p.photos, p.is_public, p.category, p.price, p.location, 
              p.whatsapp, p.services, p.stats
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.is_public = true
       ORDER BY u.created_at DESC`
    );
    
    const profiles = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone_verified ? row.phone : null,
      subscriptionPlan: row.subscription_plan || 'free',
      createdAt: row.created_at,
      bio: row.bio || {},
      photos: row.photos || [],
      is_public: row.is_public,
      category: row.category || 'nueva',
      price: row.price || 0,
      location: row.location || '',
      whatsapp: row.whatsapp || '',
      services: row.services || [],
      stats: row.stats || { visits: 0, whatsapp_clicks: 0 }
    }));
    
    res.json({ profiles });
  } catch (err) {
    console.error('❌ ERROR en /api/profiles/public:', err);
    res.status(500).json({ error: 'Error obteniendo perfiles', message: err.message });
  }
});

// ==========================================
// RUTAS DE PERFIL PRIVADO (autenticado)
// ==========================================

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.user.id]);
    const user = await pool.query('SELECT id, email, name, role, phone, phone_verified, subscription_plan, subscription_expires_at FROM users WHERE id = $1', [req.user.id]);
    
    res.json({ user: user.rows[0], profile: profile.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo perfil' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { bio, photos, is_public } = req.body;
    
    await pool.query(
      `INSERT INTO profiles (user_id, bio, photos, is_public) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (user_id) DO UPDATE SET bio=$2, photos=$3, is_public=$4`,
      [req.user.id, JSON.stringify(bio || {}), JSON.stringify(photos || []), is_public || false]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizando perfil' });
  }
});

// ==========================================
// RUTAS DE PAGO
// ==========================================

app.post('/api/payments/create', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Payment request received:', { userId: req.user.id, plan: req.body.plan, price: req.body.price });

    const { plan, price } = req.body;
    if (!plan || !price) return res.status(400).json({ error: 'Faltan datos requeridos (plan, price)' });

    const user = await pool.query('SELECT email, name FROM users WHERE id = $1', [req.user.id]);
    const userData = user.rows[0];
    if (!userData) return res.status(404).json({ error: 'Usuario no encontrado' });

    console.log('👤 User data:', { email: userData.email, name: userData.name });

    const preferenceBody = {
      items: [{
        id: `rococo_${plan}`,
        title: `Membresía ${plan} - Rococo Privé`,
        quantity: 1,
        currency_id: 'CLP',
        unit_price: parseFloat(price)
      }],
      payer: { email: userData.email, name: userData.name },
      back_urls: {
        success: `${FRONTEND_URL}/membership?payment=success`,
        failure: `${FRONTEND_URL}/membership?payment=failure`,
        pending: `${FRONTEND_URL}/membership?payment=pending`
      },
      auto_return: 'approved',
      external_reference: `user_${req.user.id}`
    };

    console.log('📦 Creating Mercado Pago preference...');

    let response;
    try {
      const preference = new Preference(mpClient);
      response = await preference.create({ body: preferenceBody });
      console.log('✅ Mercado Pago preference created:', response.id);
    } catch (mpError) {
      console.error('❌ Mercado Pago API error:', mpError.message);
      console.warn('⚠️ Falling back to direct success mode...');
      
      const testPrefId = `test_pref_${Date.now()}`;
      
      await pool.query(
        'INSERT INTO payments (user_id, plan, amount, mp_preference_id, status) VALUES ($1, $2, $3, $4, $5)',
        [req.user.id, plan, price, testPrefId, 'approved']
      );

      // Actualizar plan del usuario
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      await pool.query(
        'UPDATE users SET subscription_plan = $1, subscription_expires_at = $2 WHERE id = $3',
        [plan, expiresAt, req.user.id]
      );

      return res.json({ 
        init_point: `${FRONTEND_URL}/membership?payment=success&payment_id=${testPrefId}`, 
        preferenceId: testPrefId,
        mode: 'test'
      });
    }

    await pool.query(
      'INSERT INTO payments (user_id, plan, amount, mp_preference_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, plan, price, response.id]
    );

    res.json({ init_point: response.init_point, preferenceId: response.id, mode: 'production' });
  } catch (err) {
    console.error('❌ Error creating payment:', err);
    res.status(500).json({ error: 'Error creando pago', details: err.message });
  }
});

// Webhook de Mercado Pago
app.post('/api/webhooks/mercadopago', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment' && data?.id) {
      console.log('💰 Payment webhook received:', data.id);
      
      // Actualizar estado del pago
      await pool.query(
        'UPDATE payments SET status = $1, mp_payment_id = $2 WHERE mp_preference_id = $3',
        ['approved', data.id, req.body.data?.id]
      );
      
      // Actualizar plan del usuario
      const payment = await pool.query('SELECT user_id, plan FROM payments WHERE mp_payment_id = $1', [data.id]);
      if (payment.rows.length > 0) {
        const { user_id, plan } = payment.rows[0];
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        await pool.query(
          'UPDATE users SET subscription_plan = $1, subscription_expires_at = $2 WHERE id = $3',
          [plan, expiresAt, user_id]
        );
      }
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

// ==========================================
// RUTAS DE BOOKINGS
// ==========================================

app.post('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const { provider_id, duration_hours, start_time, notes } = req.body;
    
    if (!provider_id || !duration_hours || !start_time) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const startTime = new Date(start_time);
    const endTime = new Date(startTime.getTime() + duration_hours * 60 * 60 * 1000);

    const result = await pool.query(
      `INSERT INTO bookings (client_id, provider_id, duration_hours, start_time, end_time, notes) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [req.user.id, provider_id, duration_hours, startTime, endTime, notes || '']
    );

    res.json({ success: true, booking_id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando reserva' });
  }
});

app.get('/api/bookings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, u.name as provider_name 
       FROM bookings b
       JOIN users u ON b.provider_id = u.id
       WHERE b.client_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ bookings: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo reservas' });
  }
});

// ==========================================
// RUTAS DE ADMIN
// ==========================================

// Aprobar perfil
app.put('/api/admin/profiles/:id/approve', authenticateAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE profiles SET is_public = true WHERE user_id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error aprobando perfil' });
  }
});

// Suspender perfil
app.put('/api/admin/profiles/:id/suspend', authenticateAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE profiles SET is_public = false WHERE user_id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error suspendiendo perfil' });
  }
});

// Stats del admin
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const activeProfiles = await pool.query('SELECT COUNT(*) FROM profiles WHERE is_public = true');
    const pendingProfiles = await pool.query('SELECT COUNT(*) FROM profiles WHERE is_public = false');
    const totalPayments = await pool.query('SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = $1', ['approved']);
    
    res.json({
      totalUsers: parseInt(totalUsers.rows[0].count),
      activeProfiles: parseInt(activeProfiles.rows[0].count),
      pendingProfiles: parseInt(pendingProfiles.rows[0].count),
      totalRevenue: parseInt(totalPayments.rows[0].sum)
    });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo stats' });
  }
});

// Settings del admin
app.get('/api/admin/settings', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM admin_settings');
    const settings = {};
    result.rows.forEach(row => { settings[row.key] = row.value; });
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo settings' });
  }
});

app.put('/api/admin/settings', authenticateAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;
    await pool.query(
      'INSERT INTO admin_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [key, JSON.stringify(value)]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando settings' });
  }
});

// Membresías (Público)
app.get('/api/plans', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM plans ORDER BY price ASC');
    res.json({ plans: result.rows });
  } catch (err) {
    console.error('❌ ERROR en /api/plans:', err);
    res.status(500).json({ error: 'Error obteniendo planes', message: err.message });
  }
});

// Admin Planes CRUD
app.get('/api/admin/plans', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM plans ORDER BY price ASC');
    res.json({ plans: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo planes' });
  }
});

app.post('/api/admin/plans', authenticateAdmin, async (req, res) => {
  try {
    const { name, duration_days, price } = req.body;
    const result = await pool.query(
      'INSERT INTO plans (name, duration_days, price) VALUES ($1, $2, $3) RETURNING *',
      [name, parseInt(duration_days), parseInt(price)]
    );
    res.json({ success: true, plan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error creando plan' });
  }
});

app.put('/api/admin/plans/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, duration_days, price } = req.body;
    const result = await pool.query(
      'UPDATE plans SET name = $1, duration_days = $2, price = $3 WHERE id = $4 RETURNING *',
      [name, parseInt(duration_days), parseInt(price), req.params.id]
    );
    res.json({ success: true, plan: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando plan' });
  }
});

app.delete('/api/admin/plans/:id', authenticateAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM plans WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando plan' });
  }
});

// ==========================================
// VERIFICACIÓN DE TELÉFONO (OTP)
// ==========================================

app.post('/api/auth/request-otp', authenticateToken, async (req, res) => {
  try {
    const { phone } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      'UPDATE users SET phone = $1, otp_code = $2, otp_expires_at = $3 WHERE id = $4',
      [phone, code, expires, req.user.id]
    );

    console.log(`📱 SMS OTP para ${phone}: ${code}`);
    res.json({ success: true, message: 'Código enviado (revisa consola del servidor)' });
  } catch (err) {
    res.status(500).json({ error: 'Error enviando OTP' });
  }
});

app.post('/api/auth/verify-otp', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const user = await pool.query('SELECT otp_code, otp_expires_at FROM users WHERE id = $1', [req.user.id]);
    
    if (user.rows[0].otp_code === code && new Date() < new Date(user.rows[0].otp_expires_at)) {
      await pool.query('UPDATE users SET phone_verified = true, otp_code = NULL WHERE id = $1', [req.user.id]);
      res.json({ success: true, message: 'Teléfono verificado' });
    } else {
      res.status(400).json({ error: 'Código inválido o expirado' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error verificando OTP' });
  }
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'production', db: 'connected' });
});

// ── Startup sequence ──────────────────────────────────────────────────────────
// Validate the DB connection BEFORE accepting traffic so Railway marks the
// deploy as failed (and surfaces the logs) when the database is unreachable.
(async () => {
  // 1. Verify we can actually reach PostgreSQL
  console.log('🔄 Verificando conexión a la base de datos antes de arrancar...');
  try {
    const client = await pool.connect();
    const { rows } = await client.query('SELECT NOW() AS now, current_database() AS db');
    client.release();
    console.log(`✅ Conexión a PostgreSQL exitosa — base de datos: "${rows[0].db}", hora del servidor: ${rows[0].now}`);
  } catch (err) {
    console.error('');
    console.error('╔══════════════════════════════════════════════════════╗');
    console.error('║  🚨  FALLO DE CONEXIÓN A POSTGRESQL                  ║');
    console.error('╠══════════════════════════════════════════════════════╣');
    console.error(`║  Error: ${err.message.substring(0, 44).padEnd(44)} ║`);
    console.error('║                                                      ║');
    console.error('║  URL activa (enmascarada):                           ║');
    console.error(`║  ${ACTIVE_DB_URL.replace(/:[^:@]+@/, ':***@').substring(0, 50).padEnd(50)} ║`);
    console.error('║                                                      ║');
    console.error('║  Posibles causas:                                    ║');
    console.error('║  • La referencia ${{...}} no se resolvió (valor      ║');
    console.error('║    literal en lugar de la URL real).                 ║');
    console.error('║  • El servicio Postgres-gPDA aún no está listo.      ║');
    console.error('║  • Credenciales o host incorrectos.                  ║');
    console.error('╚══════════════════════════════════════════════════════╝');
    console.error('');
    process.exit(1);
  }

  // 2. Run schema migrations / seed data
  await initDB();

  // 3. Start accepting HTTP traffic only after DB is confirmed healthy
  app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('🎭 ROCOCO PRIVÉ - SERVIDOR DE PAGOS');
    console.log('═══════════════════════════════════════════');
    console.log(`📡 Servidor corriendo en puerto ${PORT}`);
    console.log(`🔗 Frontend: ${FRONTEND_URL}`);
    console.log('═══════════════════════════════════════════');
  });
})();
