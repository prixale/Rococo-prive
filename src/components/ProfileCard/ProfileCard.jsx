import React from 'react';
import { MapPin } from 'lucide-react';
import './ProfileCard.css';

const ProfileCard = ({ name, location, price, image, category, onClick, whatsapp, phone, isUserProfile, description, services }) => {
  const formatPrice = (p) => {
    if (typeof p === 'number') {
      if (p > 10000) {
        return `$${p.toLocaleString('es-CL')}`;
      }
      return `$${p}`;
    }
    return p;
  };

  const getDescriptionPreview = () => {
    if (description && description.length > 0) {
      return description.length > 60 ? description.substring(0, 60) + '...' : description;
    }
    if (services && services.length > 0) {
      return services.slice(0, 3).join(' • ') + (services.length > 3 ? '...' : '');
    }
    return 'ESCORT DE LUJO';
  };

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const phoneToUse = whatsapp || phone;
    if (phoneToUse) {
      let clean = phoneToUse.replace(/[^0-9]/g, '');
      if (clean.startsWith('0')) {
        clean = clean.substring(1);
      }
      if (!clean.startsWith('56') && !clean.startsWith('54') && !clean.startsWith('51') && 
          !clean.startsWith('57') && !clean.startsWith('52') && !clean.startsWith('34') && !clean.startsWith('1')) {
        if (clean.length === 9) {
          clean = '56' + clean;
        }
      }
      window.open(`https://wa.me/${clean}`, '_blank');
    }
  };

  const handleCall = (e) => {
    e.stopPropagation();
    const phoneToUse = phone || whatsapp;
    if (phoneToUse) {
      const clean = phoneToUse.replace(/[^0-9+]/g, '');
      window.open(`tel:${clean}`, '_blank');
    }
  };

  return (
    <div className="profile-card" onClick={onClick}>
      <div className="image-container">
        {category && <div className="category-tag">{category.toUpperCase()}</div>}
        {isUserProfile && <div className="user-badge">NUEVO</div>}
        <img src={image} alt={name} />
        <div className="location-badge">
          <MapPin size={10} /> {location?.split(',')[0]?.toUpperCase() || location?.toUpperCase()}
        </div>
      </div>
      <div className="profile-info">
        <div className="profile-header">
          <h3>{name}</h3>
          <span className="price-mini">{formatPrice(price)}</span>
        </div>
        <p className="description">{getDescriptionPreview()}</p>
        
        <div className="contact-actions-card">
          <button className="btn-view-profile" onClick={onClick}>
            VER PERFIL
          </button>
          <div className="other-card-btns">
            <button 
              className="btn-whatsapp-small" 
              onClick={handleWhatsApp}
              disabled={!whatsapp && !phone}
            >
              <span>💬</span>
            </button>
            <button 
              className="btn-call-small" 
              onClick={handleCall}
              disabled={!phone && !whatsapp}
            >
              <span>📞</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
