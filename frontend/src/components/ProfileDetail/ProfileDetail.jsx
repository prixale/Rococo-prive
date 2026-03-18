import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, MessageSquare, Phone, MapPin, Star, ShieldCheck, ChevronRight, Info } from 'lucide-react';
import PhotoGallery from '../PhotoGallery/PhotoGallery';
import './ProfileDetail.css';

const defaultServices = [
  { name: 'Cena acompañante', premium: true },
  { name: 'Viajes internacionales', premium: true },
  { name: 'Eventos sociales y galas', premium: true },
  { name: 'Trato de novios (GFE)', premium: true },
  { name: 'Experiencia de pareja (PSE)', premium: true },
  { name: 'Compañía para eventos de negocio', premium: true },
  { name: 'Compañía para teatros y óperas', premium: true },
  { name: 'Compañía para turistas', premium: true },
  { name: 'Compañía para conciertos', premium: true },
  { name: 'Servicios de traducción e interpretación', premium: true },
  { name: 'Experiencias de arte y cultura', premium: true },
  { name: 'Experiencias de vino y cata', premium: true },
  { name: 'Servicios de acompañamiento a reuniones', premium: true },
  { name: 'Organización de viajes temáticos', premium: true },
  { name: 'Viajes de fin de semana', premium: true },
  { name: 'Servicios de compañía ejecutiva', premium: true },
  { name: 'Acompañamiento a eventos de alto nivel', premium: true },
  { name: 'Servicios de acompañamiento a premieres y estrenos', premium: true },
  { name: 'Servicios de acompañamiento a eventos deportivos', premium: true },
  { name: 'Servicios de acompañamiento a ferias y exposiciones', premium: true },
];

const ProfileDetail = ({ profile, onClose }) => {
  const [activeTab, setActiveTab] = useState('photos');

  const formatPrice = (p) => {
    if (!p) return 'Consultar';
    if (typeof p === 'number') {
      return p > 10000 ? `$${p.toLocaleString('es-CL')}` : `$${p}`;
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

  const characteristics = [
    { label: 'Edad', value: profile?.age || '24 años' },
    { label: 'Estatura', value: profile?.height || '170 cm' },
    { label: 'Cabello', value: profile?.hair || profile?.pelo || 'Castaño' },
    { label: 'Idiomas', value: profile?.languages || profile?.idiomas || 'Español, Inglés' },
  ];

  const userServices = profile?.services && profile.services.length > 0 
    ? profile.services.map(s => ({ name: s, premium: false }))
    : defaultServices;

  const albumPhotos = profile ? [
    profile.image,
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=687',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=720',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=687',
    'https://images.unsplash.com/photo-1539109136881-3be06109e7c6?auto=format&fit=crop&q=80&w=687',
  ].filter(img => img && img.length > 0) : [];

  const displayPhotos = albumPhotos.length > 0 
    ? albumPhotos 
    : ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=687'];

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
                <h1>{profile.name || 'Escort'} <ShieldCheck className="verified-icon" size={24} /></h1>
                <div className="detail-price-badge">{formatPrice(profile?.price)}€+</div>
              </div>
              <div className="detail-location">
                <MapPin size={16} /> {profile.location || 'Chile'}
              </div>
            </header>

            <div className="detail-tabs-nav">
              <button 
                className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
                onClick={() => setActiveTab('photos')}
              >
                ÁLBUM
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
                <PhotoGallery photos={displayPhotos} />
              ) : (
                <div className="info-tab-pane">
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

                  <div className="info-section">
                    <h3><Info size={18} className="icon-gold" /> SOBRE MÍ</h3>
                    <p className="profile-bio">
                      {profile?.description || 'Soy una acompañante de lujo dedicada a ofrecer compañía elegante y sofisticada para eventos sociales, cenas, viajes y momentos exclusivos. Mi enfoque es la discreción, la elegancia y la creación de experiencias inolvidables a medida.'}
                    </p>
                  </div>

                  <div className="info-section">
                    <h3><ChevronRight size={18} className="icon-gold" /> SERVICIOS</h3>
                    <div className="services-tags">
                      {userServices.map((s, i) => (
                        <span key={i} className={`service-tag ${s.premium ? 'premium' : ''}`}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
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
              
              <div className="sponsorship-section glass-effect">
                <h3>Patrocinado por:</h3>
                <div className="sponsors-logos">
                  <img src="/assets/logo_r.png" alt="Rococo Privé" className="sponsor-logo" />
                  <img src="https://via.placeholder.com/100x40?text=Lujo+Max" alt="Lujo Max" className="sponsor-logo" />
                  <img src="https://via.placeholder.com/100x40?text=Elite+Travel" alt="Elite Travel" className="sponsor-logo" />
                  <img src="https://via.placeholder.com/100x40?text=Premium+Events" alt="Premium Events" className="sponsor-logo" />
                </div>
              </div>
            </div>

            <div className="security-notice glass-effect">
              <ShieldCheck size={20} className="icon-gold" />
              <p>Perfil 100% verificado por Rococo Privé.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default ProfileDetail;
