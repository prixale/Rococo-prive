import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import './AdminLogin.css';

const ADMIN_PASSWORD_KEY = 'rococo_admin_password';
const ADMIN_HASH_KEY = 'rococo_admin_hash';

const AdminLogin = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  React.useEffect(() => {
    const savedHash = localStorage.getItem(ADMIN_HASH_KEY);
    if (!savedHash) {
      setIsFirstTime(true);
    }
  }, []);

  const hashPassword = (pwd) => {
    let hash = 0;
    for (let i = 0; i < pwd.length; i++) {
      const char = pwd.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!password) {
      setError('Por favor ingresa la contraseña');
      setLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const savedHash = localStorage.getItem(ADMIN_HASH_KEY);
    const inputHash = hashPassword(password);

    if (savedHash === inputHash) {
      localStorage.setItem(ADMIN_PASSWORD_KEY, 'true');
      window.dispatchEvent(new Event('storage'));
      onLoginSuccess();
    } else {
      setError('Contraseña incorrecta. Intenta de nuevo.');
      setPassword('');
    }

    setLoading(false);
  };

  const handleSetupPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || !confirmPassword) {
      setError('Por favor completa ambos campos');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const hash = hashPassword(newPassword);
    localStorage.setItem(ADMIN_HASH_KEY, hash);
    localStorage.setItem(ADMIN_PASSWORD_KEY, 'true');
    window.dispatchEvent(new Event('storage'));

    setLoading(false);
    onLoginSuccess();
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-background">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <motion.div 
        className="admin-login-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="admin-login-header">
          <div className="admin-logo">
            <ShieldCheck size={48} />
          </div>
          <h1>Acceso Administrador</h1>
          <p>Rococo Privé - Panel de Control</p>
        </div>

        {isFirstTime ? (
          <form onSubmit={handleSetupPassword} className="admin-login-form">
            <div className="welcome-message">
              <AlertCircle size={20} />
              <span>Primera configuración. Crea tu contraseña de administrador.</span>
            </div>

            <div className="form-group">
              <label htmlFor="new-password">Nueva Contraseña</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoFocus
                />
                <button 
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirmar Contraseña</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={20} className="spin" />
                  Configurando...
                </>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  Crear Contraseña
                </>
              )}
            </button>

            <div className="security-tips">
              <h4>Consejos de seguridad:</h4>
              <ul>
                <li>Usa al menos 8 caracteres</li>
                <li>Incluye números y símbolos</li>
                <li>No uses información personal</li>
              </ul>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="password">Contraseña de Administrador</label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  autoFocus
                />
                <button 
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}

            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={20} className="spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  Ingresar al Panel
                </>
              )}
            </button>

            <div className="reset-password-link">
              <button 
                type="button" 
                className="btn-reset"
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que quieres restablecer la contraseña? Se borrará la configuración actual.')) {
                    localStorage.removeItem(ADMIN_HASH_KEY);
                    localStorage.removeItem(ADMIN_PASSWORD_KEY);
                    window.location.reload();
                  }
                }}
              >
                Olvidé mi contraseña / Restablecer
              </button>
            </div>

            <div className="back-link">
              <a href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
                ← Volver al sitio
              </a>
            </div>
          </form>
        )}
      </motion.div>

      <div className="admin-login-footer">
        <p>🔒 Acceso restringido. Solo personal autorizado.</p>
      </div>
    </div>
  );
};

export default AdminLogin;
