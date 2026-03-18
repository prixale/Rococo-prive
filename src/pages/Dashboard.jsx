import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  User, 
  Megaphone, 
  MessageSquare, 
  CreditCard, 
  LogOut, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MessageCircle,
  Edit,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Camera,
  Upload,
  X,
  Save,
  Image,
  Video,
  MapPin,
  Clock,
  Star,
  Check
} from 'lucide-react';
import MapContainer from '../components/Map/MapContainer';
import './Dashboard.css';

const STORAGE_KEY = 'rococo_prive_user';

const MembershipPlans = {
  free: { name: 'Gratis', photos: 10, videos: 0, price: 0 },
  premium: { name: 'Premium', photos: 20, videos: 5, price: 19.99 },
  elite: { name: 'Élite', photos: 50, videos: 20, price: 29.99 }
};

const availableServices = [
  'Acompañamiento',
  'Cenas',
  'Eventos',
  'Viajes',
  'Masaje',
  'Despedida de Soltero',
  'Fetiches',
  'Orgías',
  'Dúo',
  'Striptease',
  'Baile Erótico',
  'Juguetes',
  'Lencería',
  'Parejas',
  'Espacios Proprios',
  'Hotel',
  'Departamento',
  'Vehículo',
  'Domestic GFE',
  'PSE (Porn Star Experience)',
  'CIM (Come In Mouth)',
  'COB (Come On Body)',
  'COF (Come On Face)',
  '69 Position',
  'Blowjob (BJ)',
  'Handjob (HJ)',
  'Cunnilingus',
  'Mamada Sin Condón',
  'Sexo Anal',
  'Doble Penetración',
  'Fisting',
  'Fetichismo de Pies',
  'Bondage',
  'Dominación',
  'Sumisión',
  'Látigo',
  'Llenas',
  'Watersports',
  'Corte de Pelo',
  'Creampie',
  'Gangbang',
  'Triple Penetración',
  'Face Sitting',
  'Rimming',
  'Facesitting',
  'Breast fetish',
  'Glory Hole'
];

const Dashboard = ({ onNavigate, onProfilePublished, userLocation }) => {
  const [activeTab, setActiveTab] = useState('panel');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    location: '',
    age: '',
    description: '',
    phone: '',
    whatsapp: '',
    services: [],
    horario: '',
    idiomas: [],
    altura: '',
    peso: '',
    medidas: '',
    ojos: '',
    pelo: '',
    tatuajes: '',
    piercings: '',
    disponibilidad: '',
    tarifa: '',
    tarifa2: ''
  });

  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [stories, setStories] = useState([]);
  const [membership, setMembership] = useState('free');
  const [stats, setStats] = useState({
    visits: 0,
    whatsappClicks: 0,
    activeAds: 0
  });

  const [messages, setMessages] = useState([
    { id: 1, from: 'Cliente VIP #42', text: 'Hola, ¿estás disponible para una reserva privada mañana por la noche?', time: '5m', read: false },
    { id: 2, from: 'Carlos M.', text: 'Me interesan tus servicios. ¿Cuáles son tus horarios?', time: '2h', read: true },
    { id: 3, from: 'Andrea', text: '¡Hola! Vi tu perfil, te contactaré pronto.', time: '1d', read: true }
  ]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('chile');
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);
  const [isProfilePublic, setIsProfilePublic] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const storyInputRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      loadUserData(userData.email);
    } else {
      onNavigate('membership');
    }
    setLoading(false);
  }, []);

  const loadUserData = (email) => {
    const savedData = localStorage.getItem(`rococo_data_${email}`);
    if (savedData) {
      const data = JSON.parse(savedData);
      setProfileData(data.profile || profileData);
      setPhotos(data.photos || []);
      setVideos(data.videos || []);
      setStories(data.stories || []);
      setMembership(data.membership || 'free');
      setStats(data.stats || stats);
      setMessages(data.messages || messages);
      setIsProfilePublic(data.isPublic || false);
    }
  };

  const saveUserData = (newProfileData) => {
    if (!user) return;
    setSaving(true);
    
    const dataToSave = {
      profile: newProfileData,
      photos,
      videos,
      stories,
      membership,
      stats,
      messages,
      isPublic: isProfilePublic
    };
    
    localStorage.setItem(`rococo_data_${user.email}`, JSON.stringify(dataToSave));
    
    setTimeout(() => {
      setSaving(false);
    }, 500);
  };

  const publishProfile = () => {
    if (!profileData.name || photos.length === 0) {
      alert('Necesitas tener al menos tu nombre y una foto para publicar tu perfil.');
      return;
    }

    setPublishing(true);

    const publicProfileData = {
      id: Date.now(),
      name: profileData.name,
      email: profileData.email,
      location: profileData.location || 'Chile',
      age: profileData.age || '25',
      height: profileData.altura || '170',
      price: parseInt(profileData.tarifa?.replace(/[^0-9]/g, '')) || 50000,
      description: profileData.description || 'Profesional de élite',
      phone: profileData.phone,
      whatsapp: profileData.whatsapp,
      photos: photos,
      videos: videos,
      membership: membership,
      publishedAt: new Date().toISOString()
    };

    const existingDataStr = localStorage.getItem(`rococo_data_${user.email}`);
    if (existingDataStr) {
      const existingData = JSON.parse(existingDataStr);
      existingData.isPublic = true;
      localStorage.setItem(`rococo_data_${user.email}`, JSON.stringify(existingData));
    }

    setIsProfilePublic(true);

    if (onProfilePublished) {
      onProfilePublished(publicProfileData);
    }

    setTimeout(() => {
      setPublishing(false);
      alert('¡Tu perfil ha sido publicado! Ahora aparecerás en el buscador y en la página de inicio.');
    }, 1000);
  };

  const unpublishProfile = () => {
    setIsProfilePublic(false);
    
    const existingDataStr = localStorage.getItem(`rococo_data_${user.email}`);
    if (existingDataStr) {
      const existingData = JSON.parse(existingDataStr);
      existingData.isPublic = false;
      localStorage.setItem(`rococo_data_${user.email}`, JSON.stringify(existingData));
    }

    alert('Tu perfil ha sido ocultado del buscador.');
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = () => {
    saveUserData(profileData);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const planLimits = MembershipPlans[membership].photos;
    
    if (photos.length + files.length > planLimits) {
      alert(`Tu plan ${MembershipPlans[membership].name} permite máximo ${planLimits} fotos.`);
      return;
    }

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPhotos(prev => [...prev, { 
            id: Date.now() + Math.random(), 
            url: e.target.result, 
            name: file.name 
          }]);
        };
        reader.readAsDataURL(file);
      }
    });

    setPhotoUploadProgress(100);
    setTimeout(() => setPhotoUploadProgress(0), 1000);
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    const planLimits = MembershipPlans[membership].videos;
    
    if (videos.length + files.length > planLimits) {
      alert(`Tu plan ${MembershipPlans[membership].name} permite máximo ${planLimits} videos.`);
      return;
    }

    files.forEach(file => {
      if (file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setVideos(prev => [...prev, { 
          id: Date.now() + Math.random(), 
          url, 
          name: file.name 
        }]);
      }
    });
  };

  const deletePhoto = (id) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const deleteVideo = (id) => {
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  const handleStoryUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newStory = {
          id: Date.now(),
          url: e.target.result,
          type: 'image',
          createdAt: now.toISOString(),
          expiresAt: expiresAt.toISOString()
        };
        setStories(prev => [...prev, newStory]);
        saveUserData(profileData);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      const newStory = {
        id: Date.now(),
        url,
        type: 'video',
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      };
      setStories(prev => [...prev, newStory]);
      saveUserData(profileData);
    }
  };

  const deleteStory = (id) => {
    setStories(prev => prev.filter(s => s.id !== id));
    saveUserData(profileData);
  };

  const trackWhatsAppClick = () => {
    setStats(prev => ({
      ...prev,
      whatsappClicks: prev.whatsappClicks + 1
    }));
  };

  const trackPhoneClick = () => {
    setStats(prev => ({
      ...prev,
      phoneClicks: (prev.phoneClicks || 0) + 1
    }));
  };

  const updateStats = () => {
    setStats(prev => ({
      visits: prev.visits + Math.floor(Math.random() * 50),
      whatsappClicks: prev.whatsappClicks + Math.floor(Math.random() * 10),
      activeAds: photos.length > 0 ? 1 : 0
    }));
  };

  useEffect(() => {
    if (user) {
      const interval = setInterval(updateStats, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (user && stats) {
      const existingDataStr = localStorage.getItem(`rococo_data_${user.email}`);
      if (existingDataStr) {
        const existingData = JSON.parse(existingDataStr);
        existingData.stats = stats;
        localStorage.setItem(`rococo_data_${user.email}`, JSON.stringify(existingData));
      }
    }
  }, [stats, user]);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    onNavigate('home');
  };

  const upgradePlan = (plan) => {
    setMembership(plan);
    saveUserData(profileData);
    setShowPaymentModal(false);
  };

  const chilePaymentMethods = [
    { id: 'webpay', name: 'WebPay', icon: '💳' },
    { id: 'servipag', name: 'ServiPag', icon: '💰' },
    { id: 'multicaja', name: 'Multicaja', icon: '📦' },
    { id: 'santander', name: 'Santander', icon: '🏦' },
    { id: 'bancochile', name: 'Banco de Chile', icon: '🏛️' },
    { id: 'mercadopago', name: 'MercadoPago', icon: '💲' },
  ];

  const worldPaymentMethods = [
    { id: 'visa', name: 'Visa', icon: '💳' },
    { id: 'mastercard', name: 'Mastercard', icon: '💳' },
    { id: 'amex', name: 'American Express', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '📧' },
    { id: 'crypto', name: 'Criptomonedas', icon: '₿' },
  ];

  if (loading) {
    return <div className="loading-screen">Cargando...</div>;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
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
                 <div className="stat-icon-bg"><Eye size={20} /></div>
                 <div className="stat-info">
                   <label>VISITAS TOTALES</label>
                   <div className="stat-value">{stats.visits.toLocaleString()}</div>
                   <span className="stat-trend positive"><TrendingUp size={12} /> +{Math.floor(Math.random() * 15)}%</span>
                 </div>
               </motion.div>
               <motion.div className="stat-card glass-effect" variants={itemVariants}>
                 <div className="stat-icon-bg"><Megaphone size={20} /></div>
                 <div className="stat-info">
                   <label>ANUNCIOS ACTIVOS</label>
                   <div className="stat-value">{stats.activeAds}</div>
                   <span className="stat-trend">0%</span>
                 </div>
               </motion.div>
               <motion.div className="stat-card glass-effect" variants={itemVariants}>
                 <div className="stat-icon-bg"><MessageCircle size={20} /></div>
                 <div className="stat-info">
                   <label>CLICS EN WHATSAPP</label>
                   <div className="stat-value">{stats.whatsappClicks}</div>
                   <span className="stat-trend negative"><TrendingDown size={12} /> -{Math.floor(Math.random() * 5)}%</span>
                 </div>
               </motion.div>
             </section>
             
             <motion.section className="dashboard-section" variants={itemVariants}>
               <div className="section-title"><BarChart3 size={20} className="icon-gold" /> Rendimiento Reciente</div>
               <div className="activity-chart glass-effect">
                 <div className="premium-chart">
                   {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                     <motion.div 
                       key={i} 
                       className="chart-bar" 
                       initial={{ height: 0 }}
                       animate={{ height: `${h}%` }}
                       transition={{ delay: i * 0.1 + 0.5, duration: 1, ease: "easeOut" }}
                     />
                   ))}
                 </div>
                 <div className="chart-labels">
                   <span>LUN</span><span>MAR</span><span>MIE</span><span>JUE</span><span>VIE</span><span>SAB</span><span>DOM</span>
                 </div>
               </div>
             </motion.section>
             
              <motion.section className="dashboard-section" variants={itemVariants}>
                <div className="section-title"><Image size={20} className="icon-gold" /> Mi Galería</div>
                <div className="gallery-preview">
                  {photos.slice(0, 6).map(photo => (
                    <div key={photo.id} className="gallery-thumb">
                      <img src={photo.url} alt={photo.name} />
                    </div>
                  ))}
                  {photos.length === 0 && (
                    <p className="empty-gallery">No tienes fotos cargadas. Sube fotos en la sección de Mi Perfil.</p>
                  )}
                </div>
              </motion.section>
             
             <motion.section className="dashboard-section" variants={itemVariants}>
               <div className="section-title"><MapPin size={20} className="icon-gold" /> Mi Ubicación</div>
               {userLocation ? (
                 <MapContainer 
                   center={{ 
                     lat: userLocation.lat || -33.4489, 
                     lng: userLocation.lon || -70.6693 
                   }} 
                   zoom={13} 
                 />
               ) : (
                 <div className="glass-effect" style={{ textAlign: 'center', padding: '20px' }}>
                   <p>Cargando ubicación...</p>
                 </div>
               )}
             </motion.section>
           </motion.div>
         );
        case 'perfil':
          return (
            <motion.section 
              className="dashboard-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
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
                  <button className="btn-unpublish" onClick={unpublishProfile}>
                    OCULTAR PERFIL
                  </button>
                ) : (
                  <button 
                    className="btn-publish" 
                    onClick={publishProfile}
                    disabled={publishing}
                  >
                    {publishing ? 'PUBLICANDO...' : 'PUBLICAR MI PERFIL'}
                  </button>
                )}
              </div>

              <div className="profile-header-section">
                <div className="profile-avatar-section">
                  {photos[0] ? (
                    <img src={photos[0].url} alt="Perfil" className="profile-avatar-large" />
                  ) : (
                    <div className="profile-avatar-placeholder">
                      <User size={48} />
                    </div>
                  )}
                  <div className="membership-badge">{MembershipPlans[membership].name}</div>
                </div>
                <div className="profile-name-section">
                  <h3>{profileData.name || 'Tu Nombre'}</h3>
                  <p><MapPin size={14} /> {profileData.location || 'Sin ubicación'}</p>
                  <p><Clock size={14} /> {profileData.horario || 'Horario no definido'}</p>
                </div>
              </div>

              <div className="profile-edit-form glass-effect">
                <h4>Información Personal</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nombre Completo</label>
                    <input 
                      type="text" 
                      name="name"
                      value={profileData.name} 
                      onChange={handleProfileChange}
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div className="form-group">
                    <label>Correo Electrónico</label>
                    <input 
                      type="email" 
                      name="email"
                      value={profileData.email || user?.email || ''} 
                      onChange={handleProfileChange}
                      placeholder="tu@email.com"
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label>Ubicación</label>
                    <div className="location-input-group">
                      <input 
                        type="text" 
                        name="location"
                        value={profileData.location} 
                        onChange={handleProfileChange}
                        placeholder="Ciudad, País"
                      />
                      {userLocation && (
                        <button 
                          type="button" 
                          className="btn-detect-location"
                          onClick={() => setProfileData(prev => ({ ...prev, location: userLocation.fullLocation }))}
                          title="Usar mi ubicación actual"
                        >
                          <MapPin size={14} /> {userLocation.city || userLocation.country}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Edad</label>
                    <input 
                      type="number" 
                      name="age"
                      value={profileData.age} 
                      onChange={handleProfileChange}
                      placeholder="25"
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={profileData.phone} 
                      onChange={handleProfileChange}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp</label>
                    <input 
                      type="tel" 
                      name="whatsapp"
                      value={profileData.whatsapp} 
                      onChange={handleProfileChange}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>

                <h4>Características Físicas</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Altura (cm)</label>
                    <input 
                      type="text" 
                      name="altura"
                      value={profileData.altura} 
                      onChange={handleProfileChange}
                      placeholder="170"
                    />
                  </div>
                  <div className="form-group">
                    <label>Peso (kg)</label>
                    <input 
                      type="text" 
                      name="peso"
                      value={profileData.peso} 
                      onChange={handleProfileChange}
                      placeholder="55"
                    />
                  </div>
                  <div className="form-group">
                    <label>Medidas</label>
                    <input 
                      type="text" 
                      name="medidas"
                      value={profileData.medidas} 
                      onChange={handleProfileChange}
                      placeholder="90-60-90"
                    />
                  </div>
                  <div className="form-group">
                    <label>Color de Ojos</label>
                    <input 
                      type="text" 
                      name="ojos"
                      value={profileData.ojos} 
                      onChange={handleProfileChange}
                      placeholder="Castaños"
                    />
                  </div>
                  <div className="form-group">
                    <label>Color de Pelo</label>
                    <input 
                      type="text" 
                      name="pelo"
                      value={profileData.pelo} 
                      onChange={handleProfileChange}
                      placeholder="Castaño"
                    />
                  </div>
                  <div className="form-group">
                    <label>Horario Disponible</label>
                    <input 
                      type="text" 
                      name="horario"
                      value={profileData.horario} 
                      onChange={handleProfileChange}
                      placeholder="24/7"
                    />
                  </div>
                </div>

                <h4>Descripción y Servicios</h4>
                <div className="form-group full-width">
                  <label>Descripción</label>
                  <textarea 
                    name="description"
                    rows="4" 
                    value={profileData.description} 
                    onChange={handleProfileChange}
                    placeholder="Cuéntanos sobre ti..."
                  />
                </div>

                <div className="form-group full-width">
                  <label>Servicios Ofrecidos</label>
                  <div className="services-edit-container">
                    <div className="services-checklist">
                      {availableServices.map(service => (
                        <label key={service} className="service-checkbox">
                          <input 
                            type="checkbox" 
                            checked={profileData.services?.includes(service)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setProfileData(prev => ({
                                  ...prev,
                                  services: [...(prev.services || []), service]
                                }));
                              } else {
                                setProfileData(prev => ({
                                  ...prev,
                                  services: (prev.services || []).filter(s => s !== service)
                                }));
                              }
                            }}
                          />
                          <span>{service}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <h4>Tarifas</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tarifa Incall (1 hora)</label>
                    <input 
                      type="text" 
                      name="tarifa"
                      value={profileData.tarifa} 
                      onChange={handleProfileChange}
                      placeholder="$50.000 CLP"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tarifa Outcall (1 hora)</label>
                    <input 
                      type="text" 
                      name="tarifa2"
                      value={profileData.tarifa2} 
                      onChange={handleProfileChange}
                      placeholder="$70.000 CLP"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-save-profile" onClick={handleSaveProfile}>
                    {saving ? <><Clock size={16} /> Guardando...</> : <><Save size={16} /> GUARDAR CAMBIOS</>}
                  </button>
                  {saving && <span className="save-success">✓ Cambios guardados</span>}
                </div>
              </div>

              <div className="gallery-section glass-effect">
                <div className="gallery-header">
                  <h4><Image size={18} /> Fotos ({photos.length}/{MembershipPlans[membership].photos})</h4>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />
                  <button className="btn-upload" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} /> Subir Fotos
                  </button>
                </div>
                <div className="gallery-grid">
                  {photos.map(photo => (
                    <div key={photo.id} className="gallery-item">
                      <img src={photo.url} alt={photo.name} />
                      <button className="btn-delete-photo" onClick={() => deletePhoto(photo.id)}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {photos.length === 0 && (
                    <div className="empty-gallery-message">
                      <Camera size={32} />
                      <p>No hay fotos. Sube hasta {MembershipPlans[membership].photos} fotos.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="gallery-section glass-effect">
                <div className="gallery-header">
                  <h4><Video size={18} /> Videos ({videos.length}/{MembershipPlans[membership].videos})</h4>
                  <input 
                    type="file" 
                    ref={videoInputRef}
                    onChange={handleVideoUpload}
                    accept="video/*"
                    multiple
                    style={{ display: 'none' }}
                  />
                  <button className="btn-upload" onClick={() => videoInputRef.current?.click()}>
                    <Upload size={16} /> Subir Videos
                  </button>
                </div>
                <div className="gallery-grid">
                  {videos.map(video => (
                    <div key={video.id} className="gallery-item video-item">
                      <video src={video.url} controls />
                      <button className="btn-delete-photo" onClick={() => deleteVideo(video.id)}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {videos.length === 0 && (
                    <div className="empty-gallery-message">
                      <Video size={32} />
                      <p>No hay videos. Sube hasta {MembershipPlans[membership].videos} videos.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="gallery-section stories-section glass-effect">
                <div className="gallery-header">
                  <h4><span className="story-icon">⬤</span> Historias ({stories.length}/10)</h4>
                  <p className="story-expiry">Las historias duran 24 horas</p>
                  <input 
                    type="file" 
                    ref={storyInputRef}
                    onChange={handleStoryUpload}
                    accept="image/*,video/*"
                    style={{ display: 'none' }}
                  />
                  <button className="btn-upload" onClick={() => storyInputRef.current?.click()}>
                    <Upload size={16} /> Subir Historia
                  </button>
                </div>
                <div className="stories-grid">
                  {stories.map(story => (
                    <div key={story.id} className="story-item">
                      {story.type === 'video' ? (
                        <video src={story.url} />
                      ) : (
                        <img src={story.url} alt="Historia" />
                      )}
                      <div className="story-overlay">
                        <span className="story-time">
                          {new Date(story.expiresAt) > new Date() ? 'Activa' : 'Expirada'}
                        </span>
                      </div>
                      <button className="btn-delete-story" onClick={() => deleteStory(story.id)}>
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {stories.length === 0 && (
                    <div className="empty-gallery-message">
                      <span className="story-icon-large">⬤</span>
                      <p>Sube historias que desaparecen en 24 horas</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.section>
          );
        case 'anuncios':
          return (
            <motion.section 
              className="dashboard-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="section-title"><Megaphone size={20} className="icon-gold" /> Mis Anuncios</div>
              <div className="ads-list">
                <div className="ad-card glass-effect">
                  <div className="ad-info">
                    <h4>Mi Perfil Público</h4>
                    <p>Estado: {isProfilePublic ? 'Publicado' : 'Oculto'}</p>
                    <p>Visitas: {stats.visits}</p>
                  </div>
                  <div className="ad-actions">
                    {isProfilePublic ? (
                      <button className="btn-unpublish" onClick={unpublishProfile}>OCULTAR</button>
                    ) : (
                      <button className="btn-publish" onClick={publishProfile}>PUBLICAR</button>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          );
        case 'mensajes':
          return (
            <motion.section 
              className="dashboard-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="section-title"><MessageSquare size={20} className="icon-gold" /> Mensajes</div>
              <div className="messages-list">
                {messages.map(msg => (
                  <div key={msg.id} className={`message-card glass-effect ${!msg.read ? 'unread' : ''}`}>
                    <div className="message-header">
                      <strong>{msg.from}</strong>
                      <span className="message-time">{msg.time}</span>
                    </div>
                    <p className="message-text">{msg.text}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          );
        case 'suscripciones':
          return (
            <motion.section 
              className="dashboard-section"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="section-title"><CreditCard size={20} className="icon-gold" /> Membresía</div>
              <div className="membership-current glass-effect">
                <h3>Plan Actual: {MembershipPlans[membership].name}</h3>
                <p>Precio: ${MembershipPlans[membership].price}/mes</p>
                <p style={{ marginTop: '10px' }}>Fotos: {MembershipPlans[membership].photos}</p>
                <p>Videos: {MembershipPlans[membership].videos}</p>
              </div>
              <div className="membership-upgrade">
                <h4>Otros Planes</h4>
                <div className="plans-grid">
                  {Object.entries(MembershipPlans).map(([key, plan]) => (
                    <div 
                      key={key} 
                      className={`plan-card glass-effect ${membership === key ? 'current' : ''}`}
                      onClick={() => {
                        if (key !== membership) {
                          setSelectedPlan(key);
                          setShowPaymentModal(true);
                        }
                      }}
                    >
                      <h5>{plan.name}</h5>
                      <p className="plan-price">${plan.price}/mes</p>
                      <p>{plan.photos} fotos, {plan.videos} videos</p>
                      {membership === key && <span className="current-badge">Actual</span>}
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          );
        default:
          return null;
      }
    };

  const navItems = [
    { id: 'panel', label: 'Panel Principal', icon: <BarChart3 size={18} /> },
    { id: 'perfil', label: 'Mi Perfil', icon: <User size={18} /> },
    { id: 'anuncios', label: 'Mis Anuncios', icon: <Megaphone size={18} /> },
    { id: 'mensajes', label: 'Mensajes', icon: <MessageSquare size={18} />, badge: messages.filter(m => !m.read).length },
    { id: 'suscripciones', label: 'Membresía', icon: <CreditCard size={18} /> },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
           <img src="/assets/logo_r.svg" alt="R" className="sidebar-logo" />
           <div className="sidebar-user-type">{membership.toUpperCase()}</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div 
              key={item.id} 
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`} 
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
              {activeTab === item.id && <motion.div className="active-indicator" layoutId="activeInd" />}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="btn-back-sidebar" onClick={() => onNavigate('home')}>
            <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> <span>Volver al Inicio</span>
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} /> <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-top">
          <div className="welcome">
            <motion.h2 
              key={activeTab}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {activeTab === 'panel' ? `Hola, ${profileData.name || 'Bienvenida'}` : ''} <span className="text-gold">{activeTab.toUpperCase()}</span>
            </motion.h2>
            <p className="breadcrumb">Rococo Privé / {activeTab}</p>
          </div>
          <div className="top-actions">
            {activeTab !== 'perfil' && (
              <motion.button 
                className="btn-create-top"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('perfil')}
              >
                + EDITAR PERFIL
              </motion.button>
            )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {showPaymentModal && (
        <div className="payment-modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="payment-modal glass-effect" onClick={e => e.stopPropagation()}>
            <button className="close-payment" onClick={() => setShowPaymentModal(false)}>×</button>
            <h2>💳 Actualizar Membresía</h2>
            <p className="payment-plan-name">
              Plan {MembershipPlans[selectedPlan]?.name} - ${MembershipPlans[selectedPlan]?.price}/mes
            </p>
            
            <div className="country-selector">
              <button 
                className={`country-btn ${selectedCountry === 'chile' ? 'active' : ''}`}
                onClick={() => setSelectedCountry('chile')}
              >
                🇨🇱 Chile
              </button>
              <button 
                className={`country-btn ${selectedCountry === 'world' ? 'active' : ''}`}
                onClick={() => setSelectedCountry('world')}
              >
                🌍 Mundo
              </button>
            </div>

            <div className="payment-methods-grid">
              {(selectedCountry === 'chile' ? chilePaymentMethods : worldPaymentMethods).map(method => (
                <button 
                  key={method.id} 
                  className="payment-method-btn"
                  onClick={() => upgradePlan(selectedPlan)}
                >
                  <span className="method-icon">{method.icon}</span>
                  <span className="method-name">{method.name}</span>
                </button>
              ))}
            </div>

            <button className="btn-process-payment" onClick={() => upgradePlan(selectedPlan)}>
              CONFIRMAR PAGO
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
