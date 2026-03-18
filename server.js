import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

const MERCADO_PAGO_CONFIG = {
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  mode: process.env.MERCADO_PAGO_MODE || 'test'
};

const PLANS = {
  free: { name: 'Gratis', photos: 10, videos: 0, price: 0 },
  premium: { name: 'Premium', photos: 20, videos: 5, price: 19990 },
  elite: { name: 'Élite', photos: 50, videos: 20, price: 29990 }
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: MERCADO_PAGO_CONFIG.mode === 'production' ? 'production' : 'development',
    mercadopago: MERCADO_PAGO_CONFIG.accessToken ? 'configured' : 'not_configured',
    mercadopago_mode: MERCADO_PAGO_CONFIG.mode
  });
});

app.post('/api/mercadopago/create-preference', async (req, res) => {
  try {
    const { plan, price, email, name } = req.body;

    if (!plan || !email || !name) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos',
        required: ['plan', 'email', 'name']
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Correo electrónico inválido' });
    }

    const planPrice = price || PLANS[plan]?.price;
    const isTest = MERCADO_PAGO_CONFIG.mode !== 'production';

    console.log(`📝 Creating Mercado Pago preference: Plan=${plan}, Amount=${planPrice} CLP, Mode=${isTest ? 'TEST' : 'PRODUCTION'}`);

    if (isTest || !MERCADO_PAGO_CONFIG.accessToken) {
      const mockPreferenceId = `mock_pref_${Date.now()}`;
      const mockInitPoint = 'https://www.mercadopago.com/mla/checkout/start?pref_id=' + mockPreferenceId;

      return res.json({
        preferenceId: mockPreferenceId,
        init_point: mockInitPoint,
        sandbox_init_point: mockInitPoint,
        plan: plan,
        amount: planPrice,
        email: email,
        name: name,
        mode: 'test',
        description: `Membresía ${PLANS[plan]?.name || 'Unknown'} - Rococo Privé`
      });
    }

    const MercadoPago = require('mercadopago');
    MercadoPago.configure({
      access_token: MERCADO_PAGO_CONFIG.accessToken
    });

    const preference = {
      items: [
        {
          id: `rococo_${plan}_${Date.now()}`,
          title: `Membresía ${PLANS[plan]?.name || 'Premium'} - Rococo Privé`,
          description: `Acceso a membresía ${PLANS[plan]?.name} con ${PLANS[plan]?.photos} fotos y ${PLANS[plan]?.videos} videos`,
          quantity: 1,
          currency_id: 'CLP',
          unit_price: parseFloat(planPrice)
        }
      ],
      payer: {
        email: email,
        name: name
      },
      back_urls: {
        success: `${process.env.API_URL || 'http://localhost:3001'}/api/mercadopago/success`,
        failure: `${process.env.API_URL || 'http://localhost:3001'}/api/mercadopago/failure`,
        pending: `${process.env.API_URL || 'http://localhost:3001'}/api/mercadopago/pending`
      },
      auto_return: 'approved',
      external_reference: `ROCOCO_${plan}_${email}_${Date.now()}`
    };

    const response = await MercadoPago.preferences.create(preference);

    console.log('✅ Mercado Pago preference created:', response.body.id);

    res.json({
      preferenceId: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point,
      plan: plan,
      amount: planPrice,
      email: email,
      name: name,
      mode: 'production'
    });
  } catch (error) {
    console.error('❌ Error creating Mercado Pago preference:', error);
    res.status(500).json({ 
      error: 'Error al procesar el pago con Mercado Pago',
      details: error.message 
    });
  }
});

app.get('/api/mercadopago/success', (req, res) => {
  console.log('✅ Mercado Pago payment SUCCESS');
  res.json({
    status: 'success',
    payment_id: req.query.payment_id,
    preference_id: req.query.preference_id
  });
});

app.get('/api/mercadopago/failure', (req, res) => {
  console.log('❌ Mercado Pago payment FAILURE');
  res.json({
    status: 'failure'
  });
});

app.get('/api/mercadopago/pending', (req, res) => {
  console.log('⏳ Mercado Pago payment PENDING');
  res.json({
    status: 'pending'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Rococo Privé API',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log('🎭 ROCOCO PRIVÉ - SERVIDOR DE PAGOS');
  console.log('═══════════════════════════════════════════');
  console.log(`📡 Servidor corriendo en puerto ${PORT}`);
  console.log(`💳 Mercado Pago: ${MERCADO_PAGO_CONFIG.mode === 'production' ? 'PRODUCCIÓN' : 'TEST'}`);
  console.log('═══════════════════════════════════════════');
});
