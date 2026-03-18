import React from 'react';
import './Footer.css';

const Footer = () => {
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
            <a href="#">𝕏</a>
            <a href="#">📸</a>
            <a href="#">✉️</a>
          </div>
        </div>

        <div className="footer-links-group">
          <h4>Explorar</h4>
          <ul>
            <li><a href="#">Todos los Perfiles</a></li>
            <li><a href="#">Recién Llegados</a></li>
            <li><a href="#">Categorías VIP</a></li>
            <li><a href="#">Blog de Estilo de Vida</a></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>Soporte</h4>
          <ul>
            <li><a href="#">Preguntas Frecuentes</a></li>
            <li><a href="#">Centro de Seguridad</a></li>
            <li><a href="#">Términos de Servicio</a></li>
            <li><a href="#">Política de Privacidad</a></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>Membresía</h4>
          <p>¿Eres profesional? Únete a nuestra red exclusiva hoy mismo.</p>
          <button className="btn-primary" style={{ marginTop: '20px' }}>PUBLICAR ANUNCIO</button>
        </div>
      </div>

      <div className="footer-bottom container">
        <p>&copy; 2024 ROCOCO PRIVÉ. TODOS LOS DERECHOS RESERVADOS.</p>
        <div className="bottom-badges">
          <span>🔒 100% DISCRETO</span>
          <span>✅ VERIFICACIÓN REAL</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
