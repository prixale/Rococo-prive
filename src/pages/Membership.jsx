import React, { useState, useEffect } from 'react';
import { ChevronRight, Check, Loader2, AlertCircle } from 'lucide-react';
import GoogleLogin from '../components/GoogleLogin/GoogleLogin';
import MercadoPagoCheckout from '../components/MercadoPagoCheckout/MercadoPagoCheckout';
import './Membership.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Membership = ({ onNavigate }) => {
  const [loginMode, setLoginMode] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMercadoPagoCheckout, setShowMercadoPagoCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentStep, setPaymentStep] = useState('select');
  const [paymentError, setPaymentError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(`${API_URL}/api/plans`);
        const data = await response.json();
        if (data.plans) setPlans(data.plans);
      } catch (err) {
        console.error('Error fetching plans', err);
      }
    };
    fetchPlans();

    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleGoogleLogin = async (userData) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          name: userData.name,
          password: `google_${userData.googleId || 'auth'}`
        })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        if (selectedPlan) {
          setShowMercadoPagoCheckout(true);
          setPaymentStep('payment');
        } else {
          onNavigate('dashboard');
        }
      } else if (res.status === 400) {
        const loginRes = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userData.email, password: `google_${userData.googleId || 'auth'}` })
        });
        const loginData = await loginRes.json();
        if (loginData.token) {
          localStorage.setItem('token', loginData.token);
          localStorage.setItem('user', JSON.stringify(loginData.user));
          setIsLoggedIn(true);
          setCurrentUser(loginData.user);
          if (selectedPlan) {
            setShowMercadoPagoCheckout(true);
            setPaymentStep('payment');
          } else {
            onNavigate('dashboard');
          }
        } else {
          setError('Error al iniciar sesión con Google');
        }
      } else {
        setError('Error al registrar con Google');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        if (selectedPlan) {
          setShowMercadoPagoCheckout(true);
          setPaymentStep('payment');
        } else {
          onNavigate('dashboard');
        }
      } else {
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión. Verifica tu internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        if (selectedPlan) {
          setShowMercadoPagoCheckout(true);
          setPaymentStep('payment');
        } else {
          onNavigate('dashboard');
        }
      } else {
        setError(data.error || 'Error al crear cuenta');
      }
    } catch (err) {
      setError('Error de conexión. Verifica tu internet.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPlan = (plan) => {
    if (plan === 'free') {
      setRegisterMode(true);
    } else {
      setSelectedPlan(plan);
      if (isLoggedIn) {
        setShowMercadoPagoCheckout(true);
        setPaymentStep('payment');
      } else {
        setPaymentStep('login');
      }
    }
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setPaymentError('Ingresa tu correo y contraseña para continuar.');
      return;
    }
    setIsLoading(true);
    setPaymentError('');
    try {
      const loginRes = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const loginData = await loginRes.json();
      if (loginData.token) {
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        setIsLoggedIn(true);
        setCurrentUser(loginData.user);
        setShowMercadoPagoCheckout(true);
        setPaymentStep('payment');
      } else {
        setPaymentError('Credenciales inválidas. Intenta de nuevo o regístrate.');
      }
    } catch (err) {
      setPaymentError('Error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    onNavigate('dashboard');
  };

  const plan = plans.find(p => p.id === selectedPlan);

  return (
    <div className="membership-page container">
      <header className="membership-header">
        <button className="btn-back-global" onClick={() => onNavigate('home')}>
          <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> VOLVER
        </button>
        <img src="/assets/logo_r.png" alt="R" className="membership-logo-img" />
        <h1>ÚNETE A LA ÉLITE</h1>
        <p>Forma parte de la red más exclusiva del mundo.</p>
      </header>

      {loginMode ? (
        <div className="login-section glass-effect">
          <h2>Iniciar Sesión</h2>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {error && <p className="error-message"><AlertCircle size={14} /> {error}</p>}
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? <><Loader2 size={16} className="spin" /> INGRESANDO...</> : 'INICIAR SESIÓN'}
            </button>
            <div className="google-login-divider"><span>O</span></div>
            <GoogleLogin onSuccess={handleGoogleLogin} onError={(err) => setError(err)} />
            <button type="button" className="btn-link" onClick={() => { setLoginMode(false); setRegisterMode(true); setError(''); }}>
              ¿No tienes cuenta? Regístrate
            </button>
          </form>
        </div>
      ) : registerMode ? (
        <div className="login-section glass-effect">
          <h2>Crear Cuenta</h2>
          <form onSubmit={handleRegister} className="login-form">
            <div className="form-group">
              <label htmlFor="reg-name">Nombre Completo</label>
              <input type="text" id="reg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">Correo Electrónico</label>
              <input type="email" id="reg-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password">Contraseña</label>
              <input type="password" id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
            </div>
            {error && <p className="error-message"><AlertCircle size={14} /> {error}</p>}
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? <><Loader2 size={16} className="spin" /> CREANDO CUENTA...</> : 'CREAR CUENTA'}
            </button>
            <div className="google-login-divider"><span>O</span></div>
            <GoogleLogin onSuccess={handleGoogleLogin} onError={(err) => setError(err)} />
            <button type="button" className="btn-link" onClick={() => { setRegisterMode(false); setLoginMode(true); setError(''); }}>
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </form>
        </div>
      ) : paymentStep === 'login' ? (
        <div className="login-section glass-effect">
          <h2>Inicia sesión para pagar</h2>
          <p className="payment-plan-name">Plan {plan?.name} - ${plan?.price?.toLocaleString('es-CL')} CLP/mes</p>
          <form onSubmit={handleProceedToPayment} className="login-form">
            <div className="form-group">
              <label htmlFor="pay-email">Correo Electrónico</label>
              <input type="email" id="pay-email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
            </div>
            <div className="form-group">
              <label htmlFor="pay-password">Contraseña</label>
              <input type="password" id="pay-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            {paymentError && <p className="error-message"><AlertCircle size={14} /> {paymentError}</p>}
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? <><Loader2 size={16} className="spin" /> VERIFICANDO...</> : 'CONTINUAR AL PAGO'}
            </button>
            <button type="button" className="btn-link" onClick={() => { setPaymentStep('select'); setPaymentError(''); }}>
              ← Volver a los planes
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="membership-options">
            <div className="option-card glass-effect">
              <h2>REGISTRO Gratuito</h2>
              <p>Comienza sin costo con funciones básicas.</p>
              <ul>
                <li><Check size={16} /> Hasta 10 fotos en tu galería</li>
                <li><Check size={16} /> Perfil básico visible</li>
                <li><Check size={16} /> Publicidad básica</li>
              </ul>
              <button className="btn-join" onClick={() => handleSelectPlan('free')}>REGISTRARSE</button>
              <p className="price-tag">GRATIS</p>
            </div>

            {plans.map(p => (
              <div key={p.id} className="option-card glass-effect highlighted">
                <div className="popular-tag">{p.duration_days} DÍAS</div>
                <h2>MEMBRESÍA {p.name.toUpperCase()}</h2>
                <p>Membresía premium por {p.duration_days} días.</p>
                <ul>
                  <li><Check size={16} /> Posicionamiento mejorado</li>
                  <li><Check size={16} /> Contacto directo vía WhatsApp</li>
                  <li><Check size={16} /> Prioridad en búsquedas</li>
                </ul>
                <button className="btn-join-filled" onClick={() => handleSelectPlan(p.id)}>SUSCRIBIRSE</button>
                <p className="price-tag">${p.price.toLocaleString('es-CL')} CLP</p>
              </div>
            ))}
          </div>

          <div className="auth-toggle">
            <button type="button" className="btn-link" onClick={() => { setLoginMode(true); setError(''); }}>
              ¿Ya tienes cuenta? Inicia sesión
            </button>
            <span className="divider">|</span>
            <button type="button" className="btn-link" onClick={() => { setRegisterMode(true); setError(''); }}>
              Regístrate aquí
            </button>
          </div>
        </>
      )}

      {showMercadoPagoCheckout && (
        <MercadoPagoCheckout 
          selectedPlan={selectedPlan}
          userData={{
            name: currentUser?.name || name || email?.split('@')[0] || 'Usuario',
            email: currentUser?.email || email || 'usuario@ejemplo.com'
          }}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowMercadoPagoCheckout(false)}
        />
      )}
    </div>
  );
};

export default Membership;
