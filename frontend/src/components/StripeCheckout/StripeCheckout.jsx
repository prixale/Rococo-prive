import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, CreditCard, Check, X, Loader2, AlertCircle, Globe, RefreshCw } from 'lucide-react';
import './StripeCheckout.css';

const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const isProduction = import.meta.env.MODE === 'production';

const stripePromise = STRIPE_PUBLIC_KEY ? loadStripe(STRIPE_PUBLIC_KEY) : null;

const MembershipPlans = {
  free: { name: 'Gratis', photos: 10, videos: 0, price: 0 },
  premium: { 
    name: 'Premium', 
    photos: 20, 
    videos: 5, 
    priceCLP: 19990,
    priceUSD: 19.99 
  },
  elite: { 
    name: 'Élite', 
    photos: 50, 
    videos: 20, 
    priceCLP: 29990,
    priceUSD: 29.99 
  }
};

const CheckoutForm = ({ selectedPlan, userData, country, onSuccess, onCancel, isDemoMode }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const plan = MembershipPlans[selectedPlan];
  const price = country === 'chile' ? plan.priceCLP : plan.priceUSD;
  const currency = country === 'chile' ? 'CLP' : 'USD';
  const displayPrice = country === 'chile' ? `$${price.toLocaleString('es-CL')}` : `$${price}`;

  const handleRetry = () => {
    setError(null);
    setRetrying(true);
    setTimeout(() => setRetrying(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDemoMode) {
      setProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProcessing(false);
      onSuccess({
        plan: selectedPlan,
        email: userData.email,
        name: userData.name,
        last4: '4242',
        brand: 'visa',
        country,
        demo: true
      });
      return;
    }

    if (!stripe || !elements) {
      setError('El sistema de pago está cargando. Intenta de nuevo en unos segundos.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: selectedPlan,
          country,
          email: userData.email,
          name: userData.name
        })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setProcessing(false);
        return;
      }

      if (!data.clientSecret) {
        setError('No se pudo iniciar el pago. Intenta de nuevo.');
        setProcessing(false);
        return;
      }

      const cardElement = elements.getElement(CardElement);

      const { error: stripeError, paymentMethod, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: userData.name,
            email: userData.email,
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess({
          plan: selectedPlan,
          email: userData.email,
          name: userData.name,
          paymentMethodId: paymentMethod.id,
          paymentIntentId: paymentIntent.id,
          country,
          amount: data.amount,
          currency: data.currency
        });
      } else {
        setError('El pago no se completó. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Error de conexión. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        color: '#ffffff',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="checkout-plan-summary">
        <h3>Resumen de Compra</h3>
        <div className="plan-details">
          <span className="plan-name">Plan {plan.name}</span>
          <span className="plan-price">{displayPrice}/mes ({currency})</span>
        </div>
        <div className="plan-features">
          <div><Check size={14} /> Hasta {plan.photos} fotos</div>
          <div><Check size={14} /> {plan.videos > 0 ? `Hasta ${plan.videos} videos` : 'Sin videos'}</div>
          {selectedPlan === 'premium' && (
            <div><Check size={14} /> Prioridad en búsquedas</div>
          )}
          {selectedPlan === 'elite' && (
            <>
              <div><Check size={14} /> Posicionamiento #1</div>
              <div><Check size={14} /> Eventos VIP exclusivos</div>
            </>
          )}
        </div>
      </div>

      <div className="checkout-user-info">
        <h4>Información del Cliente</h4>
        <div className="info-row">
          <span>Nombre:</span>
          <span>{userData.name}</span>
        </div>
        <div className="info-row">
          <span>Email:</span>
          <span>{userData.email}</span>
        </div>
        <div className="info-row">
          <span>País:</span>
          <span>{country === 'chile' ? '🇨🇱 Chile' : '🌍 Otro país'}</span>
        </div>
      </div>

      <div className="checkout-card-section">
        <h4><CreditCard size={18} /> Datos de Pago</h4>
        <div className="card-element-wrapper">
          <CardElement options={cardElementOptions} />
        </div>
        
        {error && (
          <div className="card-error">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button type="button" onClick={handleRetry} title="Reintentar">
              <RefreshCw size={14} />
            </button>
          </div>
        )}
        
        <div className="security-badge">
          <Lock size={14} />
          <span>Pago 100% seguro con Stripe</span>
          {isProduction && <span className="production-badge">PRODUCCIÓN</span>}
        </div>
      </div>

      <div className="checkout-actions">
        <button 
          type="button" 
          className="btn-cancel"
          onClick={onCancel}
          disabled={processing}
        >
          <X size={16} /> Cancelar
        </button>
        <button 
          type="submit" 
          className="btn-pay"
          disabled={(!stripe && !isDemoMode) || processing || retrying}
        >
          {processing ? (
            <>
              <Loader2 size={16} className="spin" /> Procesando...
            </>
          ) : (
            <>
              <Lock size={16} /> Pagar {displayPrice}
            </>
          )}
        </button>
      </div>

      {isDemoMode && (
        <div className="demo-notice">
          <AlertCircle size={16} />
          <div>
            <strong>⚠️ Modo de Prueba</strong>
            <p>Esta es una simulación. No se procesará ningún pago real.</p>
            <p>Usa tarjeta de prueba: 4242 4242 4242 4242</p>
          </div>
        </div>
      )}

      {!isDemoMode && isProduction && (
        <div className="production-notice">
          <Lock size={14} />
          <span>🔒 Transacción segura encriptada</span>
        </div>
      )}
    </form>
  );
};

const StripeCheckout = ({ selectedPlan, userData, onSuccess, onCancel, isDemoMode = false }) => {
  const [country, setCountry] = useState('chile');
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health`);
        const data = await response.json();
        setApiStatus(data.status === 'ok' ? 'connected' : 'error');
      } catch (err) {
        setApiStatus('error');
      }
    };
    checkApi();
  }, []);

  return (
    <div className="stripe-checkout-overlay">
      <div className="stripe-checkout-modal glass-effect">
        <button className="close-modal" onClick={onCancel}>
          <X size={24} />
        </button>
        
        <div className="checkout-header">
          <h2><CreditCard size={24} /> Pago Seguro</h2>
          <p>Completa tu suscripción a Rococo Privé</p>
          {apiStatus === 'error' && (
            <div className="api-warning">
              <AlertCircle size={14} />
              <span>Error de conexión con el servidor</span>
            </div>
          )}
        </div>

        <div className="checkout-country-selector">
          <button 
            className={`country-btn ${country === 'chile' ? 'active' : ''}`}
            onClick={() => setCountry('chile')}
          >
            🇨🇱 Chile (CLP)
          </button>
          <button 
            className={`country-btn ${country === 'world' ? 'active' : ''}`}
            onClick={() => setCountry('world')}
          >
            🌍 Mundo (USD)
          </button>
        </div>

        <Elements stripe={stripePromise} options={STRIPE_PUBLIC_KEY ? undefined : {}}>
          <CheckoutForm 
            selectedPlan={selectedPlan}
            userData={userData}
            country={country}
            onSuccess={onSuccess}
            onCancel={onCancel}
            isDemoMode={isDemoMode}
          />
        </Elements>
      </div>
    </div>
  );
};

export default StripeCheckout;
export { MembershipPlans };
