import React from 'react';
import { ChevronRight } from 'lucide-react';
import './Bookings.css';

const Bookings = ({ onNavigate }) => {
  return (
    <div className="bookings-page container">
      <div className="bookings-card glass-effect">
        <div className="bookings-header">
           <button className="btn-back-global" onClick={() => onNavigate('home')}>
             <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> ATRÁS
           </button>
           <div className="indicator">RESERVAS PREMIUM</div>
           <h1>Solicitud de Encuentro</h1>
           <p>Garantizamos total discreción y seguridad en cada paso del proceso.</p>
        </div>

        <form className="bookings-form">
          <div className="form-row">
            <div className="form-group">
               <label>Nombre Completo</label>
               <input type="text" placeholder="Tu nombre..." />
            </div>
            <div className="form-group">
               <label>Email de Contacto</label>
               <input type="email" placeholder="tu@email.com" />
            </div>
          </div>

          <div className="form-group">
             <label>Escort de Interés</label>
             <select>
                <option>Seleccionar...</option>
                <option>Elena</option>
                <option>Valentina</option>
                <option>Sofia</option>
             </select>
          </div>

          <div className="form-row">
            <div className="form-group">
               <label>Fecha del Encuentro</label>
               <input type="date" />
            </div>
            <div className="form-group">
               <label>Duración</label>
               <select>
                  <option>2 Horas</option>
                  <option>4 Horas</option>
                  <option>Noche Completa</option>
               </select>
            </div>
          </div>

          <button type="submit" className="btn-book-now">ENVIAR SOLICITUD</button>
        </form>

        <div className="security-badges">
          <span>🛡️ Encriptación SSL</span>
          <span>🗝️ Discreción Absoluta</span>
          <span>✅ Verificado</span>
        </div>
      </div>
    </div>
  );
};

export default Bookings;
