import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Menu, X, ChevronRight, MapPin, Loader, Settings, User } from 'lucide-react';
import './Navbar.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const Logo3D = ({ onClick }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17deg", "-17deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17deg", "17deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div 
      className="logo-refined" 
      onClick={onClick}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 1000 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img src="/assets/logo_emblem.png" alt="Rococo Prive" className="main-logo" style={{ transform: "translateZ(30px)" }} />
    </motion.div>
  );
};

const Navbar = ({ onNavigate, userLocation, locationLoading }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        setIsLoggedIn(true);
        setIsAdmin(userData.role === 'admin');
        setUserName(userData.name || '');
      } catch (e) {
        setIsLoggedIn(false);
        setIsAdmin(false);
        setUserName('');
      }
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
      setUserName('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUserName('');
    onNavigate('home');
  };

  const navLinks = [
    { id: 'home', label: 'INICIO' },
    { id: 'discover', label: 'DESCUBRIR' },
    { id: 'membership', label: 'MEMBRESÍA' },
    { id: 'bookings', label: 'RESERVAS' },
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Logo3D onClick={() => onNavigate('home')} />

        <div className="nav-links-refined desktop-only">
          {navLinks.map((link) => (
            <motion.div 
              key={link.id} 
              className="nav-item-wrapper"
              whileHover={{ y: -2 }}
            >
              <button 
                className="nav-link-btn"
                onClick={() => onNavigate(link.id)}
              >
                {link.label}
              </button>
              <motion.span 
                className="nav-accent"
                layoutId="navAccent"
              ></motion.span>
            </motion.div>
          ))}
        </div>

        <div className="location-display desktop-only">
          {locationLoading ? (
            <div className="location-loading">
              <Loader size={14} className="spin" /> Detectando...
            </div>
          ) : userLocation ? (
            <div className="location-detected">
              <MapPin size={14} />
              <span>{userLocation.fullLocation}</span>
            </div>
          ) : (
            <div className="location-error">
              <MapPin size={14} />
              <span>Ubicación</span>
            </div>
          )}
        </div>

        <div className="nav-actions desktop-only">
          {isLoggedIn ? (
            <>
              <motion.button 
                className="btn-user-refined"
                onClick={() => onNavigate('dashboard')}
                whileHover={{ scale: 1.05 }}
              >
                <User size={16} /> {userName}
              </motion.button>
              {isAdmin && (
                <motion.button 
                  className="btn-admin-refined" 
                  onClick={() => onNavigate('admin')}
                  whileHover={{ scale: 1.1, color: 'var(--color-gold)' }}
                  title="Panel de Dueño"
                >
                  <Settings size={18} />
                </motion.button>
              )}
              <motion.button 
                className="btn-logout-refined"
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
              >
                SALIR
              </motion.button>
            </>
          ) : (
            <>
              <motion.button 
                className="btn-login-refined" 
                onClick={() => onNavigate('membership')}
                whileHover={{ scale: 1.05, border: '1px solid var(--color-gold)' }}
              >
                INICIAR SESIÓN
              </motion.button>
              <motion.button 
                className="btn-primary-refined"
                whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(212, 175, 55, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onNavigate('membership')}
              >
                REGÍSTRATE
              </motion.button>
            </>
          )}
        </div>

        <button 
          className="menu-toggle mobile-only"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="mobile-menu-overlay"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
          >
            <div className="mobile-menu-content">
              {navLinks.map((link) => (
                <motion.button
                  key={link.id}
                  className="mobile-menu-item"
                  onClick={() => { onNavigate(link.id); setIsMenuOpen(false); }}
                  whileHover={{ x: 10 }}
                >
                  {link.label} <ChevronRight size={18} />
                </motion.button>
              ))}
              <hr className="menu-divider" />
              {isLoggedIn ? (
                <>
                  <button className="mobile-menu-item" onClick={() => { onNavigate('dashboard'); setIsMenuOpen(false); }}>
                    <User size={16} style={{display: 'inline', marginRight: '8px'}}/> MI CUENTA ({userName})
                  </button>
                  {isAdmin && (
                    <button className="mobile-menu-item" onClick={() => { onNavigate('admin'); setIsMenuOpen(false); }} style={{ color: 'var(--color-gold)' }}>
                      <Settings size={16} style={{display: 'inline', marginRight: '8px'}}/> PANEL DUEÑO
                    </button>
                  )}
                  <button className="mobile-menu-item" onClick={() => { handleLogout(); setIsMenuOpen(false); }} style={{ color: 'var(--color-provocative)' }}>
                    CERRAR SESIÓN
                  </button>
                </>
              ) : (
                <>
                  <button className="mobile-menu-item" onClick={() => { onNavigate('membership'); setIsMenuOpen(false); }}>
                    INICIAR SESIÓN
                  </button>
                  <button className="mobile-menu-item" onClick={() => { onNavigate('membership'); setIsMenuOpen(false); }} style={{ color: 'var(--color-gold)' }}>
                    REGÍSTRATE
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
