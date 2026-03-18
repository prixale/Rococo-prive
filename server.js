import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const isProduction = process.env.MODE === 'production';

app.use(cors({
  origin: isProduction 
    ? process.env.ALLOWED_ORIGINS?.split(',') || 'https://tu-dominio.com'
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8000', 'http://localhost:8001', 'http://localhost:8010'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

const MEMBERSHIP_PRICES = {
  premium: {
    chile: 19990,
    world: 19.99
  },
  elite: {
    chile: 29990,
    world: 29.99
  }
};

const PLANS = {
  free: { name: 'Gratis', photos: 10, videos: 0, price: 0 },
  premium: { name: 'Premium', photos: 20, videos: 5, price: 19990 },
  elite: { name: 'Élite', photos: 50, videos: 20, price: 29990 }
};

const WEBPAY_CONFIG = {
  commerceCode: process.env.WEBPAY_COMMERCE_CODE || '597020000540',
  apiKey: process.env.WEBPAY_API_KEY || '579B532A7440BB0C9079DED94D31EA1615BAC1E',
  environment: isProduction ? 'production' : 'integration',
  returnUrl: process.env.WEBPAY_RETURN_URL || 'http://localhost:8001/payment/success',
  finalUrl: process.env.WEBPAY_FINAL_URL || 'http://localhost:8001/membership'
};

let WebpayPlus = null;
let WebpayEnvironment;

try {
  const { Environment, IntegrationApiKeys, IntegrationCommerceCodes, Options, WebpayPlus: WP } = require('transbank-sdk');
  
  WebpayEnvironment = WEBPAY_CONFIG.environment === 'production' ? Environment.Production : Environment.Integration;
  const commerceCode = WEBPAY_CONFIG.environment === 'production' 
    ? IntegrationCommerceCodes.WEBPAY_PLUS 
    : IntegrationCommerceCodes.WEBPAY_PLUS;
  const apiKey = WEBPAY_CONFIG.environment === 'production'
    ? IntegrationApiKeys.WEBPAY_PLUS
    : IntegrationApiKeys.WEBPAY_PLUS;
  
  const options = new Options(commerceCode, apiKey, WebpayEnvironment);
  WebpayPlus = new WP(options);
} catch (error) {
  console.log('⚠️ Webpay SDK no disponible, usando modo demo');
  WebpayEnvironment = 'demo';
}

// ============ MERCADO PAGO CONFIG ============
const MERCADO_PAGO_CONFIG = {
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  publicKey: process.env.VITE_MERCADO_PAGO_PUBLIC_KEY,
  mode: process.env.MERCADO_PAGO_MODE || 'test',
  successUrl: process.env.MERCADO_PAGO_SUCCESS_URL || 'http://localhost:8001/payment/success',
  failureUrl: process.env.MERCADO_PAGO_FAILURE_URL || 'http://localhost:8001/payment/failure',
  pendingUrl: process.env.MERCADO_PAGO_PENDING_URL || 'http://localhost:8001/payment/pending'
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePlan = (plan) => {
  return ['premium', 'elite'].includes(plan);
};

const validateCountry = (country) => {
  return ['chile', 'world'].includes(country);
};

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mode: isProduction ? 'production' : 'development',
    payments: {
      stripe: stripe ? 'available' : 'error',
      webpay: WebpayPlus ? 'available' : 'demo',
      mercadopago: MERCADO_PAGO_CONFIG.accessToken ? 'available' : 'demo',
      mercadopago_mode: MERCADO_PAGO_CONFIG.mode
    }
  });
});

app.get('/api/plans', (req, res) => {
  res.json({
    plans: PLANS,
    currency: isProduction ? 'live' : 'test',
    mode: isProduction ? 'production' : 'development'
  });
});

app.get('/api/payment-methods', (req, res) => {
  res.json({
    methods: [
      {
        id: 'stripe',
        name: 'Stripe',
        icon: '💳',
        currencies: ['CLP', 'USD'],
        available: true,
        description: 'Tarjetas internacionales'
      },
      {
        id: 'webpay',
        name: 'Webpay',
        icon: '🇨🇱',
        currencies: ['CLP'],
        available: true,
        description: 'Tarjetas de crédito, débito y Redcompra'
      },
      {
        id: 'mercadopago',
        name: 'Mercado Pago',
        icon: '🟢',
        currencies: ['CLP'],
        available: true,
        description: 'Tarjetas, transferencia, Mercado Pago'
      }
    ]
  });
});

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { plan, country, email, name } = req.body;

    if (!plan || !country || !email || !name) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos',
        required: ['plan', 'country', 'email', 'name']
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Correo electrónico inválido' });
    }

    if (!validatePlan(plan)) {
      return res.status(400).json({ error: 'Plan de membresía inválido' });
    }

    if (!validateCountry(country)) {
      return res.status(400).json({ error: 'País inválido' });
    }

    if (!MEMBERSHIP_PRICES[plan]) {
      return res.status(400).json({ error: 'Plan de membresía no encontrado' });
    }

    const amount = MEMBERSHIP_PRICES[plan][country];
    const currency = country === 'chile' ? 'clp' : 'usd';

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency,
      metadata: {
        plan,
        country,
        email,
        name,
        website: 'rococo-prive',
        integration: 'web'
      },
      receipt_email: email,
      automatic_payment_methods: {
        enabled: true
      },
      description: `Membresía ${PLANS[plan].name} - Rococo Privé`
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: currency,
      plan: plan,
      mode: isProduction ? 'production' : 'test'
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    if (error.type === 'StripeAuthenticationError') {
      return res.status(401).json({ error: 'Error de autenticación con el procesador de pagos' });
    }
    
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ error: 'Solicitud inválida al procesador de pagos' });
    }
    
    res.status(500).json({ error: 'Error al procesar el pago. Intenta de nuevo.' });
  }
});

app.post('/api/webpay/create', async (req, res) => {
  try {
    const { plan, email, name } = req.body;

    if (!plan || !email || !name) {
      return res.status(400).json({ 
        error: 'Faltan datos requeridos',
        required: ['plan', 'email', 'name']
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Correo electrónico inválido' });
    }

    if (!validatePlan(plan)) {
      return res.status(400).json({ error: 'Plan de membresía inválido' });
    }

    const amount = PLANS[plan].price;

    const buyOrder = `ROCOCO_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;
    const sessionId = `SESSION_${Date.now()}`;
    
    console.log(`📝 Creating Webpay transaction: Plan=${plan}, Amount=${amount} CLP, Email=${email}`);

    if (!WebpayPlus) {
      const mockToken = `mock_token_${Date.now()}`;
      const mockUrl = 'https://webpay3gint.transbank.cl/webpayserver/initTransaction';
      
      console.log('🔧 Webpay en modo demo');
      
      return res.json({
        token: mockToken,
        url: mockUrl,
        buyOrder,
        sessionId,
        amount,
        plan: plan,
        email,
        mode: 'demo'
      });
    }

    const createResponse = await WebpayPlus.create(
      buyOrder,
      sessionId,
      amount,
      WEBPAY_CONFIG.returnUrl
    );

    console.log('✅ Webpay transaction created:', createResponse.token);

    res.json({
      token: createResponse.token,
      url: createResponse.url,
      buyOrder,
      sessionId,
      amount,
      plan: plan,
      email,
      mode: isProduction ? 'production' : 'integration'
    });
  } catch (error) {
    console.error('❌ Error creating Webpay transaction:', error);
    res.status(500).json({ 
      error: 'Error al procesar el pago con Webpay',
      details: error.message 
    });
  }
});

app.post('/api/webpay/commit', async (req, res) => {
  try {
    const { token, plan } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token no proporcionado' });
    }

    console.log(`💳 Committing Webpay transaction: token=${token.substring(0, 20)}...`);

    if (!WebpayPlus || token.startsWith('mock_')) {
      console.log('🔧 Webpay commit en modo demo');
      
      return res.json({
        status: 'AUTHORIZED',
        amount: PLANS[plan]?.price || 19990,
        buyOrder: `ROCOCO_DEMO_${Date.now()}`,
        cardNumber: '****1234',
        accountingDate: new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        authorizationCode: 'DEMO123',
        paymentTypeCode: 'VN',
        responseCode: 0,
        sessionId: `SESSION_${Date.now()}`,
        transactionDate: new Date().toISOString(),
        plan,
        mode: 'demo'
      });
    }

    const commitResponse = await WebpayPlus.commit(token);

    console.log('✅ Webpay commit response:', {
      status: commitResponse.status,
      amount: commitResponse.amount,
      authorizationCode: commitResponse.authorization_code
    });

    res.json({
      status: commitResponse.status,
      amount: commitResponse.amount,
      buyOrder: commitResponse.buy_order,
      cardNumber: commitResponse.card_detail?.card_number || '****',
      accountingDate: commitResponse.accounting_date,
      authorizationCode: commitResponse.authorization_code,
      paymentTypeCode: commitResponse.payment_type_code,
      responseCode: commitResponse.response_code,
      sessionId: commitResponse.session_id,
      transactionDate: commitResponse.transaction_date,
      plan,
      mode: isProduction ? 'production' : 'integration'
    });
  } catch (error) {
    console.error('❌ Error committing Webpay transaction:', error);
    res.status(500).json({ 
      error: 'Error al confirmar el pago con Webpay',
      details: error.message 
    });
  }
});

app.post('/api/webpay/status', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token no proporcionado' });
    }

    if (!WebpayPlus || token.startsWith('mock_')) {
      return res.json({
        status: 'AUTHORIZED',
        amount: 19990,
        mode: 'demo'
      });
    }

    const statusResponse = await WebpayPlus.status(token);
    
    res.json({
      status: statusResponse.status,
      amount: statusResponse.amount,
      buyOrder: statusResponse.buy_order,
      authorizationCode: statusResponse.authorization_code,
      paymentTypeCode: statusResponse.payment_type_code,
      responseCode: statusResponse.response_code
    });
  } catch (error) {
    console.error('Error checking Webpay status:', error);
    res.status(500).json({ error: 'Error al verificar el Estado del pago' });
  }
});

// ============ MERCADO PAGO ENDPOINTS ============

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

    if (!validatePlan(plan)) {
      return res.status(400).json({ error: 'Plan de membresía inválido' });
    }

    const planPrice = price || PLANS[plan].price;
    const isTest = MERCADO_PAGO_CONFIG.mode === 'test';

    console.log(`📝 Creating Mercado Pago preference: Plan=${plan}, Amount=${planPrice} CLP, Mode=${isTest ? 'TEST' : 'PRODUCTION'}`);

    if (isTest) {
      // Modo TEST - devolver datos de prueba
      const mockPreferenceId = `mock_pref_${Date.now()}`;
      const mockInitPoint = 'https://www.mercadopago.com/mla/checkout/start?pref_id=' + mockPreferenceId;
      const mockSandboxInitPoint = 'https://www.mercadopago.com/mla/checkout/start?pref_id=' + mockPreferenceId;

      console.log('🧪 Mercado Pago en modo TEST (simulado)');

      return res.json({
        preferenceId: mockPreferenceId,
        init_point: mockInitPoint,
        sandbox_init_point: mockSandboxInitPoint,
        plan: plan,
        amount: planPrice,
        email: email,
        name: name,
        mode: 'test',
        description: `Membresía ${PLANS[plan].name} - Rococo Privé`
      });
    }

    // Modo Producción - usar API real de Mercado Pago
    const MercadoPago = require('mercadopago');
    MercadoPago.configure({
      access_token: MERCADO_PAGO_CONFIG.accessToken
    });

    const preference = {
      items: [
        {
          id: `rococo_${plan}_${Date.now()}`,
          title: `Membresía ${PLANS[plan].name} - Rococo Privé`,
          description: `Acceso a membresía ${PLANS[plan].name} con ${PLANS[plan].photos} fotos y ${PLANS[plan].videos} videos`,
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
        success: MERCADO_PAGO_CONFIG.successUrl,
        failure: MERCADO_PAGO_CONFIG.failureUrl,
        pending: MERCADO_PAGO_CONFIG.pendingUrl
      },
      auto_return: 'approved',
      external_reference: `ROCOCO_${plan}_${email}_${Date.now()}`,
      notification_url: `${process.env.VITE_API_URL || 'http://localhost:3001'}/api/mercadopago/webhook`
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

app.get('/api/mercadopago/success', async (req, res) => {
  console.log('✅ Mercado Pago payment SUCCESS');
  console.log('Query params:', req.query);
  
  res.json({
    status: 'success',
    payment_id: req.query.payment_id,
    preference_id: req.query.preference_id,
    status_detail: req.query.status_detail
  });
});

app.get('/api/mercadopago/failure', async (req, res) => {
  console.log('❌ Mercado Pago payment FAILURE');
  console.log('Query params:', req.query);
  
  res.json({
    status: 'failure',
    preference_id: req.query.preference_id
  });
});

app.get('/api/mercadopago/pending', async (req, res) => {
  console.log('⏳ Mercado Pago payment PENDING');
  console.log('Query params:', req.query);
  
  res.json({
    status: 'pending',
    preference_id: req.query.preference_id
  });
});

app.post('/api/mercadopago/webhook', async (req, res) => {
  try {
    console.log('📬 Mercado Pago Webhook received');
    console.log('Body:', req.body);

    if (req.body.type === 'payment') {
      const paymentId = req.body.data?.id;
      
      if (MERCADO_PAGO_CONFIG.mode === 'test') {
        console.log('🧪 Modo test - ignorando webhook');
        return res.json({ received: true });
      }

      const MercadoPago = require('mercadopago');
      MercadoPago.configure({
        access_token: MERCADO_PAGO_CONFIG.accessToken
      });

      const payment = await MercadoPago.payment.findById(paymentId);
      
      console.log('💰 Payment status:', payment.body.status);
      console.log('📧 Payer email:', payment.body.payer.email);

      if (payment.body.status === 'approved') {
        console.log('✅ Payment APPROVED!');
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing Mercado Pago webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { paymentIntentId, email } = req.body;

    if (!paymentIntentId || !email) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      res.json({
        verified: true,
        status: 'succeeded',
        amount: paymentIntent.amount / 100,
        email: paymentIntent.receipt_email
      });
    } else {
      res.json({
        verified: false,
        status: paymentIntent.status
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Error al verificar el pago' });
  }
});

app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret && endpointSecret !== 'whsec_tu_webhook_secret' && endpointSecret !== 'whsec_your_webhook_secret_here') {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = req.body.type ? req.body : JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✅ Payment succeeded:', paymentIntent.id);
      break;
    case 'payment_intent.payment_failed':
      console.log('❌ Payment failed:', event.data.object.id);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: isProduction ? 'Ocurrió un error inesperado' : err.message
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log('🎭 ROCOCO PRIVÉ - SERVIDOR DE PAGOS');
  console.log('═══════════════════════════════════════════');
  console.log(`📡 Servidor corriendo en puerto ${PORT}`);
  console.log(`🔐 Modo: ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'}`);
  console.log(`💳 Stripe: ${isProduction ? 'Live Mode' : 'Test Mode'}`);
  console.log(`🇨🇱 Webpay: ${WebpayEnvironment || 'demo'}`);
  console.log('═══════════════════════════════════════════');
});
