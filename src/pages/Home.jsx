import React, { useState, useEffect } from 'react';
import './Home.css';
import Hero from '../components/Hero/Hero';
import SearchFilter from '../components/SearchFilter/SearchFilter';
import ProfileCard from '../components/ProfileCard/ProfileCard';
import ProfileDetail from '../components/ProfileDetail/ProfileDetail';
import StoriesBar from '../components/StoriesBar/StoriesBar';
import StoryViewer from '../components/StoriesBar/StoryViewer';


const Home = ({ onNavigate, userLocation, allProfiles = [] }) => {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [searchFilters, setSearchFilters] = useState({ category: 'Todas', location: '' });

  const handleFilterChange = (filters) => {
    setSearchFilters(filters);
  };

  const filteredProfiles = allProfiles.filter(p => {
    const matchesCategory = searchFilters.category === 'Todas' || p.category === searchFilters.category;
    const matchesLocation = !searchFilters.location || 
      (p.location && p.location.toLowerCase().includes(searchFilters.location.toLowerCase()));
    return matchesCategory && matchesLocation;
  });

  // Show all filtered profiles (no strict geo-filter on Home)
  const displayProfiles = filteredProfiles;

  return (
    <div className="home-page">
      <Hero onNavigate={onNavigate} />
      
      <SearchFilter onFilterChange={handleFilterChange} />
      
      <section className="featured-profiles container">
        <div className="section-header-refined">
          <div className="vertical-bar"></div>
          <h2>DESCUBRE LA EXCLUSIVIDAD</h2>
        </div>

        {allProfiles.length === 0 ? (
          <div className="loading-state">
            <p>Cargando perfiles...</p>
          </div>
        ) : displayProfiles.length === 0 ? (
          <div className="empty-state">
            <p>No hay perfiles disponibles aún.</p>
            <p className="empty-state-sub">Sé la primera profesional en registrarse.</p>
            <button className="btn-primary" onClick={() => onNavigate('membership')}>
              REGISTRARSE
            </button>
          </div>
        ) : (
          <div className="profile-grid">
            {displayProfiles.slice(0, 12).map((profile) => (
              <ProfileCard 
                key={profile.id} 
                {...profile} 
                onClick={() => setSelectedProfile(profile)}
              />
            ))}
          </div>
        )}
        
        {allProfiles.length > 12 && (
          <div className="view-more-container">
            <button className="btn-view-more" onClick={() => onNavigate('discover')}>VER TODAS</button>
          </div>
        )}
      </section>

      <ProfileDetail 
        profile={selectedProfile} 
        onClose={() => setSelectedProfile(null)} 
      />
    </div>
  );
};

export default Home;
