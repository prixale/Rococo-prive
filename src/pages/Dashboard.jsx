import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, User, Megaphone, MessageSquare, CreditCard, LogOut, Plus, 
  ChevronRight, ShieldCheck, Camera, Upload, X, Save, Image, Video, 
  MapPin, Clock, Check, Loader2, AlertCircle
} from 'lucide-react';
import MapContainer from '../components/Map/MapContainer';
import './Dashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const MembershipPlans = {
  free: { name: 'Gratis', photos: 10, videos: 0, price: 0 },
  premium: { name: 'Premium', photos: 20, videos: 5, price: 19990 },
  elite: { name: 'Élite', photos: 50, videos: 20, price: 29990 }
};

const Dashboard = ({ onNavigate, userLocation }) => {
  const [activeTab, setActiveTab] = useState('panel');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [profileData, setProfileData] = useState({
    name: '', email: '', location: '', age: '', description: '',
    phone: '', whatsapp: '', services: [], horario: '',
    altura: '', peso: '', medidas: '', ojos: '', pelo: '',
    tarifa: '', tarifa2: ''
  });

  const [photos, setPhotos] = useState([]);
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      onNavigate('membership');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onNavigate('membership');
        return;
      }

      const data = await res.json();
      const userData = data.user;
      const profile = data.profile;
      
      setUser(userData);
      
      if (profile) {
        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          location: profile.bio?.location || '',
          age: profile.bio?.age || '',
          description: profile.bio?.description || '',
          phone: userData.phone || '',
          whatsapp: profile.bio?.whatsapp || '',
          services: profile.bio?.services || [],
          horario: profile.bio?.horario || '',
          altura: profile.bio?.altura || '',
          peso: profile.bio?.peso || '',
          medidas: profile.bio?.medidas || '',
          ojos: profile.bio?.ojos || '',
          pelo: profile.bio?.pelo || '',
          tarifa: profile.bio?.tarifa || '',
          tarifa2: profile.bio?.tarifa2 || ''
        });
        setPhotos(profile.photos || []);
        setIsProfilePublic(profile.is_public || false);
      } else {
        setProfileData(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || ''
        }));
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Error cargando tu perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bio: {
            name: profileData.name,
            location: profileData.location,
            age: profileData.age,
            description: profileData.description,
            whatsapp: profileData.whatsapp,
            services: profileData.services,
            horario: profileData.horario,
            altura: profileData.altura,
            peso: profileData.peso,
            medidas: profileData.medidas,
            ojos: profileData.ojos,
            pelo: profileData.pelo,
            tarifa: profileData.tarifa,
            tarifa2: profileData.tarifa2
          },
          photos: photos,
          is_public: isProfilePublic
        })
      });

      if (!res.ok) {
        throw new Error('Error al guardar');
      }

      alert('Perfil guardado correctamente');
    } catch (err) {
      setError('Error al guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const publishProfile = async () => {
    if (!profileData.name || photos.length === 0) {
      setError('Necesitas al menos tu nombre y una foto para publicar.');
      return;
    }

    setPublishing(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          bio: {
            name: profileData.name,
            location: profileData.location,
            age: profileData.age,
            description: profileData.description,
            whatsapp: profileData.whatsapp,
            services: profileData.services,
            horario: profileData.horario,
            altura: profileData.altura,
            peso: profileData.peso,
            medidas: profileData.medidas,
            ojos: profileData.ojos,
            pelo: profileData.pelo,
            tarifa: profileData.tarifa,
            tarifa2: profileData.tarifa2
          },
          photos: photos,
          is_public: true
        })
      });

      if (!res.ok) throw new Error('Error al publicar');

      setIsProfilePublic(true);
      alert('¡Tu perfil ha sido publicado!');
    } catch (err) {
      setError('Error al publicar el perfil');
    } finally {
      setPublishing(false);
    }
  };

  const unpublishProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_public: false })
      });
      setIsProfilePublic(false);
      alert('Tu perfil ha sido ocultado.');
    } catch (err) {
      setError('Error al ocultar el perfil');
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPhotos(prev => [...prev, { 
            id: Date.now() + Math.random(), 
            url: ev.target.result, 
            name: file.name 
          }]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const deletePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onNavigate('home');
  };

  if (loading) {
    return <div className="loading-screen">Cargando...</div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'panel':
        return (
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <section className="stats-grid">
              <motion.div className="stat-card glass-effect" variants={itemVariants}>
                <div className="stat-icon-bg"><User size={20} /></div>
                <div className="stat-info">
                  <label>MIEMBRESÍA</label>
                  <div className="stat-value">{MembershipPlans.free.name}</div>
                </div>
              </motion.div>
              <motion.div className="stat-card glass-effect" variants={itemVariants}>
                <div className="stat-icon-bg"><Image size={20} /></div>
                <div className="stat-info">
                  <label>FOTOS</label>
                  <div className="stat-value">{photos.length}</div>
                </div>
              </motion.div>
              <motion.div className="stat-card glass-effect" variants={itemVariants}>
                <div className="stat-icon-bg"><ShieldCheck size={20} /></div>
                <div className="stat-info">
                  <label>ESTADO</label>
                  <div className="stat-value">{isProfilePublic ? 'Publicado' : 'Oculto'}</div>
                </div>
              </motion.div>
            </section>
            
            {userLocation && (
              <motion.section className="dashboard-section" variants={itemVariants}>
                <div className="section-title"><MapPin size={20} className="icon-gold" /> Mi Ubicación</div>
                <MapContainer 
                  center={{ lat: userLocation.lat || -33.4489, lng: userLocation.lon || -70.6693 }} 
                  zoom={13} 
                />
              </motion.section>
            )}
          </motion.div>
        );
      case 'perfil':
        return (
          <motion.section className="dashboard-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="section-title"><User size={20} className="icon-gold" /> Mi Perfil Profesional</div>
            
            <div className="profile-publish-banner glass-effect">
              <div className="publish-status">
                {isProfilePublic ? (
                  <>
                    <Check size={20} className="status-icon published" />
                    <div>
                      <strong>Tu perfil está publicado</strong>
                      <p>Apareces en el buscador y en la página de inicio</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock size={20} className="status-icon unpublished" />
                    <div>
                      <strong>Tu perfil no está visible</strong>
                      <p>Publica tu perfil para aparecer en el buscador</p>
                    </div>
                  </>
                )}
              </div>
              {isProfilePublic ? (
                <button className="btn-unpublish" onClick={unpublishProfile}>OCULTAR PERFIL</button>
              ) : (
                <button className="btn-publish" onClick={publishProfile} disabled={publishing}>
                  {publishing ? 'PUBLICANDO...' : 'PUBLICAR MI PERFIL'}
                </button>
              )}
            </div>

            {error && (
              <div className="error-banner">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <div className="profile-edit-form glass-effect">
              <h4>Información Personal</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Nombre</label>
                  <input type="text" name="name" value={profileData.name} onChange={handleProfileChange} placeholder="Tu nombre" />
                </div>
                <div className="form-group">
                  <label>Ubicación</label>
                  <div className="location-input-group">
                    <input type="text" name="location" value={profileData.location} onChange={handleProfileChange} placeholder="Ciudad, País" />
                    {userLocation && (
                      <button type="button" className="btn-detect-location" onClick={() => setProfileData(prev => ({ ...prev, location: userLocation.fullLocation }))}>
                        <MapPin size={14} /> {userLocation.city || userLocation.country}
                      </button>
                    )}
                  </div>
                </div>
                <div className="form-group">
                  <label>Edad</label>
                  <input type="number" name="age" value={profileData.age} onChange={handleProfileChange} placeholder="25" />
                </div>
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input type="tel" name="whatsapp" value={profileData.whatsapp} onChange={handleProfileChange} placeholder="+56 9 1234 5678" />
                </div>
              </div>

              <h4>Características Físicas</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Altura (cm)</label>
                  <input type="text" name="altura" value={profileData.altura} onChange={handleProfileChange} placeholder="170" />
                </div>
                <div className="form-group">
                  <label>Peso (kg)</label>
                  <input type="text" name="peso" value={profileData.peso} onChange={handleProfileChange} placeholder="55" />
                </div>
                <div className="form-group">
                  <label>Medidas</label>
                  <input type="text" name="medidas" value={profileData.medidas} onChange={handleProfileChange} placeholder="90-60-90" />
                </div>
                <div className="form-group">
                  <label>Ojos</label>
                  <input type="text" name="ojos" value={profileData.ojos} onChange={handleProfileChange} placeholder="Castaños" />
                </div>
                <div className="form-group">
                  <label>Pelo</label>
                  <input type="text" name="pelo" value={profileData.pelo} onChange={handleProfileChange} placeholder="Castaño" />
                </div>
                <div className="form-group">
                  <label>Horario</label>
                  <input type="text" name="horario" value={profileData.horario} onChange={handleProfileChange} placeholder="24/7" />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Descripción</label>
                <textarea name="description" rows="4" value={profileData.description} onChange={handleProfileChange} placeholder="Cuéntanos sobre ti..." />
              </div>

              <h4>Tarifas</h4>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tarifa Incall (1 hora)</label>
                  <input type="text" name="tarifa" value={profileData.tarifa} onChange={handleProfileChange} placeholder="$50.000 CLP" />
                </div>
                <div className="form-group">
                  <label>Tarifa Outcall (1 hora)</label>
                  <input type="text" name="tarifa2" value={profileData.tarifa2} onChange={handleProfileChange} placeholder="$70.000 CLP" />
                </div>
              </div>

              <div className="form-actions">
                <button className="btn-save-profile" onClick={handleSaveProfile}>
                  {saving ? <><Loader2 size={16} className="spin" /> Guardando...</> : <><Save size={16} /> GUARDAR CAMBIOS</>}
                </button>
              </div>
            </div>

            <div className="gallery-section glass-effect">
              <div className="gallery-header">
                <h4><Image size={18} /> Fotos ({photos.length})</h4>
                <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" multiple style={{ display: 'none' }} />
                <button className="btn-upload" onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} /> Subir Fotos
                </button>
              </div>
              <div className="gallery-grid">
                {photos.map(photo => (
                  <div key={photo.id} className="gallery-item">
                    <img src={photo.url} alt={photo.name} />
                    <button className="btn-delete-photo" onClick={() => deletePhoto(photo.id)}><X size={16} /></button>
                  </div>
                ))}
                {photos.length === 0 && (
                  <div className="empty-gallery-message">
                    <Camera size={32} />
                    <p>No hay fotos. Sube al menos una foto.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        );
      case 'anuncios':
        return (
          <motion.section className="dashboard-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="section-title"><Megaphone size={20} className="icon-gold" /> Mis Anuncios</div>
            <div className="ad-card glass-effect">
              <div className="ad-info">
                <h4>Mi Perfil Público</h4>
                <p>Estado: {isProfilePublic ? 'Publicado' : 'Oculto'}</p>
              </div>
              <div className="ad-actions">
                {isProfilePublic ? (
                  <button className="btn-unpublish" onClick={unpublishProfile}>OCULTAR</button>
                ) : (
                  <button className="btn-publish" onClick={publishProfile}>PUBLICAR</button>
                )}
              </div>
            </div>
          </motion.section>
        );
      case 'suscripciones':
        return (
          <motion.section className="dashboard-section" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="section-title"><CreditCard size={20} className="icon-gold" /> Membresía</div>
            <div className="membership-current glass-effect">
              <h3>Plan Actual: Gratis</h3>
              <p>Actualiza para obtener más visibilidad.</p>
              <button className="btn-primary" onClick={() => onNavigate('membership')} style={{ marginTop: '1rem' }}>
                ACTUALIZAR PLAN
              </button>
            </div>
          </motion.section>
        );
      default:
        return null;
    }
  };

  const navItems = [
    { id: 'panel', label: 'Panel', icon: <BarChart3 size={18} /> },
    { id: 'perfil', label: 'Mi Perfil', icon: <User size={18} /> },
    { id: 'anuncios', label: 'Anuncios', icon: <Megaphone size={18} /> },
    { id: 'suscripciones', label: 'Membresía', icon: <CreditCard size={18} /> },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
           <img src="/assets/logo_r.svg" alt="R" className="sidebar-logo" />
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div key={item.id} className={`nav-item ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
              {item.icon}
              <span>{item.label}</span>
              {activeTab === item.id && <motion.div className="active-indicator" layoutId="activeInd" />}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn-back-sidebar" onClick={() => onNavigate('home')}>
            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> <span>Volver</span>
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} /> <span>Salir</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-top">
          <div className="welcome">
            <motion.h2 key={activeTab} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              Hola, {profileData.name || user?.name || 'Bienvenida'} <span className="text-gold">{activeTab.toUpperCase()}</span>
            </motion.h2>
          </div>
          <div className="top-actions">
            {activeTab !== 'perfil' && (
              <motion.button className="btn-create-top" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setActiveTab('perfil')}>
                + EDITAR PERFIL
              </motion.button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Dashboard;
