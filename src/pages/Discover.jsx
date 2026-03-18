import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Search, SlidersHorizontal, MapPin, Euro, ChevronRight } from 'lucide-react';
import ProfileCard from '../components/ProfileCard/ProfileCard';
import ProfileDetail from '../components/ProfileDetail/ProfileDetail';
import './Discover.css';

const STORAGE_KEY = 'rococo_prive_user';

const Discover = ({ onNavigate, allProfiles = [], userLocation }) => {
  const [filter, setFilter] = useState('Todas');
  const [maxPrice, setMaxPrice] = useState(100000);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [nearbyFilter, setNearbyFilter] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      const userProfileData = localStorage.getItem(`rococo_data_${userData.email}`);
      if (userProfileData) {
        const data = JSON.parse(userProfileData);
        if (data.photos && data.photos.length > 0 && data.isPublic) {
          setCurrentUserProfile({
            name: data.profile?.name || userData.name,
            location: data.profile?.location || 'Chile',
            price: data.profile?.tarifa ? parseInt(data.profile.tarifa.replace(/[^0-9]/g, '')) : 50000,
            image: data.photos[0]?.url || '',
            age: data.profile?.age || '25',
            height: data.profile?.altura || '170',
            category: 'Verificadas',
            description: data.profile?.description || '',
            phone: data.profile?.phone || '',
            whatsapp: data.profile?.whatsapp || '',
            isUserProfile: true
          });
        }
      }
    }
  }, []);

  const mockProfiles = [
    { name: 'Elena', price: 300, location: 'Madrid, ES', category: 'Verificadas', age: '24', height: '172', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=688', phone: '+34600123456', whatsapp: '+34600123456' },
    { name: 'Valentina', price: 450, location: 'Barcelona, ES', category: 'Nuevas', age: '22', height: '168', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=687', phone: '+34600123457', whatsapp: '+34600123457' },
    { name: 'Sofia', price: 500, location: 'Marbella, ES', category: 'Verificadas', age: '26', height: '175', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=764', phone: '+34600123458', whatsapp: '+34600123458' },
    { name: 'Isabella', price: 350, location: 'Ibiza, ES', category: 'Nuevas', age: '23', height: '170', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=761', phone: '+34600123459', whatsapp: '+34600123459' },
    { name: 'Martina', price: 400, location: 'Madrid, ES', category: 'Verificadas', age: '25', height: '173', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=687', phone: '+34600123460', whatsapp: '+34600123460' },
    { name: 'Camila', price: 600, location: 'Barcelona, ES', category: 'Nuevas', age: '27', height: '171', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=764', phone: '+34600123461', whatsapp: '+34600123461' },
  ];

  const userProfiles = allProfiles
    .filter(p => p.photos && p.photos.length > 0)
    .map(p => ({
      name: p.name,
      price: p.price || 50000,
      location: p.location || 'Chile',
      category: 'Verificadas',
      age: p.age || '25',
      height: p.height || '170',
      image: p.photos[0]?.url || '',
      description: p.description || '',
      phone: p.phone || '',
      whatsapp: p.whatsapp || '',
      isUserProfile: true
    }));

  const nearbyProfiles = userLocation
    ? userProfiles.filter(p =>
        p.location.toLowerCase().includes(userLocation.city?.toLowerCase()) ||
        p.location.toLowerCase().includes(userLocation.country?.toLowerCase())
      )
    : [];

  const combinedUserProfiles = currentUserProfile 
    ? [currentUserProfile, ...userProfiles.filter(p => p.name !== currentUserProfile.name)]
    : userProfiles;

  const allDisplayProfiles = nearbyFilter
    ? [...nearbyProfiles, ...mockProfiles.filter(p =>
        userLocation &&
        (p.location.toLowerCase().includes(userLocation.city?.toLowerCase().split(' ')[0]) ||
         p.location.toLowerCase().includes(userLocation.country?.toLowerCase()))
      )]
    : [...combinedUserProfiles, ...mockProfiles];

  const filteredProfiles = allDisplayProfiles.filter(p => {
    const matchesFilter = filter === 'Todas' || p.category === filter;
    const matchesPrice = p.price <= maxPrice;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesPrice && matchesSearch;
  });

  return (
    <div className="discover-page container">
      <header className="discover-header">
        <motion.button 
          className="btn-back-global"
          onClick={() => onNavigate('home')}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} /> VOLVER AL INICIO
        </motion.button>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >DESCUBRIR</motion.h1>
        <p>Explora nuestra selección exclusiva de escorts de élite.</p>
      </header>

      <div className="discover-content">
        <aside className="discover-filters">
           <div className="filter-header">
              <SlidersHorizontal size={18} />
              <h3>FILTROS</h3>
           </div>
           
           <div className="option-card glass-effect">
             <h2>PARA PROFESIONALES</h2>
             <p>Maximiza tus ingresos y llega a una audiencia VIP.</p>
           </div>

            <div className="search-bar-inline">
               <Search size={16} />
               <input 
                 type="text" 
                 placeholder="Buscar por nombre o ciudad..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
            </div>

            {userLocation && (
              <div className="filter-item nearby-toggle">
                <button
                  className={`nearby-btn ${nearbyFilter ? 'active' : ''}`}
                  onClick={() => setNearbyFilter(!nearbyFilter)}
                >
                  <MapPin size={16} />
                  Ver cerca de {userLocation.city || userLocation.country}
                </button>
              </div>
            )}

            <div className="filter-item">
              <label>Categoría</label>
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option>Todas</option>
                <option>Nuevas</option>
                <option>Verificadas</option>
                <option>Escorts</option>
              </select>
           </div>

            <div className="filter-item">
               <div className="label-row">
                 <label>Precio Máximo</label>
                 <span className="value">${maxPrice.toLocaleString('es-CL')}</span>
               </div>
               <input 
                 type="range" 
                 min="30000" 
                 max="100000" 
                 step="5000"
                 value={maxPrice}
                 onChange={(e) => setMaxPrice(parseInt(e.target.value))}
               />
            </div>
        </aside>

        <div className="discover-grid-area">
          <div className="profile-grid">
            <AnimatePresence>
              {filteredProfiles.map((p, i) => (
                <motion.div
                  key={p.name}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="profile-card-wrapper"
                >
                  <ProfileCard {...p} onClick={() => setSelectedProfile(p)} />
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredProfiles.length === 0 && (
              <div className="no-results">
                <p>No se encontraron resultados para tus criterios.</p>
                <button onClick={() => {setFilter('Todas'); setMaxPrice(1000); setSearchQuery('');}}>Limpiar Filtros</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfileDetail 
        profile={selectedProfile} 
        onClose={() => setSelectedProfile(null)} 
      />
    </div>
  );
};

export default Discover;
