import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { MercadoPagoConfig, Preference } from 'mercadopago';

dotenv.config();

const { Pool } = pg;
const app = express();

// Configuración
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'rococo_prive_secret_key_change_in_production';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://rococo-prive.vercel.app';

// Base de Datos
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Necesario para Railway/Supabase
});

// Mercado Pago
const mpClient = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN 
});

// Middleware
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Inicializar Base de Datos (Crea tablas si no existen)
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
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS profiles (
        user_id INT PRIMARY KEY REFERENCES users(id),
        bio TEXT,
        photos JSONB DEFAULT '[]',
        is_public BOOLEAN DEFAULT false,
        stats JSONB DEFAULT '{"visits": 0}'
      );
      
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        plan VARCHAR(50),
        amount INT,
        status VARCHAR(20) DEFAULT 'pending',
        mp_preference_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
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

// --- RUTAS DE AUTENTICACIÓN ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });

    // Verificar si existe
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Usuario ya existe' });

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Crear usuario
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, role',
      [email, password_hash, name || email.split('@')[0]]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en registro' });
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
    
    // No devolver password_hash
    delete user.password_hash;
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Error en login' });
  }
});

// --- RUTAS DE PERFIL ---

// Perfiles públicos (sin autenticación)
app.get('/api/profiles/public', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.phone, u.phone_verified,
              p.bio, p.photos, p.is_public, p.stats
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.is_public = true
       ORDER BY u.created_at DESC`
    );
    
    const profiles = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone_verified ? row.phone : null,
      bio: row.bio || '',
      photos: row.photos || [],
      stats: row.stats || { visits: 0 },
      is_public: row.is_public
    }));
    
    res.json({ profiles });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo perfiles' });
  }
});

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.user.id]);
    const user = await pool.query('SELECT id, email, name, role, phone, phone_verified FROM users WHERE id = $1', [req.user.id]);
    
    res.json({ user: user.rows[0], profile: profile.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo perfil' });
  }
});

app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { bio, photos, is_public } = req.body;
    // Upsert profile
    await pool.query(
      `INSERT INTO profiles (user_id, bio, photos, is_public) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (user_id) DO UPDATE SET bio=$2, photos=$3, is_public=$4`,
      [req.user.id, bio, JSON.stringify(photos || []), is_public]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error actualizando perfil' });
  }
});

// --- RUTAS DE PAGO ---

app.post('/api/payments/create', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Payment request received:', {
      userId: req.user.id,
      plan: req.body.plan,
      price: req.body.price
    });

    const { plan, price } = req.body;

    if (!plan || !price) {
      console.error('❌ Missing plan or price:', { plan, price });
      return res.status(400).json({ error: 'Faltan datos requeridos (plan, price)' });
    }

    const user = await pool.query('SELECT email, name FROM users WHERE id = $1', [req.user.id]);
    const userData = user.rows[0];

    if (!userData) {
      console.error('❌ User not found:', req.user.id);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

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

    const preference = new Preference(mpClient);
    const response = await preference.create({ body: preferenceBody });

    console.log('✅ Mercado Pago preference created:', response.id);

    // Guardar intento de pago
    await pool.query(
      'INSERT INTO payments (user_id, plan, amount, mp_preference_id) VALUES ($1, $2, $3, $4)',
      [req.user.id, plan, price, response.id]
    );

    res.json({ init_point: response.init_point, preferenceId: response.id });
  } catch (err) {
    console.error('❌ Error creating payment:', err);
    console.error('❌ Error details:', {
      message: err.message,
      stack: err.stack,
      cause: err.cause
    });
    res.status(500).json({ 
      error: 'Error creando pago',
      details: err.message 
    });
  }
});

// --- VERIFICACIÓN DE TELÉFONO (OTP) ---

app.post('/api/auth/request-otp', authenticateToken, async (req, res) => {
  try {
    const { phone } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await pool.query(
      'UPDATE users SET phone = $1, otp_code = $2, otp_expires_at = $3 WHERE id = $4',
      [phone, code, expires, req.user.id]
    );

    // TODO: Aquí integrarías Twilio o similar para enviar el SMS real.
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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'production', db: 'connected' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
