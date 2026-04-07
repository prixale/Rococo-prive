import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUsers, FaGem, FaChartLine, FaMoneyBillWave, FaCog, FaCheckCircle, FaTimesCircle, 
  FaSignOutAlt, FaPlus, FaEdit, FaTrash, FaSave, FaClock, FaCalendarAlt, FaCalendarWeek, 
  FaCalendar, FaHourglassStart, FaHourglassHalf, FaHourglassEnd, FaBell, FaPlay, FaPause, FaRedo
} from 'react-icons/fa';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const DEFAULT_MEMBERSHIP_PLANS = [];

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
  const [membershipPlans, setMembershipPlans] = useState([]);
  
  const [editingPlan, setEditingPlan] = useState(null);
  const [editFormData, setEditFormData] = useState({ name: '', duration_days: 0, price: 0 });
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
    loadPlans();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const loadPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/plans`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.plans) setMembershipPlans(data.plans);
    } catch (err) {
      console.error('Error loading plans', err);
    }
  };

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

  const handleAddPlan = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/admin/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: 'NUEVO PLAN', duration_days: 7, price: 10000 })
      });
      if (res.ok) loadPlans();
    } catch (err) {
      console.error('Error adding plan', err);
    }
  };

  const handleUpdatePlan = async (planId, updates) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/admin/plans/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updates)
      });
      loadPlans();
      setEditingPlan(null);
    } catch (err) {
      console.error('Error updating plan', err);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('¿Eliminar este plan permanentemente?')) {
      try {
        const token = localStorage.getItem('token');
        await fetch(`${API_URL}/api/admin/plans/${planId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        loadPlans();
        if (editingPlan === planId) setEditingPlan(null);
      } catch (err) {
        console.error('Error deleting plan', err);
      }
    }
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
              <div className="plan-icon" style={{ background: `#10b98120`, color: '#10b981' }}>💎</div>
              <div className="plan-title">
                <h3 style={{ color: '#10b981' }}>{plan.name}</h3>
                <p>{plan.duration_days} días - ${plan.price.toLocaleString('es-CL')} CLP</p>
              </div>
              <div className="plan-actions">
                <button className="btn-icon" onClick={() => {
                  setEditingPlan(editingPlan === plan.id ? null : plan.id);
                  if (editingPlan !== plan.id) setEditFormData({ name: plan.name, duration_days: plan.duration_days, price: plan.price });
                }}>
                  <FaEdit />
                </button>
                <button className="btn-icon danger" onClick={() => handleDeletePlan(plan.id)}>
                  <FaTrash />
                </button>
              </div>
            </div>

            {editingPlan === plan.id && (
              <motion.div className="plan-edit-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <div className="form-group">
                  <label>Nombre del Plan</label>
                  <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({...editFormData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Duración (Días)</label>
                  <input type="number" value={editFormData.duration_days} onChange={(e) => setEditFormData({...editFormData, duration_days: parseInt(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label>Precio ($)</label>
                  <input type="number" value={editFormData.price} onChange={(e) => setEditFormData({...editFormData, price: parseInt(e.target.value) || 0})} />
                </div>
                <button className="btn-primary small" onClick={() => handleUpdatePlan(plan.id, editFormData)}>
                  <FaSave /> GUARDAR CAMBIOS
                </button>
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
