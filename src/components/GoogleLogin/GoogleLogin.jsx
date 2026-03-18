import React, { useState } from 'react';
import { GoogleOAuthProvider, GoogleLogin, useGoogleLogin } from '@react-oauth/google';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';

const GoogleLoginComponent = ({ onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isProduction = import.meta.env.MODE === 'production';

  const handleCredentialResponse = async (response) => {
    setLoading(true);
    setError(null);

    try {
      const tokenResponse = response;
      
      if (!tokenResponse.credential) {
        throw new Error('No se recibió credencial de Google');
      }

      const base64Url = tokenResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const userInfo = JSON.parse(jsonPayload);

      if (!userInfo.email) {
        throw new Error('No se pudo obtener el correo electrónico');
      }

      const userData = {
        email: userInfo.email,
        name: userInfo.given_name || userInfo.name || userInfo.email.split('@')[0],
        membership: 'free',
        timestamp: new Date().toISOString(),
        googleId: userInfo.sub,
        avatar: userInfo.picture,
        verified: userInfo.email_verified
      };

      if (isProduction && !userInfo.email_verified) {
        setError('Por favor, verifica tu correo electrónico de Google antes de continuar');
        setLoading(false);
        return;
      }

      await onSuccess(userData);
    } catch (err) {
      console.error('Error en Google Login:', err);
      const errorMessage = err.message || 'Error al iniciar sesión con Google';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleError = (error) => {
    console.error('Google Login Error:', error);
    const errorMessage = 'Error al iniciar sesión con Google. Intenta de nuevo.';
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  };

  if (!clientId) {
    return (
      <div className="google-login-error">
        <AlertCircle size={20} />
        <span>Configuración de Google OAuth no disponible</span>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="google-login-container">
        {error && (
          <div className="google-login-error-message">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}
        
        <GoogleLogin
          onSuccess={handleCredentialResponse}
          onError={handleError}
          cookiePolicy={'single_host_origin'}
          useOneTap={false}
          auto_select={false}
          cancel_on_tap_outside={false}
          theme="filled_black"
          size="large"
          text="signin_with"
          shape="rectangular"
          logo_alignment="left"
        />
        
        {loading && (
          <div className="google-login-loading">
            <Loader2 size={20} className="spin" />
            <span>Procesando...</span>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
};

export default GoogleLoginComponent;
