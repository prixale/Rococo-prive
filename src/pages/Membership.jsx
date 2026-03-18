import React, { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import MercadoPagoCheckout from '../components/MercadoPagoCheckout/MercadoPagoCheckout';
import GoogleLogin from '../components/GoogleLogin/GoogleLogin';
import './Membership.css';

const MembershipPlans = {
  free: { name: 'Gratis', photos: 10, videos: 0, price: 0 },
  premium: { name: 'Premium', photos: 20, videos: 5, price: 19.99 },
  elite: { name: 'Élite', photos: 50, videos: 20, price: 29.99 }
};

const Membership = ({ onNavigate }) => {
  const [loginMode, setLoginMode] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMercadoPagoCheckout, setShowMercadoPagoCheckout] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleGoogleLogin = (userData) => {
    const enhancedUserData = {
      ...userData,
      membership: 'free',
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('rococo_prive_user', JSON.stringify(enhancedUserData));
    
    const existingData = localStorage.getItem(`rococo_data_${userData.email}`);
    
    if (!existingData) {
      const initialData = {
        profile: {
          name: userData.name,
          email: userData.email,
          location: '',
          age: '',
          description: '',
          phone: '',
          whatsapp: '',
          horario: '',
          idioma: '',
          altura: '',
          peso: '',
          medidas: '',
          ojos: '',
          pelo: '',
          services: [],
          tarifa: '',
          tarifa2: ''
        },
        photos: [],
        videos: [],
        stories: [],
        membership: 'free',
        stats: { visits: 0, whatsappClicks: 0, activeAds: 0 },
        messages: [],
        isPublic: false,
        googleId: userData.googleId,
        avatar: userData.avatar
      };
      localStorage.setItem(`rococo_data_${userData.email}`, JSON.stringify(initialData));
    }
    
    onNavigate('dashboard');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (email.trim() === '' || password.trim() === '') {
      setError('Por favor ingresa tu correo y contraseña.');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      const userData = {
        email: email,
        name: email.split('@')[0],
        membership: 'free',
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('rococo_prive_user', JSON.stringify(userData));
      
      const existingData = localStorage.getItem(`rococo_data_${email}`);
      
      if (!existingData) {
        const initialData = {
          profile: {
            name: email.split('@')[0],
            email: email,
            location: '',
            age: '',
            description: '',
            phone: '',
            whatsapp: '',
            horario: '',
            idioma: '',
            altura: '',
            peso: '',
            medidas: '',
            ojos: '',
            pelo: '',
            services: [],
            tarifa: '',
            tarifa2: ''
          },
          photos: [],
          videos: [],
          stories: [],
          membership: 'free',
          stats: { visits: 0, whatsappClicks: 0, activeAds: 0 },
          messages: [],
          isPublic: false
        };
        localStorage.setItem(`rococo_data_${email}`, JSON.stringify(initialData));
      }
      
      onNavigate('dashboard');
    }, 1000);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (name.trim() === '' || email.trim() === '' || password.trim() === '') {
      setError('Por favor completa todos los campos.');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      const userData = {
        email: email,
        name: name,
        membership: selectedPlan || 'free',
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('rococo_prive_user', JSON.stringify(userData));
      
      const initialData = {
        profile: {
          name: name,
          email: email,
          location: '',
          age: '',
          description: '',
          phone: '',
          whatsapp: '',
          horario: '',
          idioma: '',
          altura: '',
          peso: '',
          medidas: '',
          ojos: '',
          pelo: '',
          services: [],
          tarifa: '',
          tarifa2: ''
        },
        photos: [],
        videos: [],
        stories: [],
        membership: selectedPlan || 'free',
        stats: { visits: 0, whatsappClicks: 0, activeAds: 0 },
        messages: [],
        isPublic: false
      };
      localStorage.setItem(`rococo_data_${email}`, JSON.stringify(initialData));
      
      onNavigate('dashboard');
    }, 1000);
  };

  const handleSelectPlan = (plan) => {
    if (plan === 'free') {
      setSelectedPlan('free');
      setShowPayment(true);
    } else {
      setSelectedPlan(plan);
      setShowStripeCheckout(true);
    }
  };

  const handlePaymentSuccess = (paymentDetails) => {
    const userEmail = email || paymentDetails.email || 'nuevo@usuario.com';
    const userName = name || paymentDetails.name || userEmail.split('@')[0];
    
    const userData = {
      email: userEmail,
      name: userName,
      membership: selectedPlan,
      paymentMethod: paymentDetails.last4 ? `**** ${paymentDetails.last4}` : 'card',
      paymentBrand: paymentDetails.brand || 'visa',
      subscriptionStart: new Date().toISOString(),
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('rococo_prive_user', JSON.stringify(userData));
    
    const initialData = {
      profile: {
        name: userName,
        email: userEmail,
        location: '',
        age: '',
        description: '',
        phone: '',
        whatsapp: '',
        horario: '',
        idioma: '',
        altura: '',
        peso: '',
        medidas: '',
        ojos: '',
        pelo: '',
        services: [],
        tarifa: '',
        tarifa2: ''
      },
      photos: [],
      videos: [],
      stories: [],
      membership: selectedPlan,
      stats: { visits: 0, whatsappClicks: 0, activeAds: 0 },
      messages: [],
      isPublic: false,
      payment: {
        method: paymentDetails.last4 ? `**** ${paymentDetails.last4}` : 'card',
        brand: paymentDetails.brand || 'visa',
        date: new Date().toISOString()
      }
    };
    localStorage.setItem(`rococo_data_${userEmail}`, JSON.stringify(initialData));
    
    setShowStripeCheckout(false);
    setPaymentSuccess(true);
    
    setTimeout(() => {
      onNavigate('dashboard');
    }, 1500);
  };

  const handlePaymentCancel = () => {
    setShowStripeCheckout(false);
  };

  const processPayment = () => {
    if (!name.trim() || !email.trim()) {
      setError('Por favor ingresa tu nombre y correo.');
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      const userData = {
        email: email || 'nuevo@usuario.com',
        name: name || email?.split('@')[0] || 'Usuario',
        membership: selectedPlan,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('rococo_prive_user', JSON.stringify(userData));
      
      const initialData = {
        profile: {
          name: name || email?.split('@')[0] || 'Usuario',
          email: email || 'nuevo@usuario.com',
          location: '',
          age: '',
          description: '',
          phone: '',
          whatsapp: '',
          horario: '',
          idioma: '',
          altura: '',
          peso: '',
          medidas: '',
          ojos: '',
          pelo: '',
          services: [],
          tarifa: '',
          tarifa2: ''
        },
        photos: [],
        videos: [],
        stories: [],
        membership: selectedPlan,
        stats: { visits: 0, whatsappClicks: 0, activeAds: 0 },
        messages: [],
        isPublic: false
      };
      localStorage.setItem(`rococo_data_${email || 'nuevo@usuario.com'}`, JSON.stringify(initialData));
      
      onNavigate('dashboard');
    }, 1500);
  };

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
          <h2>Iniciar Sesión como Profesional</h2>
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input 
                type="email" 
                id="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="tu@email.com" 
                required 
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input 
                type="password" 
                id="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'INGRESANDO...' : 'INICIAR SESIÓN'}
            </button>
            <div className="google-login-divider">
              <span>O</span>
            </div>
            <GoogleLogin 
              onSuccess={handleGoogleLogin} 
              onError={(err) => setError('Error al iniciar con Google: ' + err)}
            />
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
              <input 
                type="text" 
                id="reg-name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Tu nombre"
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">Correo Electrónico</label>
              <input 
                type="email" 
                id="reg-email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="tu@email.com" 
              />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password">Contraseña</label>
              <input 
                type="password" 
                id="reg-password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
              />
            </div>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? 'CREANDO CUENTA...' : 'CREAR CUENTA'}
            </button>
            <div className="google-login-divider">
              <span>O</span>
            </div>
            <GoogleLogin 
              onSuccess={handleGoogleLogin} 
              onError={(err) => setError('Error al registrarse con Google: ' + err)}
            />
            <button type="button" className="btn-link" onClick={() => { setRegisterMode(false); setLoginMode(true); setError(''); }}>
              ¿Ya tienes cuenta? Inicia sesión
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
                <li><Check size={16} /> Hasta {MembershipPlans.free.photos} fotos en tu galería</li>
                <li><Check size={16} /> Perfil básico visible</li>
                <li><Check size={16} /> Publicidad básica</li>
              </ul>
              <button className="btn-join" onClick={() => handleSelectPlan('free')}>REGISTRARSE</button>
              <p className="price-tag">GRATIS</p>
            </div>

            <div className="option-card glass-effect highlighted">
              <div className="popular-tag">RECOMENDADO</div>
              <h2>MEMBRESÍA PREMIUM</h2>
              <p>Más visibilidad y herramientas para crecer.</p>
              <ul>
                <li><Check size={16} /> Hasta {MembershipPlans.premium.photos} fotos en tu galería</li>
                <li><Check size={16} /> Hasta {MembershipPlans.premium.videos} videos en tu perfil</li>
                <li><Check size={16} /> Publicidad con prioridad en búsquedas</li>
                <li><Check size={16} /> Mayor exposición en tu perfil</li>
                <li><Check size={16} /> Acceso a eventos exclusivos</li>
              </ul>
              <button className="btn-join-filled" onClick={() => handleSelectPlan('premium')}>SUSCRIBIRSE</button>
              <p className="price-tag">${MembershipPlans.premium.price}/mes</p>
            </div>

            <div className="option-card glass-effect">
              <h2>MEMBRESÍA ÉLITE</h2>
              <p>El nivel máximo para profesionales destacados.</p>
              <ul>
                <li><Check size={16} /> Hasta {MembershipPlans.elite.photos} fotos en tu galería</li>
                <li><Check size={16} /> Hasta {MembershipPlans.elite.videos} videos en tu perfil</li>
                <li><Check size={16} /> Publicidad máxima y posicionamiento #1</li>
                <li><Check size={16} /> Acceso VIP a eventos y fiestas privadas</li>
                <li><Check size={16} /> Historias ilimitadas permanentes</li>
                <li><Check size={16} /> Soporte prioritario 24/7</li>
              </ul>
              <button className="btn-join-filled" onClick={() => handleSelectPlan('elite')}>SUSCRIBIRSE</button>
              <p className="price-tag">${MembershipPlans.elite.price}/mes</p>
            </div>
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

      {showPayment && selectedPlan === 'free' && (
        <div className="free-confirmation">
          <div className="free-confirm-box glass-effect">
            <button className="close-payment" onClick={() => setShowPayment(false)}>×</button>
            <h3>¡Únete Gratis!</h3>
            <p>Con el plan gratuito tendrás:</p>
            <ul>
              <li><Check size={16} /> Hasta {MembershipPlans.free.photos} fotos</li>
              <li><Check size={16} /> Perfil básico</li>
              <li><Check size={16} /> Visibilidad básica</li>
            </ul>
            
            <form onSubmit={handleRegister} className="free-register-form">
              <div className="form-group">
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  required
                />
              </div>
              <div className="form-group">
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <div className="form-group">
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Crea una contraseña"
                  required
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="btn-join-filled" disabled={isLoading}>
                {isLoading ? 'CREANDO CUENTA...' : 'COMENZAR AHORA'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showPayment && (selectedPlan === 'premium' || selectedPlan === 'elite') && (
        <div className="payment-modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="payment-modal glass-effect" onClick={e => e.stopPropagation()}>
            <button className="close-payment" onClick={() => setShowPayment(false)}>×</button>
            <h2>💳 Paga tu Membresía</h2>
            <p className="payment-plan-name">
              Plan {MembershipPlans[selectedPlan]?.name} - ${MembershipPlans[selectedPlan]?.price}/mes
            </p>
            
            <div className="payment-methods-grid">
              <div className="payment-method-btn active">
                <span className="method-icon">🟢</span>
                <span className="method-name">Mercado Pago</span>
                <span className="method-desc">Tarjetas, Transferencia, Rapipago, PagoFácil</span>
              </div>
            </div>

            <div className="login-section-mini">
              <p className="mini-label">Ingresa tus datos para continuar:</p>
              <div className="form-group">
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                />
              </div>
              <div className="form-group">
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </div>
              <div className="form-group">
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                />
              </div>
            </div>

            <button 
              className="btn-process-payment" 
              onClick={() => {
                setShowPayment(false);
                setShowMercadoPagoCheckout(true);
              }} 
              disabled={isLoading}
            >
              {isLoading ? 'PROCESANDO...' : 'PROCEDER AL PAGO'}
            </button>
          </div>
        </div>
      )}

      {showMercadoPagoCheckout && (
        <MercadoPagoCheckout 
          selectedPlan={selectedPlan}
          userData={{
            name: name || email?.split('@')[0] || 'Usuario',
            email: email || 'usuario@ejemplo.com'
          }}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setShowMercadoPagoCheckout(false)}
          isDemoMode={true}
        />
      )}

      {paymentSuccess && (
        <div className="payment-success-overlay">
          <div className="payment-success-modal glass-effect">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h2>¡Pago Exitoso!</h2>
            <p>Tu membresía {MembershipPlans[selectedPlan]?.name} ha sido activada</p>
            <p className="redirect-msg">Redirigiendo al dashboard...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Membership;
