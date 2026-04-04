import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, MessageSquare, Phone, MapPin, Star, ShieldCheck, ChevronRight, Info } from 'lucide-react';
import PhotoGallery from '../PhotoGallery/PhotoGallery';
import './ProfileDetail.css';

const ProfileDetail = ({ profile, onClose }) => {
  const [activeTab, setActiveTab] = useState('photos');

  const formatPrice = (p) => {
    if (!p) return 'Consultar';
    if (typeof p === 'number') {
      return p > 1000 ? `$${p.toLocaleString('es-CL')}` : `$${p}`;
    }
    return p;
  };

  const formatPhoneForWhatsApp = (phone) => {
    if (!phone) return '';
    let clean = phone.replace(/[^0-9]/g, '');
    
    if (clean.startsWith('0')) {
      clean = clean.substring(1);
    }
    
    if (clean.startsWith('56') || clean.startsWith('54') || clean.startsWith('51') || clean.startsWith('57') || clean.startsWith('52') || 
        clean.startsWith('34') || clean.startsWith('1')) {
      return clean;
    }
    
    if (clean.length === 9 && (clean.startsWith('9') || clean.startsWith('8') || clean.startsWith('7'))) {
      return '56' + clean;
    }
    
    if (clean.length === 10 && clean.startsWith('9')) {
      return '56' + clean;
    }
    
    return clean;
  };

  const handleWhatsApp = () => {
    if (profile?.whatsapp) {
      const phone = formatPhoneForWhatsApp(profile.whatsapp);
      if (phone) {
        window.open(`https://wa.me/${phone}`, '_blank');
      } else {
        alert('El número de WhatsApp no está disponible.');
      }
    } else if (profile?.phone) {
      const phone = formatPhoneForWhatsApp(profile.phone);
      if (phone) {
        window.open(`https://wa.me/${phone}`, '_blank');
      } else {
        alert('El número de WhatsApp no está disponible.');
      }
    } else {
      alert('El número de WhatsApp no está disponible.');
    }
  };

  const handleCall = () => {
    if (profile?.phone) {
      const phone = profile.phone.replace(/[^0-9+]/g, '');
      window.open(`tel:${phone}`, '_blank');
    } else if (profile?.whatsapp) {
      const phone = profile.whatsapp.replace(/[^0-9+]/g, '');
      window.open(`tel:${phone}`, '_blank');
    } else {
      alert('El número telefónico no está disponible.');
    }
  };

  useEffect(() => {
    if (profile) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [profile]);

  if (!profile) {
    return null;
  }

  // Solo usar datos reales del perfil
  const bio = profile.bio && typeof profile.bio === 'object' ? profile.bio : {};
  
  const characteristics = [
    { label: 'Edad', value: bio.age || 'No especificada' },
    { label: 'Estatura', value: bio.altura ? `${bio.altura} cm` : 'No especificada' },
    { label: 'Peso', value: bio.peso ? `${bio.peso} kg` : 'No especificado' },
    { label: 'Medidas', value: bio.medidas || 'No especificadas' },
    { label: 'Ojos', value: bio.ojos || 'No especificados' },
    { label: 'Cabello', value: bio.pelo || 'No especificado' },
    { label: 'Idiomas', value: bio.idiomas || 'No especificados' },
    { label: 'Horario', value: bio.horario || 'No especificado' },
  ].filter(c => c.value !== 'No especificada' && c.value !== 'No especificado' && c.value !== 'No especificadas' && c.value !== 'No especificados');

  const userServices = profile.services && profile.services.length > 0 
    ? profile.services.map(s => ({ name: typeof s === 'string' ? s : s.name, premium: false }))
    : [];

  // Solo usar fotos reales del perfil
  const displayPhotos = profile.photos && profile.photos.length > 0 
    ? profile.photos.map(p => typeof p === 'string' ? p : p.url).filter(url => url && url.length > 0)
    : [];

  const content = (
    <div className="profile-detail-overlay">
      <div className="profile-detail-container">
        <div className="profile-detail-controls">
          <button className="back-profile-btn" onClick={onClose}>
            <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} /> <span>VOLVER</span>
          </button>
          <button className="close-profile-btn" onClick={onClose} aria-label="Cerrar perfil">
            <X size={24} />
          </button>
        </div>

        <div className="profile-detail-layout">
          <div className="detail-main-content">
            <header className="detail-header">
              <div className="detail-title-row">
                <h1>{profile.name || 'Perfil'} <ShieldCheck className="verified-icon" size={24} /></h1>
                <div className="detail-price-badge">{formatPrice(profile?.price || bio.tarifa)}</div>
              </div>
              <div className="detail-location">
                <MapPin size={16} /> {profile.location || bio.location || 'Ubicación no especificada'}
              </div>
            </header>

            <div className="detail-tabs-nav">
              <button 
                className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
                onClick={() => setActiveTab('photos')}
              >
                ÁLBUM {displayPhotos.length > 0 && `(${displayPhotos.length})`}
              </button>
              <button 
                className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => setActiveTab('info')}
              >
                INFO
              </button>
            </div>

            <div className="tab-content-area">
              {activeTab === 'photos' ? (
                displayPhotos.length > 0 ? (
                  <PhotoGallery photos={displayPhotos} />
                ) : (
                  <div className="no-photos-message">
                    <p>Este perfil aún no tiene fotos.</p>
                  </div>
                )
              ) : (
                <div className="info-tab-pane">
                  {characteristics.length > 0 && (
                    <div className="info-section">
                      <h3><Star size={18} className="icon-gold" /> CARACTERÍSTICAS</h3>
                      <div className="characteristics-grid">
                        {characteristics.map((c, i) => (
                          <div key={i} className="char-item">
                            <span className="char-label">{c.label}</span>
                            <span className="char-value">{c.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bio.description && (
                    <div className="info-section">
                      <h3><Info size={18} className="icon-gold" /> SOBRE MÍ</h3>
                      <p className="profile-bio">{bio.description}</p>
                    </div>
                  )}

                  {userServices.length > 0 && (
                    <div className="info-section">
                      <h3><ChevronRight size={18} className="icon-gold" /> SERVICIOS</h3>
                      <div className="services-tags">
                        {userServices.map((s, i) => (
                          <span key={i} className="service-tag">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {characteristics.length === 0 && !bio.description && userServices.length === 0 && (
                    <div className="empty-profile-info">
                      <p>Este perfil aún no tiene información completa.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="detail-sidebar-actions">
            <div className="action-card-sticky glass-effect">
              <div className="profile-mini-status">
                <span className="status-dot-pulse"></span> DISPONIBLE AHORA
              </div>
              <p className="reserva-text">Reserva una experiencia exclusiva con {profile.name}.</p>
              
              <div className="action-buttons-stack">
                <button className="btn-contact btn-whatsapp" onClick={handleWhatsApp}>
                  <MessageSquare size={18} /> WHATSAPP
                </button>
                <button className="btn-contact btn-call" onClick={handleCall}>
                  <Phone size={18} /> LLAMAR AHORA
                </button>
              </div>
            </div>

            <div className="security-notice glass-effect">
              <ShieldCheck size={20} className="icon-gold" />
              <p>Perfil verificado por Rococo Privé.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default ProfileDetail;
