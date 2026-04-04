import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, FaGem, FaChartLine, FaMoneyBillWave, FaCog, FaCheckCircle, FaTimesCircle, 
  FaSignOutAlt, FaPlus, FaEdit, FaTrash, FaSave, FaClock, FaCalendarAlt, FaCalendarWeek, 
  FaCalendar, FaHourglassStart, FaHourglassHalf, FaHourglassEnd, FaBell, FaPlay, FaPause, FaRedo
} from 'react-icons/fa';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const DEFAULT_MEMBERSHIP_PLANS = [
  {
    id: 'basic',
    name: 'BÁSICO',
    description: 'Acceso esencial por horas',
    icon: '⚡',
    color: '#10b981',
    hourlyRate: 2000,
    durations: [
      { id: '1h', label: '1 Hora', hours: 1, price: 2000, active: true },
      { id: '3h', label: '3 Horas', hours: 3, price: 5000, active: true },
      { id: '6h', label: '6 Horas', hours: 6, price: 9000, active: true }
    ],
    benefits: ['Perfil visible', 'Chat básico', '1 foto destacada'],
    active: true
  },
  {
    id: 'premium',
    name: 'PREMIUM',
    description: 'Acceso completo por tiempo extendido',
    icon: '💎',
    color: '#8b5cf6',
    hourlyRate: 3500,
    durations: [
      { id: '12h', label: '12 Horas', hours: 12, price: 35000, active: true },
      { id: '24h', label: '24 Horas', hours: 24, price: 60000, active: true },
      { id: '3d', label: '3 Días', hours: 72, price: 150000, active: true }
    ],
    benefits: ['Perfil verificado', 'Chat ilimitado', '10 fotos destacadas', 'Aparición en destacados', 'Estadísticas básicas'],
    active: true
  },
  {
    id: 'elite',
    name: 'ÉLITE',
    description: 'Máximo acceso y visibilidad',
    icon: '👑',
    color: '#f59e0b',
    hourlyRate: 5000,
    durations: [
      { id: '1w', label: '1 Semana', hours: 168, price: 499990, active: true },
      { id: '2w', label: '2 Semanas', hours: 336, price: 899990, active: true },
      { id: '1m', label: '1 Mes', hours: 720, price: 1499990, active: true }
    ],
    benefits: ['Perfil VIP verificado', 'Chat ilimitado', 'Fotos ilimitadas', 'Posición #1 en búsquedas', 'Estadísticas avanzadas', 'Soporte prioritario', 'Badge exclusivo', 'Acceso a eventos VIP'],
    active: true
  }
];

const MOCK_STATS = {
  revenue: 0,
  activeProfiles: 0,
  newMemberships: 0,
  pendingProfiles: 0
};

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(MOCK_STATS);
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [membershipPlans, setMembershipPlans] = useState(() => {
    const saved = localStorage.getItem('rococo_membership_plans');
    return saved ? JSON.parse(saved) : DEFAULT_MEMBERSHIP_PLANS;
  });
  
  const [editingPlan, setEditingPlan] = useState(null);
  const [newBenefit, setNewBenefit] = useState('');
  
  const [siteSettings, setSiteSettings] = useState(() => {
    const saved = localStorage.getItem('rococo_site_settings');
    return saved ? JSON.parse(saved) : {
      siteName: 'Rococo Privé',
      allowNewRegistrations: true,
      maintenanceMode: false,
      globalAnnouncement: ''
    };
  });

  useEffect(() => {
    loadAdminData();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const loadAdminData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profiles/public`);
      const data = await res.json();
      const profiles = data.profiles || [];
      setAllProfiles(profiles);
      
      setStats({
        revenue: 0,
        activeProfiles: profiles.filter(p => p.is_public).length,
        newMemberships: profiles.length,
        pendingProfiles: profiles.filter(p => !p.is_public).length
      });
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveMembershipPlans = (plans) => {
    setMembershipPlans(plans);
    localStorage.setItem('rococo_membership_plans', JSON.stringify(plans));
  };

  const handleAddPlan = () => {
    const newPlan = {
      id: `plan_${Date.now()}`,
      name: 'NUEVO PLAN',
      description: 'Descripción del plan',
      icon: '⭐',
      color: '#3b82f6',
      hourlyRate: 0,
      durations: [{ id: 'custom', label: 'Personalizado', hours: 0, price: 0, active: true }],
      benefits: ['Beneficio básico'],
      active: true
    };
    saveMembershipPlans([...membershipPlans, newPlan]);
    setEditingPlan(newPlan.id);
  };

  const handleUpdatePlan = (planId, updates) => {
    const updated = membershipPlans.map(p => p.id === planId ? { ...p, ...updates } : p);
    saveMembershipPlans(updated);
  };

  const handleDeletePlan = (planId) => {
    if (window.confirm('¿Eliminar este plan permanentemente?')) {
      saveMembershipPlans(membershipPlans.filter(p => p.id !== planId));
      if (editingPlan === planId) setEditingPlan(null);
    }
  };

  const handleAddDuration = (planId) => {
    const updated = membershipPlans.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          durations: [...p.durations, { id: `dur_${Date.now()}`, label: 'Nueva duración', hours: 0, price: 0, active: true }]
        };
      }
      return p;
    });
    saveMembershipPlans(updated);
  };

  const handleUpdateDuration = (planId, durationId, updates) => {
    const updated = membershipPlans.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          durations: p.durations.map(d => d.id === durationId ? { ...d, ...updates } : d)
        };
      }
      return p;
    });
    saveMembershipPlans(updated);
  };

  const handleDeleteDuration = (planId, durationId) => {
    const updated = membershipPlans.map(p => {
      if (p.id === planId) {
        return { ...p, durations: p.durations.filter(d => d.id !== durationId) };
      }
      return p;
    });
    saveMembershipPlans(updated);
  };

  const handleAddBenefit = (planId) => {
    if (!newBenefit.trim()) return;
    const updated = membershipPlans.map(p => {
      if (p.id === planId) {
        return { ...p, benefits: [...p.benefits, newBenefit.trim()] };
      }
      return p;
    });
    saveMembershipPlans(updated);
    setNewBenefit('');
  };

  const handleDeleteBenefit = (planId, index) => {
    const updated = membershipPlans.map(p => {
      if (p.id === planId) {
        return { ...p, benefits: p.benefits.filter((_, i) => i !== index) };
      }
      return p;
    });
    saveMembershipPlans(updated);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('rococo_site_settings', JSON.stringify(siteSettings));
    alert('Ajustes guardados correctamente.');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } }
  };

  const renderOverview = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="admin-grid">
      <motion.div variants={itemVariants} className="stat-card glass-effect">
        <div className="stat-icon revenue-icon"><FaMoneyBillWave /></div>
        <div className="stat-info">
          <h3>INGRESOS TOTALES</h3>
          <p className="stat-value">${stats.revenue.toLocaleString('es-CL')}</p>
          <span className="stat-trend positive">Desde el inicio</span>
        </div>
      </motion.div>
      <motion.div variants={itemVariants} className="stat-card glass-effect">
        <div className="stat-icon profiles-icon"><FaUsers /></div>
        <div className="stat-info">
          <h3>PERFILES ACTIVOS</h3>
          <p className="stat-value">{stats.activeProfiles}</p>
          <span className="stat-trend">Registrados</span>
        </div>
      </motion.div>
      <motion.div variants={itemVariants} className="stat-card glass-effect">
        <div className="stat-icon mem-icon"><FaGem /></div>
        <div className="stat-info">
          <h3>PLANES ACTIVOS</h3>
          <p className="stat-value">{membershipPlans.filter(p => p.active).length}</p>
          <span className="stat-trend positive">{membershipPlans.length} configurados</span>
        </div>
      </motion.div>
      <motion.div variants={itemVariants} className="stat-card glass-effect">
        <div className="stat-icon pending-icon"><FaChartLine /></div>
        <div className="stat-info">
          <h3>PERFILES PENDIENTES</h3>
          <p className="stat-value">{stats.pendingProfiles}</p>
          <button className="small-action-btn" onClick={() => setActiveTab('profiles')}>REVISAR</button>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderMembershipPlans = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="admin-section glass-effect">
      <div className="section-header">
        <div>
          <h2>💎 GESTIÓN DE MEMBRESÍAS Y PLANES</h2>
          <p className="section-subtitle">Configura precios por hora, día o semana</p>
        </div>
        <button className="btn-primary" onClick={handleAddPlan}>
          <FaPlus /> AÑADIR PLAN
        </button>
      </div>

      <div className="membership-plans-grid">
        {membershipPlans.map(plan => (
          <motion.div key={plan.id} className="membership-plan-card glass-effect" layout style={{ borderTop: `3px solid ${plan.color}` }}>
            <div className="plan-card-header">
              <div className="plan-icon" style={{ background: `${plan.color}20`, color: plan.color }}>{plan.icon}</div>
              <div className="plan-title">
                <h3 style={{ color: plan.color }}>{plan.name}</h3>
                <p>{plan.description}</p>
              </div>
              <div className="plan-actions">
                <button className="btn-icon" onClick={() => setEditingPlan(editingPlan === plan.id ? null : plan.id)}>
                  <FaEdit />
                </button>
                <button className="btn-icon danger" onClick={() => handleDeletePlan(plan.id)}>
                  <FaTrash />
                </button>
              </div>
            </div>

            <div className="plan-status">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={plan.active} 
                  onChange={() => handleUpdatePlan(plan.id, { active: !plan.active })}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">{plan.active ? 'ACTIVO' : 'INACTIVO'}</span>
              </label>
              <div className="plan-hourly-rate">
                <FaClock /> ${plan.hourlyRate.toLocaleString('es-CL')}/hora
              </div>
            </div>

            {editingPlan === plan.id && (
              <motion.div className="plan-edit-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <div className="form-group">
                  <label>Nombre del Plan</label>
                  <input type="text" value={plan.name} onChange={(e) => handleUpdatePlan(plan.id, { name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Descripción</label>
                  <input type="text" value={plan.description} onChange={(e) => handleUpdatePlan(plan.id, { description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Ícono (emoji)</label>
                  <input type="text" value={plan.icon} onChange={(e) => handleUpdatePlan(plan.id, { icon: e.target.value })} maxLength={2} />
                </div>
                <div className="form-group">
                  <label>Color del Plan</label>
                  <input type="color" value={plan.color} onChange={(e) => handleUpdatePlan(plan.id, { color: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Tarifa Base por Hora ($)</label>
                  <input type="number" value={plan.hourlyRate} onChange={(e) => handleUpdatePlan(plan.id, { hourlyRate: parseInt(e.target.value) || 0 })} />
                </div>

                <h4>⏱️ DURACIONES Y PRECIOS</h4>
                <div className="durations-list">
                  {plan.durations.map(duration => (
                    <div key={duration.id} className="duration-item">
                      <div className="duration-fields">
                        <input type="text" value={duration.label} onChange={(e) => handleUpdateDuration(plan.id, duration.id, { label: e.target.value })} placeholder="Ej: 1 Hora" className="duration-label" />
                        <input type="number" value={duration.hours} onChange={(e) => handleUpdateDuration(plan.id, duration.id, { hours: parseInt(e.target.value) || 0 })} placeholder="Horas" className="duration-hours" />
                        <input type="number" value={duration.price} onChange={(e) => handleUpdateDuration(plan.id, duration.id, { price: parseInt(e.target.value) || 0 })} placeholder="Precio" className="duration-price" />
                        <label className="toggle-switch small">
                          <input type="checkbox" checked={duration.active} onChange={() => handleUpdateDuration(plan.id, duration.id, { active: !duration.active })} />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                      <button className="btn-icon danger small" onClick={() => handleDeleteDuration(plan.id, duration.id)}>
                        <FaTimesCircle />
                      </button>
                    </div>
                  ))}
                  <button className="btn-add-duration" onClick={() => handleAddDuration(plan.id)}>
                    <FaPlus /> AÑADIR DURACIÓN
                  </button>
                </div>

                <h4>✨ BENEFICIOS</h4>
                <ul className="benefits-list">
                  {plan.benefits.map((benefit, index) => (
                    <li key={index} className="benefit-item">
                      <FaCheckCircle className="benefit-check" style={{ color: plan.color }} />
                      <span>{benefit}</span>
                      <button className="btn-icon danger small" onClick={() => handleDeleteBenefit(plan.id, index)}>
                        <FaTimesCircle />
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="add-benefit-form">
                  <input type="text" value={newBenefit} onChange={(e) => setNewBenefit(e.target.value)} placeholder="Nuevo beneficio..." onKeyPress={(e) => e.key === 'Enter' && handleAddBenefit(plan.id)} />
                  <button className="btn-primary small" onClick={() => handleAddBenefit(plan.id)}>
                    <FaPlus /> AÑADIR
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderProfiles = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="admin-section glass-effect">
      <h2>👥 GESTIÓN DE PERFILES REGISTRADOS</h2>
      {allProfiles.length === 0 ? (
        <p className="empty-state">No hay perfiles registrados todavía.</p>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>NOMBRE</th>
                <th>ESTADO</th>
                <th>TIEMPO ACTIVO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {allProfiles.map((p, idx) => (
                <tr key={idx}>
                  <td className="profile-cell">
                    {p.photos?.[0]?.url && <img src={p.photos[0].url} alt="pic" className="mini-avatar" />}
                    <span>{p.name || 'Sin nombre'}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${p.is_public ? 'active' : 'pending'}`}>
                      {p.is_public ? 'PÚBLICO' : 'OCULTO'}
                    </span>
                  </td>
                  <td className="profile-time">
                    <FaClock /> {p.createdAt ? `${Math.floor((Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60))}h` : '0h'}
                  </td>
                  <td className="actions-cell">
                    {!p.is_public ? (
                      <button className="approve-btn" onClick={() => {
                        const updated = allProfiles.map(profile => profile.id === p.id ? { ...profile, is_public: true } : profile);
                        setAllProfiles(updated);
                      }}><FaCheckCircle /> APROBAR</button>
                    ) : (
                      <button className="suspend-btn" onClick={() => {
                        const updated = allProfiles.map(profile => profile.id === p.id ? { ...profile, is_public: false } : profile);
                        setAllProfiles(updated);
                      }}><FaTimesCircle /> OCULTAR</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );

  const renderSettings = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="admin-section glass-effect">
      <h2>⚙️ AJUSTES GENERALES DEL SITIO</h2>
      <form onSubmit={handleSaveSettings} className="settings-form">
        <div className="form-group-refined">
          <label>Nombre del Sitio</label>
          <input type="text" value={siteSettings.siteName} onChange={(e) => setSiteSettings({...siteSettings, siteName: e.target.value})} className="input-refined" />
        </div>
        <div className="form-group-refined row-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={siteSettings.allowNewRegistrations} onChange={(e) => setSiteSettings({...siteSettings, allowNewRegistrations: e.target.checked})} />
            <span className="custom-checkbox"></span>
            Permitir Nuevos Registros
          </label>
        </div>
        <div className="form-group-refined row-group">
          <label className="checkbox-label">
            <input type="checkbox" checked={siteSettings.maintenanceMode} onChange={(e) => setSiteSettings({...siteSettings, maintenanceMode: e.target.checked})} />
            <span className="custom-checkbox"></span>
            Modo Mantenimiento
          </label>
        </div>
        <div className="form-group-refined">
          <label>Anuncio Global</label>
          <textarea value={siteSettings.globalAnnouncement} onChange={(e) => setSiteSettings({...siteSettings, globalAnnouncement: e.target.value})} className="input-refined" placeholder="Mensaje para mostrar en el sitio..." rows="3" />
        </div>
        <button type="submit" className="btn-primary"><FaSave /> GUARDAR AJUSTES</button>
      </form>
    </motion.div>
  );

  return (
    <div className="admin-dashboard container page-wrapper animate-fade-in">
      <div className="admin-header">
        <div className="admin-header-content">
          <div className="admin-clock">
            <FaClock className="clock-icon" />
            <span className="clock-time">{formatTime(currentTime)}</span>
            <span className="clock-date">{formatDate(currentTime)}</span>
          </div>
          <h1>PANEL <span className="text-glow">DUEÑO</span></h1>
          <p>Centro de Comando y Configuración de Rococo Privé</p>
        </div>
        <button className="btn-logout" onClick={onLogout}><FaSignOutAlt /> SALIR</button>
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <FaChartLine /> RESUMEN
        </button>
        <button className={`tab-btn ${activeTab === 'memberships' ? 'active' : ''}`} onClick={() => setActiveTab('memberships')}>
          <FaGem /> MEMBRESÍAS
        </button>
        <button className={`tab-btn ${activeTab === 'profiles' ? 'active' : ''}`} onClick={() => setActiveTab('profiles')}>
          <FaUsers /> PERFILES
        </button>
        <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <FaCog /> AJUSTES
        </button>
      </div>

      <div className="admin-content">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <motion.div key="ov" exit={{opacity: 0}}>{renderOverview()}</motion.div>}
          {activeTab === 'memberships' && <motion.div key="mp" exit={{opacity: 0}}>{renderMembershipPlans()}</motion.div>}
          {activeTab === 'profiles' && <motion.div key="pr" exit={{opacity: 0}}>{renderProfiles()}</motion.div>}
          {activeTab === 'settings' && <motion.div key="se" exit={{opacity: 0}}>{renderSettings()}</motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
