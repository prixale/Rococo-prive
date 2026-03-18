import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Check, X, Loader2, AlertCircle, Globe, Lock, RefreshCw } from 'lucide-react';
import './WebpayCheckout.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const WebpayCheckout = ({ selectedPlan, userData, onSuccess, onCancel, isDemoMode = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('select'); // select, redirecting, processing, success, error
  const [webpayData, setWebpayData] = useState(null);
  const formRef = useRef(null);

  const planPrices = {
    premium: 19990,
    elite: 29990
  };

  const price = planPrices[selectedPlan] || 19990;

  const handleRetry = () => {
    setError(null);
    setStep('select');
  };

  const initiatePayment = async () => {
    setLoading(true);
    setError(null);
    setStep('redirecting');

    try {
      const response = await fetch(`${API_URL}/api/webpay/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
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

      setWebpayData(data);

      if (isDemoMode || data.mode === 'demo') {
        // Simular pago en modo demo
        setTimeout(async () => {
          await confirmPayment(data.token);
        }, 2000);
      } else {
        // Redirect to Webpay
        if (formRef.current) {
          formRef.current.submit();
        }
      }
    } catch (err) {
      console.error('Webpay error:', err);
      setError('Error de conexión. Verifica tu conexión e intenta de nuevo.');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (token) => {
    setStep('processing');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/webpay/commit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token || webpayData?.token,
          plan: selectedPlan
        })
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setStep('error');
        return;
      }

      if (data.status === 'AUTHORIZED' || data.status === 'CAPTURED') {
        setStep('success');
        onSuccess({
          plan: selectedPlan,
          email: userData.email,
          name: userData.name,
          amount: data.amount,
          authorizationCode: data.authorizationCode,
          cardNumber: data.cardNumber,
          paymentType: data.paymentTypeCode,
          webpay: true,
          mode: data.mode
        });
      } else {
        setError(`Pago rechazado: ${data.status}`);
        setStep('error');
      }
    } catch (err) {
      console.error('Webpay confirm error:', err);
      setError('Error al confirmar el pago');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="webpay-checkout-overlay">
      <div className="webpay-checkout-modal glass-effect">
        <button className="close-modal" onClick={onCancel}>
          <X size={24} />
        </button>

        <div className="webpay-header">
          <div className="webpay-logo">
            <span className="webpay-flag">🇨🇱</span>
            <h2>Webpay Chile</h2>
          </div>
          <p>Paga con tarjetas de crédito, débito o Redcompra</p>
        </div>

        {step === 'select' && (
          <>
            <div className="webpay-plan-summary">
              <h3>Resumen de Compra</h3>
              <div className="plan-detail">
                <span>Plan {selectedPlan === 'premium' ? 'Premium' : 'Élite'}</span>
                <span className="plan-price">${price.toLocaleString('es-CL')} CLP/mes</span>
              </div>
            </div>

            <div className="webpay-user-info">
              <div className="info-row">
                <span>Nombre:</span>
                <span>{userData.name}</span>
              </div>
              <div className="info-row">
                <span>Email:</span>
                <span>{userData.email}</span>
              </div>
            </div>

            <div className="webpay-methods">
              <div className="method-card">
                <CreditCard size={24} />
                <div>
                  <strong>Tarjetas de Crédito</strong>
                  <span>Visa, Mastercard, Magna, American Express</span>
                </div>
              </div>
              <div className="method-card">
                <div className="debit-icon">💳</div>
                <div>
                  <strong>Tarjetas de Débito</strong>
                  <span>Redcompra, Banco Estado, etc.</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="webpay-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="webpay-actions">
              <button className="btn-back" onClick={onCancel}>
                Cancelar
              </button>
              <button 
                className="btn-pay-webpay"
                onClick={initiatePayment}
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

            <div className="webpay-secure">
              <Lock size={14} />
              <span>Pago 100% seguro con Transbank</span>
            </div>
          </>
        )}

        {step === 'redirecting' && (
          <div className="webpay-redirecting">
            <div className="spinner-large"></div>
            <h3>Redireccionando a Webpay...</h3>
            <p>Por favor espera mientras completas el pago</p>
            
            <form 
              ref={formRef} 
              action={webpayData?.url} 
              method="POST" 
              style={{ display: 'none' }}
            >
              <input type="hidden" name="token_ws" value={webpayData?.token} />
            </form>
          </div>
        )}

        {step === 'processing' && (
          <div className="webpay-processing">
            <Loader2 size={48} className="spin" />
            <h3>Procesando pago...</h3>
            <p>No cierres esta ventana</p>
          </div>
        )}

        {step === 'success' && (
          <div className="webpay-success">
            <div className="success-icon-large">✓</div>
            <h3>¡Pago Exitoso!</h3>
            <p>Tu membresía ha sido activada</p>
          </div>
        )}

        {step === 'error' && (
          <div className="webpay-error-state">
            <AlertCircle size={48} />
            <h3>Error en el pago</h3>
            <p>{error || 'Ocurrió un error al procesar el pago'}</p>
            <div className="error-actions">
              <button className="btn-retry" onClick={handleRetry}>
                <RefreshCw size={18} /> Intentar de nuevo
              </button>
              <button className="btn-back" onClick={onCancel}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {isDemoMode && step === 'select' && (
          <div className="demo-notice">
            <AlertCircle size={16} />
            <div>
              <strong>⚠️ Modo de Prueba</strong>
              <p>Este es un pago simulado</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebpayCheckout;
