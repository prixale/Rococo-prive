import React, { useState, useEffect } from 'react';
import { ChevronRight, Calendar, Clock, User, Mail, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import './Bookings.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Bookings = ({ onNavigate }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    provider_id: '',
    duration_hours: 2,
    start_time: '',
    notes: ''
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profiles/public`);
      const data = await res.json();
      setProviders(data.profiles || []);
    } catch (err) {
      console.error('Error loading providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Debes iniciar sesión para hacer una reserva.');
      return;
    }

    if (!formData.provider_id || !formData.start_time) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setFormData({ provider_id: '', duration_hours: 2, start_time: '', notes: '' });
      } else {
        setError(data.error || 'Error al crear la reserva.');
      }
    } catch (err) {
      setError('Error de conexión. Verifica tu internet.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'duration_hours' ? parseInt(value) : value }));
  };

  const selectedProvider = providers.find(p => p.id === parseInt(formData.provider_id));

  if (success) {
    return (
      <div className="bookings-page container">
        <div className="bookings-card glass-effect">
          <div className="booking-success">
            <CheckCircle size={64} className="success-icon" />
            <h2>¡Reserva Enviada!</h2>
            <p>Tu solicitud ha sido enviada correctamente. Te contactaremos pronto para confirmar los detalles.</p>
            <div className="success-actions">
              <button className="btn-primary" onClick={() => { setSuccess(false); }}>Nueva Reserva</button>
              <button className="btn-secondary" onClick={() => onNavigate('home')}>Volver al Inicio</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {error && (
          <div className="booking-error">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form className="bookings-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label><User size={16} /> Profesional de Interés</label>
            <select name="provider_id" value={formData.provider_id} onChange={handleChange} required>
              <option value="">Seleccionar profesional...</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name || 'Sin nombre'} - {p.location || 'Sin ubicación'}</option>
              ))}
            </select>
          </div>

          {selectedProvider && (
            <div className="provider-preview">
              <div className="provider-info">
                {selectedProvider.photos?.[0]?.url && (
                  <img src={selectedProvider.photos[0].url} alt={selectedProvider.name} className="provider-thumb" />
                )}
                <div>
                  <h4>{selectedProvider.name}</h4>
                  <p>{selectedProvider.location}</p>
                </div>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label><Calendar size={16} /> Fecha y Hora</label>
              <input 
                type="datetime-local" 
                name="start_time" 
                value={formData.start_time} 
                onChange={handleChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label><Clock size={16} /> Duración</label>
              <select name="duration_hours" value={formData.duration_hours} onChange={handleChange}>
                <option value={1}>1 Hora</option>
                <option value={2}>2 Horas</option>
                <option value={3}>3 Horas</option>
                <option value={4}>4 Horas</option>
                <option value={6}>6 Horas</option>
                <option value={12}>12 Horas (Medio día)</option>
                <option value={24}>24 Horas (Día completo)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label><FileText size={16} /> Notas Adicionales (opcional)</label>
            <textarea 
              name="notes" 
              value={formData.notes} 
              onChange={handleChange} 
              placeholder="Detalles especiales, preferencias, ubicación..."
              rows="3"
            />
          </div>

          <button type="submit" className="btn-book-now" disabled={submitting}>
            {submitting ? (
              <><Loader2 size={18} className="spin" /> ENVIANDO...</>
            ) : (
              'ENVIAR SOLICITUD'
            )}
          </button>
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
