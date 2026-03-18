import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import './PhotoGallery.css';

const PhotoGallery = ({ photos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const validPhotos = Array.isArray(photos) && photos.length > 0 
    ? photos 
    : ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=687'];

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % validPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + validPhotos.length) % validPhotos.length);
  };

  return (
    <div className="photo-gallery-wrapper">
      <div className="main-display-area">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentIndex}
            src={validPhotos[currentIndex]} 
            alt={`Album photo ${currentIndex + 1}`}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="main-photo"
          />
        </AnimatePresence>
        
        <div className="gallery-controls">
          <button className="nav-arrow prev" onClick={prevPhoto}><ChevronLeft size={24} /></button>
          <button className="nav-arrow next" onClick={nextPhoto}><ChevronRight size={24} /></button>
        </div>

        <div className="gallery-counter">
          {currentIndex + 1} / {validPhotos.length}
        </div>
      </div>

      <div className="thumbnails-row">
        {validPhotos.map((photo, index) => (
          <motion.div 
            key={index}
            className={`thumbnail-item ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img src={photo} alt={`Thumbnail ${index + 1}`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PhotoGallery;
