import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sparkles, Zap, Shield } from 'lucide-react';
import './SearchFilter.css';

const SearchFilter = () => {
  const [selectedCity, setSelectedCity] = useState('Madrid');
  const [selectedCategory, setSelectedCategory] = useState('Elite');
  
  // Simulated city data for Spain (can be expanded based on detected location)
  const cities = ['Madrid', 'Barcelona', 'Marbella', 'Ibiza', 'Valencia', 'Sevilla'];
  const categories = [
    { name: 'Elite', icon: <Sparkles size={14} /> },
    { name: 'Nuevas', icon: <Zap size={14} /> },
    { name: 'Verificadas', icon: <Shield size={14} /> },
    { name: 'Disponibles 24h', icon: <MapPin size={14} /> }
  ];

  return (
    <div className="search-filter-advanced container">
      {/* Dynamic Ambiance Blobs */}
      <div className="search-blobs-container">
        <motion.div 
          className="search-blob sb-1"
          animate={{ x: [0, 30, -20, 0], y: [0, -20, 30, 0], scale: [1, 1.2, 0.9, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="search-blob sb-2"
          animate={{ x: [0, -40, 20, 0], y: [0, 30, -40, 0], scale: [1, 0.8, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      <motion.div 
        className="location-detector"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
      >
        <MapPin size={12} /> Ubicación detectada: <strong>España</strong>
      </motion.div>
      <motion.div 
        className="advanced-filter-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* City Chips Section */}
        <div className="filter-section-interactive">
          <label className="section-label-minimal">¿DÓNDE TE ENCUENTRAS?</label>
          <div className="chips-grid">
            {cities.map(city => (
              <motion.button
                key={city}
                className={`chip-btn ${selectedCity === city ? 'active' : ''}`}
                onClick={() => setSelectedCity(city)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {city.toUpperCase()}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Category Chips Section */}
        <div className="filter-section-interactive">
          <label className="section-label-minimal">¿QUÉ DESEAS HOY?</label>
          <div className="chips-grid">
            {categories.map(cat => (
              <motion.button
                key={cat.name}
                className={`chip-btn-category ${selectedCategory === cat.name ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.name)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                {cat.icon}
                <span>{cat.name.toUpperCase()}</span>
              </motion.button>
            ))}
          </div>
        </div>

        <motion.button 
          className="search-submit-premium"
          whileHover={{ scale: 1.05, backgroundColor: '#D4AF37', color: '#000' }}
          whileTap={{ scale: 0.95 }}
        >
          EXPLORAR PERFILES EN {selectedCity.toUpperCase()}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default SearchFilter;
