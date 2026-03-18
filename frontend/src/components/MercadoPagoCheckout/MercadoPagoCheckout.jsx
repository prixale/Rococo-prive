import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Check, X, Loader2, AlertCircle, Globe, Lock, RefreshCw, Wallet } from 'lucide-react';
import './MercadoPagoCheckout.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const MercadoPagoCheckout = ({ selectedPlan, userData, onSuccess, onCancel, isDemoMode = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('init');
  const [preferenceData, setPreferenceData] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const planPrices = {
    premium: { price: 19990, name: 'Premium' },
    elite: { price: 29990, name: 'Élite' }
  };

  const price = planPrices[selectedPlan]?.price || 19990;
  const planName = planPrices[selectedPlan]?.name || 'Premium';

  const handleRetry = () => {
    setError(null);
    setStep('init');
  };

  const createPreference = async () => {
    setLoading(true);
    setError(null);
    setStep('creating');

    try {
      const response = await fetch(`${API_URL}/api/mercadopago/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          price: price,
          email: userData.email,
          name: userData.name
        })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setStep('error');
        setLoading(false);
        return;
      }

      setPreferenceData(data);
      
      if (isDemoMode || data.sandbox_init_point) {
        setStep('redirect');
      } else if (data.init_point) {
        setStep('redirect');
      }
    } catch (err) {
      console.error('MercadoPago error:', err);
      setError('Error de conexión. Verifica tu conexión e intenta de nuevo.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const redirectToMercadoPago = () => {
    const url = preferenceData?.sandbox_init_point || preferenceData?.init_point;
    if (url) {
      window.location.href = url;
    }
  };

  const simulatePayment = async () => {
    setStep('processing');
    setLoading(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    setStep('success');
    onSuccess({
      plan: selectedPlan,
      email: userData.email,
      name: userData.name,
      amount: price,
      paymentMethod: 'mercadopago',
      currency: 'CLP',
      mode: isDemoMode ? 'test' : 'production'
    });

    setLoading(false);
  };

  return (
    <div className="mp-checkout-overlay">
      <div className="mp-checkout-modal glass-effect">
        <button className="close-modal" onClick={onCancel}>
          <X size={24} />
        </button>

        <div className="mp-header">
          <div className="mp-logo">
            <span className="mp-icon">🟢</span>
            <h2>Mercado Pago</h2>
          </div>
          <p>Paga de forma segura con Mercado Pago</p>
        </div>

        {step === 'init' && (
          <>
            <div className="mp-plan-summary">
              <h3>Resumen de Compra</h3>
              <div className="plan-detail">
                <span>Plan {planName}</span>
                <span className="plan-price">${price.toLocaleString('es-CL')} CLP/mes</span>
              </div>
            </div>

            <div className="mp-user-info">
              <div className="info-row">
                <span>Nombre:</span>
                <span>{userData.name}</span>
              </div>
              <div className="info-row">
                <span>Email:</span>
                <span>{userData.email}</span>
              </div>
            </div>

            <div className="mp-methods">
              <div className="method-card">
                <CreditCard size={24} />
                <div>
                  <strong>Tarjeta de Crédito</strong>
                  <span>Visa, Mastercard, Magna</span>
                </div>
              </div>
              <div className="method-card">
                <CreditCard size={24} />
                <div>
                  <strong>Tarjeta de Débito</strong>
                  <span>Redcompra, Maestro</span>
                </div>
              </div>
              <div className="method-card">
                <Wallet size={24} />
                <div>
                  <strong>Saldo Mercado Pago</strong>
                  <span>Usa tu billetera digital</span>
                </div>
              </div>
              <div className="method-card">
                <Globe size={24} />
                <div>
                  <strong>Transferencia</strong>
                  <span>Desde tu banco</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mp-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="mp-actions">
              <button className="btn-back" onClick={onCancel}>
                Cancelar
              </button>
              <button 
                className="btn-pay-mp"
                onClick={createPreference}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" /> Iniciando...
                  </>
                ) : (
                  <>
                    <Lock size={18} /> Pagar ${price.toLocaleString('es-CL')}
                  </>
                )}
              </button>
            </div>

            <div className="mp-secure">
              <Lock size={14} />
              <span>Pago 100% seguro con Mercado Pago</span>
            </div>
          </>
        )}

        {step === 'creating' && (
          <div className="mp-loading">
            <Loader2 size={48} className="spin" />
            <h3>Creando pago...</h3>
            <p>Por favor espera</p>
          </div>
        )}

        {step === 'redirect' && (
          <div className="mp-redirect">
            <div className="mp-redirect-icon">🟢</div>
            <h3>Redireccionando a Mercado Pago...</h3>
            <p>Serás redirigido automáticamente</p>
            
            {isDemoMode ? (
              <div className="demo-actions">
                <button className="btn-simulate" onClick={simulatePayment}>
                  <Check size={18} /> Simular Pago Exitoso
                </button>
                <button className="btn-back-small" onClick={handleRetry}>
                  Cancelar
                </button>
              </div>
            ) : (
              <button className="btn-redirect-mp" onClick={redirectToMercadoPago}>
                Ir a Mercado Pago
              </button>
            )}
          </div>
        )}

        {step === 'processing' && (
          <div className="mp-processing">
            <Loader2 size={48} className="spin" />
            <h3>Procesando pago...</h3>
            <p>No cierres esta ventana</p>
          </div>
        )}

        {step === 'success' && (
          <div className="mp-success">
            <div className="success-icon-large">✓</div>
            <h3>¡Pago Exitoso!</h3>
            <p>Tu membresía ha sido activada</p>
          </div>
        )}

        {step === 'error' && (
          <div className="mp-error-state">
            <AlertCircle size={48} />
            <h3>Error en el pago</h3>
            <p>{error || 'Ocurrió un error al procesar el pago'}</p>
            <div className="error-actions">
              <button className="btn-retry" onClick={handleRetry}>
                <RefreshCw size={18} /> Intentar de nuevo
              </button>
              <button className="btn-back-small" onClick={onCancel}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {isDemoMode && step === 'init' && (
          <div className="demo-notice">
            <AlertCircle size={16} />
            <div>
              <strong>⚠️ Modo de Prueba</strong>
              <p>Usa las credenciales de test de Mercado Pago</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MercadoPagoCheckout;
