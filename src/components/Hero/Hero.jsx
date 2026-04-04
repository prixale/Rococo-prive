import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import './Hero.css';

const HeroLogo3D = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["25deg", "-25deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-25deg", "25deg"]);
  
  const scale = useTransform(
    mouseYSpring, 
    [-0.5, 0, 0.5], 
    [1.05, 1, 1.05]
  );

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
      className="hero-logo-3d-container"
      style={{ 
        rotateX, 
        rotateY, 
        scale,
        transformStyle: "preserve-3d", 
        perspective: 1500 
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.8 }}
    >
      <img 
        src="/assets/logo_emblem.png" 
        alt="Rococo Prive" 
        className="hero-main-logo"
      />
    </motion.div>
  );
};

const Hero = ({ onNavigate }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
    visible: { 
      opacity: 1, 
      y: 0, 
      filter: 'blur(0px)',
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    }
  };

  return (
    <section className="hero">
      <motion.div 
        className="hero-content container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <HeroLogo3D />
         
        <motion.h1 
          variants={itemVariants} 
          className="hero-luxury-title"
        >
          EL ARTE DE LA <span className="text-glow">seducción</span>
        </motion.h1>

        <motion.p className="hero-provocative-text" variants={itemVariants}>
          Exclusividad, Placer y Elegancia en Rococo Privé
        </motion.p>

        <motion.div className="hero-cta-wrapper" variants={itemVariants}>
          <button className="hero-btn-primary" onClick={() => onNavigate && onNavigate('discover')}>EXPLORAR ESCORTS</button>
          <button className="hero-btn-secondary" onClick={() => onNavigate && onNavigate('membership')}>VER MEMBRESÍAS</button>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;
