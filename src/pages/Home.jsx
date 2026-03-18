import React, { useState, useEffect } from 'react';
import './Home.css';
import Hero from '../components/Hero/Hero';
import SearchFilter from '../components/SearchFilter/SearchFilter';
import ProfileCard from '../components/ProfileCard/ProfileCard';
import ProfileDetail from '../components/ProfileDetail/ProfileDetail';
import StoriesBar from '../components/StoriesBar/StoriesBar';
import StoryViewer from '../components/StoriesBar/StoryViewer';

const STORAGE_KEY = 'rococo_prive_user';

const mockProfiles = [
  { name: "Elena S.", location: "Madrid", price: 300, image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600", age: "24", height: "172", category: "Elite", phone: "+34600123456", whatsapp: "+34600123456", description: "Chica companionship de lujo, discreta y elegante. Available para eventos y cenas.", services: ["Acompañamiento", "Cenas", "Eventos", "Viajes"] },
  { name: "Valentina", location: "Barcelona", price: 450, image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600", age: "22", height: "168", category: "Nuevas", phone: "+34600123457", whatsapp: "+34600123457", description: "Nueva en Barcelona, apasionada por el companionship. Especialista en GFE.", services: ["Acompañamiento", "Masaje", "Despedida de Soltero"] },
  { name: "Sofia", location: "Marbella", price: 500, image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=600", age: "26", height: "175", category: "Elite", phone: "+34600123458", whatsapp: "+34600123458", description: "Mujer fatal de profesión. Experiencia única e inolvidable. Elite companionship.", services: ["Acompañamiento", "Cenas", "Eventos", "Viajes", "Dúo"] },
  { name: "Isabella", location: "Ibiza", price: 350, image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=600", age: "23", height: "170", category: "Nuevas", phone: "+34600123459", whatsapp: "+34600123459", description: "Isla de Ibiza. Chica sexy y divertida. Fiestera pero también discreta.", services: ["Acompañamiento", "Eventos", "Fetiches"] },
  { name: "Martina", location: "Madrid", price: 400, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600", age: "25", height: "173", category: "Verificadas", phone: "+34600123460", whatsapp: "+34600123460", description: "Profesional verificada. 10 años de experiencia. Specialised en companhia executiva.", services: ["Acompañamiento", "Cenas", "Eventos", "Viajes", "Masaje"] },
  { name: "Camila", location: "Barcelona", price: 600, image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600", age: "27", height: "171", category: "Elite", phone: "+34600123461", whatsapp: "+34600123461", description: "Elite companion. Lujo y exclusividad. Disponible para clientes VIP.", services: ["Acompañamiento", "Cenas", "Eventos", "Viajes", "Dúo", "Hotel"] },
  { name: "Luna", location: "Sevilla", price: 250, image: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=600", age: "21", height: "165", category: "Nuevas", phone: "+34600123462", whatsapp: "+34600123462", description: "Nueva en el mundo del companionship. Aprendiendo y creciendo. Muy aplicada.", services: ["Acompañamiento", "Masaje"] },
  { name: "Zara", location: "Valencia", price: 350, image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=600", age: "24", height: "169", category: "Verificadas", phone: "+34600123463", whatsapp: "+34600123463", description: "Verificada y confiable. Me encanta hacer nuevas amistades y compartir momentos únicos.", services: ["Acompañamiento", "Cenas", "Eventos", "Striptease"] },
  { name: "Aria", location: "Madrid", price: 450, image: "https://images.unsplash.com/photo-1539109136881-3be06109e7c6?auto=format&fit=crop&q=80&w=600", age: "23", height: "174", category: "Elite", phone: "+34600123464", whatsapp: "+34600123464", description: "Chica Elite de Madrid. Bella, inteligente y sensual. Tu mejor elección.", services: ["Acompañamiento", "Cenas", "Eventos", "Masaje", "Fetiches"] },
  { name: "Bella", location: "Marbella", price: 550, image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600", age: "25", height: "172", category: "Elite", phone: "+34600123465", whatsapp: "+34600123465", description: "La mejor experiencia de tu vida. Lujo, glamour y pasión. VIP service guaranteed.", services: ["Acompañamiento", "Cenas", "Eventos", "Viajes", "Dúo", "Hotel"] },
  { name: "Clara", location: "Barcelona", price: 300, image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=600", age: "22", height: "167", category: "Nuevas", phone: "+34600123466", whatsapp: "+34600123466", description: "Nuevita en Barcelona. Muy atractiva y con muchas ganas de pasarla bien.", services: ["Acompañamiento", "Masaje", "Despedida de Soltero"] },
  { name: "Diana", location: "Madrid", price: 400, age: "26", height: "176", image: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&q=80&w=600", category: "Verificadas", phone: "+34600123467", whatsapp: "+34600123467", description: "Mujer verificada con años de experiencia. Profesional y discreta.", services: ["Acompañamiento", "Cenas", "Eventos", "Viajes", "Masaje"] },
];

const Home = ({ onNavigate, allProfiles = [], userLocation }) => {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [allStories, setAllStories] = useState([]);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        const userProfileData = localStorage.getItem(`rococo_data_${userData.email}`);
        if (userProfileData) {
          const data = JSON.parse(userProfileData);
          if (data.photos && data.photos.length > 0 && data.isPublic) {
            let parsedPrice = 50000;
            if (data.profile?.tarifa) {
              const tarifaStr = String(data.profile.tarifa);
              parsedPrice = parseInt(tarifaStr.replace(/[^0-9]/g, '')) || 50000;
            }
            setCurrentUserProfile({
              name: data.profile?.name || userData.name,
              location: data.profile?.location || 'Chile',
              price: parsedPrice,
              image: data.photos[0]?.url || '',
              age: data.profile?.age || '25',
              height: data.profile?.altura || '170',
              category: 'Verificadas',
              description: data.profile?.description || '',
              phone: data.profile?.phone || '',
              whatsapp: data.profile?.whatsapp || '',
              services: data.profile?.services || [],
              isUserProfile: true
            });
          }
        }
      }
    } catch (e) {
      console.error("Error loading user profile in Home:", e);
    }
    
    const loadAllStories = () => {
      const now = new Date();
      const storiesList = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('rococo_data_')) {
          const userData = localStorage.getItem(key);
          if (userData) {
            const data = JSON.parse(userData);
            if (data.stories && data.stories.length > 0 && data.isPublic) {
              const validStories = data.stories.filter(story => {
                const expiresAt = new Date(story.expiresAt);
                return expiresAt > now;
              });
              
              if (validStories.length > 0) {
                storiesList.push({
                  name: data.profile?.name || 'Usuario',
                  image: data.photos?.[0]?.url || '',
                  stories: validStories
                });
              }
            }
          }
        }
      }
      
      setAllStories(storiesList);
    };
    
    loadAllStories();
  }, []);

  const userProfiles = allProfiles
    .filter(p => p.photos && p.photos.length > 0)
    .map(p => ({
      name: p.name,
      location: p.location || 'Chile',
      price: p.price || 50000,
      image: p.photos[0]?.url || '',
      age: p.age || '25',
      height: p.height || '170',
      category: 'Verificadas',
      description: p.description || '',
      phone: p.phone || '',
      whatsapp: p.whatsapp || '',
      services: p.services || [],
      isUserProfile: true
    }));

  const profilesNearYou = userLocation 
    ? userProfiles.filter(p => 
        p.location.toLowerCase().includes(userLocation.city?.toLowerCase()) ||
        p.location.toLowerCase().includes(userLocation.country?.toLowerCase())
      )
    : [];

  const combinedUserProfiles = currentUserProfile 
    ? [currentUserProfile, ...userProfiles.filter(p => p.name !== currentUserProfile.name)]
    : userProfiles;

  const allHomeProfiles = [...profilesNearYou, ...combinedUserProfiles, ...mockProfiles].slice(0, 12);

  const mockStories = [
    { name: 'Elena', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150' },
    { name: 'Valentina', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150' },
    { name: 'Sofia', image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=150' },
    { name: 'Martina', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150' },
    { name: 'Camila', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
    { name: 'Zara', image: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=150' },
  ];

  const userStories = allStories.length > 0 
    ? allStories 
    : mockStories;

  const handleNextStory = () => {
    setActiveStoryIndex((prev) => (prev + 1 < userStories.length ? prev + 1 : null));
  };

  const handlePrevStory = () => {
    setActiveStoryIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  return (
    <div className="home-page">
      <Hero />
      <StoriesBar onStoryClick={setActiveStoryIndex} userStories={userStories} />
      <SearchFilter />
      
      <section className="featured-profiles container">
        <div className="section-header-refined">
          <div className="vertical-bar"></div>
          <h2>DESCUBRE LA EXCLUSIVIDAD</h2>
        </div>

        <div className="profile-grid">
          {allHomeProfiles.map((profile, index) => (
            <ProfileCard 
              key={index} 
              {...profile} 
              onClick={() => setSelectedProfile(profile)}
            />
          ))}
        </div>
        
        <div className="view-more-container">
          <button className="btn-view-more" onClick={() => onNavigate('membership')}>VER TODAS LAS ESCORTS</button>
        </div>
      </section>

      <section className="newsletter-section">
        <div className="container newsletter-box glass-effect">
          <div className="newsletter-content">
            <h3>Únete al Círculo Privé</h3>
            <p>Suscríbete para recibir ofertas exclusivas y novedades de perfiles en tu zona.</p>
            <div className="input-group">
              <input type="email" placeholder="Tu correo electrónico" />
              <button className="btn-primary">SUSCRIBIRSE</button>
            </div>
          </div>
        </div>
      </section>

      <ProfileDetail 
        profile={selectedProfile} 
        onClose={() => setSelectedProfile(null)} 
      />

      <StoryViewer 
        story={activeStoryIndex !== null ? userStories[activeStoryIndex] : null}
        onClose={() => setActiveStoryIndex(null)}
        onNext={handleNextStory}
        onPrev={handlePrevStory}
      />
    </div>
  );
};

export default Home;
