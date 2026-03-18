import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home';
import Discover from './pages/Discover';
import Bookings from './pages/Bookings';
import Membership from './pages/Membership';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import MobileNav from './components/MobileNav/MobileNav';
import Footer from './components/Footer/Footer';
import './index.css';

const ALL_PROFILES_KEY = 'rococo_all_profiles';
const LOCATION_KEY = 'rococo_user_location';

const locationCache = {
  'Santiago': { city: 'Santiago', country: 'Chile', countryCode: 'CL' },
  'Valparaíso': { city: 'Valparaíso', country: 'Chile', countryCode: 'CL' },
  'Concepción': { city: 'Concepción', country: 'Chile', countryCode: 'CL' },
  'Buenos Aires': { city: 'Buenos Aires', country: 'Argentina', countryCode: 'AR' },
  'São Paulo': { city: 'São Paulo', country: 'Brasil', countryCode: 'BR' },
  'Rio de Janeiro': { city: 'Rio de Janeiro', country: 'Brasil', countryCode: 'BR' },
  'Lima': { city: 'Lima', country: 'Perú', countryCode: 'PE' },
  'Bogotá': { city: 'Bogotá', country: 'Colombia', countryCode: 'CO' },
  'Medellín': { city: 'Medellín', country: 'Colombia', countryCode: 'CO' },
  'Ciudad de México': { city: 'Mexico City', country: 'México', countryCode: 'MX' },
  'Madrid': { city: 'Madrid', country: 'España', countryCode: 'ES' },
  'Barcelona': { city: 'Barcelona', country: 'España', countryCode: 'ES' },
  'Lisboa': { city: 'Lisboa', country: 'Portugal', countryCode: 'PT' },
  'Londres': { city: 'London', country: 'Reino Unido', countryCode: 'GB' },
  'París': { city: 'Paris', country: 'Francia', countryCode: 'FR' },
  'Berlín': { city: 'Berlin', country: 'Alemania', countryCode: 'DE' },
  'Roma': { city: 'Roma', country: 'Italia', countryCode: 'IT' },
  'Ámsterdam': { city: 'Amsterdam', country: 'Países Bajos', countryCode: 'NL' },
  'Tokio': { city: 'Tokyo', country: 'Japón', countryCode: 'JP' },
  'Seúl': { city: 'Seoul', country: 'Corea del Sur', countryCode: 'KR' },
  'Sídney': { city: 'Sydney', country: 'Australia', countryCode: 'AU' },
  'Miami': { city: 'Miami', country: 'Estados Unidos', countryCode: 'US' },
  'Los Ángeles': { city: 'Los Angeles', country: 'Estados Unidos', countryCode: 'US' },
  'Nueva York': { city: 'New York', country: 'Estados Unidos', countryCode: 'US' },
};

function getLocationFromCoords(lat, lon) {
  return new Promise((resolve) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then(response => response.json())
      .then(data => {
        const city = data.address.city || data.address.town || data.address.village || data.address.county || '';
        const country = data.address.country || '';
        const countryCode = data.address.country_code?.toUpperCase() || '';
        
        resolve({
          city: city,
          country: country,
          countryCode: countryCode,
          fullLocation: city && country ? `${city}, ${country}` : country || 'Ubicación Desconocida',
          lat: lat,
          lon: lon
        });
      })
      .catch(() => {
        resolve({
          city: '',
          country: '',
          countryCode: '',
          fullLocation: 'Ubicación no disponible',
          lat: lat,
          lon: lon
        });
      });
  });
}

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [allProfiles, setAllProfiles] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const adminAuth = localStorage.getItem('rococo_admin_password');
    if (adminAuth === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('rococo_admin_password');
    setIsAdminLoggedIn(false);
    setCurrentPage('home');
  };

  // Global Parallax Settings
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const xOffset = useTransform(smoothX, [0, typeof window !== 'undefined' ? window.innerWidth : 1920], [-15, 15]);
  const yOffset = useTransform(smoothY, [0, typeof window !== 'undefined' ? window.innerHeight : 1080], [-15, 15]);

  const handleMouseMove = (e) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  useEffect(() => {
    const savedProfiles = localStorage.getItem(ALL_PROFILES_KEY);
    if (savedProfiles) {
      try {
        setAllProfiles(JSON.parse(savedProfiles));
      } catch (e) {
        console.error('Error parsing saved profiles:', e);
      }
    }

    const savedLocation = localStorage.getItem(LOCATION_KEY);
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        setUserLocation(parsedLocation);
        setLocationLoading(false);
      } catch (e) {
        console.error('Error parsing saved location', e);
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const locationData = await getLocationFromCoords(latitude, longitude);
          setUserLocation(locationData);
          localStorage.setItem(LOCATION_KEY, JSON.stringify(locationData));
          setLocationLoading(false);
        },
        (error) => {
          console.log('Error getting location:', error.message);
          setLocationError('No se pudo obtener la ubicación');
          
          const defaultLocation = {
            city: 'Santiago',
            country: 'Chile',
            countryCode: 'CL',
            fullLocation: 'Santiago, Chile',
            lat: -33.4489,
            lon: -70.6693
          };
          setUserLocation(defaultLocation);
          localStorage.setItem(LOCATION_KEY, JSON.stringify(defaultLocation));
          setLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      const defaultLocation = {
        city: 'Santiago',
        country: 'Chile',
        countryCode: 'CL',
        fullLocation: 'Santiago, Chile',
        lat: -33.4489,
        lon: -70.6693
      };
      setUserLocation(defaultLocation);
      localStorage.setItem(LOCATION_KEY, JSON.stringify(defaultLocation));
      setLocationLoading(false);
    }
  }, []);

  const updateAllProfiles = (newProfiles) => {
    setAllProfiles(newProfiles);
    localStorage.setItem(ALL_PROFILES_KEY, JSON.stringify(newProfiles));
  };

  const handleProfilePublished = (profileData) => {
    const existingIndex = allProfiles.findIndex(p => p.email === profileData.email);
    let newProfiles;
    if (existingIndex >= 0) {
      newProfiles = [...allProfiles];
      newProfiles[existingIndex] = profileData;
    } else {
      newProfiles = [...allProfiles, profileData];
    }
    updateAllProfiles(newProfiles);
  };

  const renderPage = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="page-wrapper"
        >
          {(() => {
            switch(currentPage) {
              case 'home': return <Home onNavigate={setCurrentPage} allProfiles={allProfiles} userLocation={userLocation} />;
              case 'discover': return <Discover onNavigate={setCurrentPage} allProfiles={allProfiles} userLocation={userLocation} />;
              case 'membership': return <Membership onNavigate={setCurrentPage} />;
              case 'dashboard': return <Dashboard onNavigate={setCurrentPage} onProfilePublished={handleProfilePublished} userLocation={userLocation} />;
              case 'bookings': return <Bookings onNavigate={setCurrentPage} />;
              case 'admin': return isAdminLoggedIn ? <AdminDashboard onLogout={handleAdminLogout} /> : <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />;
              default: return <Home />;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="App" onMouseMove={handleMouseMove}>
      <div className="ambiance-bg">
        <motion.div 
          className="bg-3d-image"
          style={{ x: xOffset, y: yOffset }}
        />
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="noise-overlay"></div>
        <div className="vignette-overlay"></div>
      </div>
      <Navbar onNavigate={setCurrentPage} userLocation={userLocation} locationLoading={locationLoading} />
      <main className="main-content">
        {renderPage()}
      </main>
      <Footer />
      <MobileNav onNavigate={setCurrentPage} activePage={currentPage} />
    </div>
  );
}

export default App;
