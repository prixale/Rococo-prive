import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, MapPin, ChevronRight } from 'lucide-react';
import ProfileCard from '../components/ProfileCard/ProfileCard';
import ProfileDetail from '../components/ProfileDetail/ProfileDetail';
import './Discover.css';

const Discover = ({ onNavigate, userLocation, allProfiles = [] }) => {
  const [filter, setFilter] = useState('Todas');
  const [maxPrice, setMaxPrice] = useState(100000);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [nearbyFilter, setNearbyFilter] = useState(false);

  const filteredProfiles = allProfiles.filter(p => {
    const matchesFilter = filter === 'Todas' || p.category === filter;
    const matchesPrice = p.price <= maxPrice;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNearby = !nearbyFilter || !userLocation ||
      p.location.toLowerCase().includes(userLocation.city?.toLowerCase()) ||
      p.location.toLowerCase().includes(userLocation.country?.toLowerCase());
    return matchesFilter && matchesPrice && matchesSearch && matchesNearby;
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
        <p>Explora nuestra selección exclusiva.</p>
      </header>

      <div className="discover-content">
        <aside className="discover-filters">
           <div className="filter-header">
              <SlidersHorizontal size={18} />
              <h3>FILTROS</h3>
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
               <option>Elite</option>
             </select>
          </div>

           <div className="filter-item">
              <div className="label-row">
                <label>Precio Máximo</label>
                <span className="value">${maxPrice.toLocaleString('es-CL')}</span>
              </div>
              <input 
                type="range" 
                min="10000" 
                max="200000" 
                step="5000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
              />
           </div>
        </aside>

        <div className="discover-grid-area">
          {loading ? (
            <div className="loading-state">
              <p>Cargando perfiles...</p>
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="empty-state">
              <p>No hay perfiles disponibles aún.</p>
              <p className="empty-state-sub">Sé la primera profesional en registrarse.</p>
              <button className="btn-primary" onClick={() => onNavigate('membership')}>
                REGISTRARSE
              </button>
            </div>
          ) : (
            <div className="profile-grid">
              <AnimatePresence>
                {filteredProfiles.map((p) => (
                  <motion.div
                    key={p.id}
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
            </div>
          )}
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
