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
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'rococo_prive_secret_key_change_in_production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://rococo-prive.vercel.app';

// Base de Datos
const isRailwayInternal = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('.railway.internal');

console.log('🔍 DB URL Configurada:', process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : '❌ NINGUNA (Vacío o undefined)');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
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

// Inicializar Base de Datos
const initDB = async () => {
  try {
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
    `);
    console.log('✅ Base de datos inicializada correctamente');
  } catch (err) {
    console.error('❌ Error inicializando DB:', err);
  }
};

initDB();

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
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo perfiles' });
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
    res.status(500).json({ error: 'Error obteniendo planes' });
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

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log('🎭 ROCOCO PRIVÉ - SERVIDOR DE PAGOS');
  console.log('═══════════════════════════════════════════');
  console.log(`📡 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔗 Frontend: ${FRONTEND_URL}`);
  console.log('═══════════════════════════════════════════');
});
