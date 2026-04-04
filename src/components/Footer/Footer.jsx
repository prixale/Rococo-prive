import React from 'react';
import './Footer.css';

const Footer = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src="/assets/logo_emblem.png" alt="Rococo Prive" className="footer-logo-img" />
          <p className="footer-desc">
            La plataforma líder en servicios de escorts de lujo, 
            garantizando discreción, seguridad y excelencia en cada encuentro.
          </p>
          <div className="social-links">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">𝕏</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">📸</a>
            <a href="mailto:contacto@rococoprive.com" aria-label="Email">✉️</a>
          </div>
        </div>

        <div className="footer-links-group">
          <h4>Explorar</h4>
          <ul>
            <li><button onClick={() => onNavigate && onNavigate('discover')}>Todos los Perfiles</button></li>
            <li><button onClick={() => onNavigate && onNavigate('discover')}>Recién Llegados</button></li>
            <li><button onClick={() => onNavigate && onNavigate('membership')}>Categorías VIP</button></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>Soporte</h4>
          <ul>
            <li><a href="#faq">Preguntas Frecuentes</a></li>
            <li><a href="#seguridad">Centro de Seguridad</a></li>
            <li><a href="#terminos">Términos de Servicio</a></li>
            <li><a href="#privacidad">Política de Privacidad</a></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>Membresía</h4>
          <p>¿Eres profesional? Únete a nuestra red exclusiva hoy mismo.</p>
          <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => onNavigate && onNavigate('membership')}>PUBLICAR ANUNCIO</button>
        </div>
      </div>

      <div className="footer-bottom container">
        <p>&copy; {currentYear} ROCOCO PRIVÉ. TODOS LOS DERECHOS RESERVADOS.</p>
        <div className="bottom-badges">
          <span>🔒 100% DISCRETO</span>
          <span>✅ VERIFICACIÓN REAL</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
