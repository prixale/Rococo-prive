import React from 'react';
import { motion } from 'framer-motion';
import { Home, Compass, Plus, MessageSquare, User, Settings } from 'lucide-react';
import './MobileNav.css';

const MobileNav = ({ onNavigate, activePage }) => {
  const navItems = [
    { id: 'home', icon: <Home size={20} />, label: 'INICIO' },
    { id: 'discover', icon: <Compass size={20} />, label: 'DESCUBRIR' },
    { id: 'center', icon: <Plus size={24} />, isCenter: true },
    { id: 'dashboard', icon: <User size={20} />, label: 'CUENTA' },
    { id: 'admin', icon: <Settings size={20} color="var(--color-gold)" />, label: 'DUEÑO' },
  ];

  return (
    <div className="mobile-nav">
      {navItems.map((item) => (
        <React.Fragment key={item.id}>
          {item.isCenter ? (
            <div className="mobile-nav-center" onClick={() => onNavigate('membership')}>
              <motion.div 
                className="center-btn"
                whileTap={{ scale: 0.9, rotate: 90 }}
                whileHover={{ scale: 1.1 }}
              >
                <Plus size={28} color="#000" />
              </motion.div>
            </div>
          ) : (
            <motion.div 
              className={`mobile-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              whileTap={{ scale: 1.2 }}
            >
              <div className="nav-icon-container">
                {item.icon}
                {activePage === item.id && (
                  <motion.div 
                    className="active-dot"
                    layoutId="activeDot"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
              <span className="nav-label">{item.label}</span>
            </motion.div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default MobileNav;
