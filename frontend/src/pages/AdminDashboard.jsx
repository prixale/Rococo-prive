import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUsers, FaGem, FaChartLine, FaMoneyBillWave, FaCog, FaCheckCircle, FaTimesCircle, FaSignOutAlt } from 'react-icons/fa';
import './AdminDashboard.css';

const MOCK_STATS = {
  revenue: 14500,
  activeProfiles: 42,
  newMemberships: 15,
  pendingProfiles: 8
};

const INITIAL_COMMISSIONS = [
  { id: 1, type: "Escort Verification", percentage: 15, basePrice: 100 },
  { id: 2, type: "VIP Membership", percentage: null, basePrice: 500 },
  { id: 3, type: "Premium Profile Placement", percentage: 20, basePrice: 250 },
  { id: 4, type: "Bookings Cut", percentage: 10, basePrice: null }
];

const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(MOCK_STATS);
  const [allProfiles, setAllProfiles] = useState([]);
  
  // New States for Interactive Editing
  const [commissions, setCommissions] = useState(INITIAL_COMMISSIONS);
  const [editingCommission, setEditingCommission] = useState(null);
  
  const [siteSettings, setSiteSettings] = useState({
    siteName: 'Rococo Privé',
    allowNewRegistrations: true,
    maintenanceMode: false,
    globalAnnouncement: ''
  });

  useEffect(() => {
    // Load local storage profiles to simulate DB
    const loadProfiles = () => {
      const loaded = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('rococo_data_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              loaded.push(JSON.parse(raw));
            } catch (e) { console.error(e); }
          }
        }
      }
      setAllProfiles(loaded);
    };
    loadProfiles();
    
    // Load commissions/settings if saved in localstorage
    const savedCommissions = localStorage.getItem('rococo_commissions');
    if(savedCommissions) {
      try { setCommissions(JSON.parse(savedCommissions)); } catch (e) {}
    }
    
    const savedSettings = localStorage.getItem('rococo_site_settings');
    if(savedSettings) {
      try { setSiteSettings(JSON.parse(savedSettings)); } catch (e) {}
    }

  }, []);

  // Update localStorage helper
  const updateProfilesStorage = (profiles) => {
    setAllProfiles([...profiles]);
    localStorage.setItem('rococo_data_all_profiles', JSON.stringify(profiles)); // sync state if using global array
    // Also update individual item if needed
    profiles.forEach(p => {
       localStorage.setItem(`rococo_data_${p.email}`, JSON.stringify(p));
    });
  };

  const handleToggleProfileStatus = (email) => {
    const updated = allProfiles.map(p => {
      if (p.email === email) {
        return { ...p, isPublic: !p.isPublic };
      }
      return p;
    });
    updateProfilesStorage(updated);
  };

  const handleSaveCommission = (id, newPercentage, newPrice) => {
    const updated = commissions.map(c => {
      if (c.id === id) {
        return { 
          ...c, 
          percentage: newPercentage !== '' ? Number(newPercentage) : null,
          basePrice: newPrice !== '' ? Number(newPrice) : null
        };
      }
      return c;
    });
    setCommissions(updated);
    localStorage.setItem('rococo_commissions', JSON.stringify(updated));
    setEditingCommission(null);
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem('rococo_site_settings', JSON.stringify(siteSettings));
    alert("Ajustes del sitio guardados correctamente.");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300 } }
  };

  const renderOverview = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="admin-grid">
      <motion.div variants={itemVariants} className="stat-card glass-effect">
        <div className="stat-icon revenue-icon"><FaMoneyBillWave /></div>
        <div className="stat-info">
          <h3>Ingresos (Semana)</h3>
          <p className="stat-value">${stats.revenue}</p>
          <span className="stat-trend positive">+12% vs última sem.</span>
        </div>
      </motion.div>
      <motion.div variants={itemVariants} className="stat-card glass-effect">
        <div className="stat-icon profiles-icon"><FaUsers /></div>
        <div className="stat-info">
          <h3>Perfiles Activos</h3>
          <p className="stat-value">{stats.activeProfiles}</p>
          <span className="stat-trend">+5 Nuevos</span>
        </div>
      </motion.div>
      <motion.div variants={itemVariants} className="stat-card glass-effect">
        <div className="stat-icon mem-icon"><FaGem /></div>
        <div className="stat-info">
          <h3>Nuevos VIPs</h3>
          <p className="stat-value">{stats.newMemberships}</p>
          <span className="stat-trend positive">+20% Renovaciones</span>
        </div>
      </motion.div>
      <motion.div variants={itemVariants} className="stat-card glass-effect">
        <div className="stat-icon pending-icon"><FaChartLine /></div>
        <div className="stat-info">
          <h3>Perfiles Pendientes</h3>
          <p className="stat-value">{stats.pendingProfiles}</p>
          <button className="small-action-btn">Revisar</button>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderCommissions = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="admin-section glass-effect">
      <div className="section-header">
        <h2>Estructura de Comisiones y Precios</h2>
        <button className="btn-primary" style={{padding: '8px 15px'}}>Añadir Nueva</button>
      </div>
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Porcentaje (%) Casa</th>
              <th>Precio Base ($)</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {commissions.map(item => (
              <tr key={item.id}>
                <td>{item.type}</td>
                {editingCommission === item.id ? (
                  <>
                    <td>
                      <input type="number" id={`pct-${item.id}`} defaultValue={item.percentage || ''} className="inline-edit-input" placeholder="Ej: 15" />
                    </td>
                    <td>
                      <input type="number" id={`price-${item.id}`} defaultValue={item.basePrice || ''} className="inline-edit-input" placeholder="Ej: 100" />
                    </td>
                    <td>
                      <button className="btn-text" style={{color: '#00FF88'}} onClick={() => {
                        const pct = document.getElementById(`pct-${item.id}`).value;
                        const price = document.getElementById(`price-${item.id}`).value;
                        handleSaveCommission(item.id, pct, price);
                      }}>Guardar</button>
                      <button className="btn-text" style={{color: '#FF0055', marginLeft: '10px'}} onClick={() => setEditingCommission(null)}>Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="text-gold font-bold">{item.percentage ? `${item.percentage}%` : 'N/A'}</td>
                    <td>{item.basePrice ? `$${item.basePrice}` : 'Variable'}</td>
                    <td>
                      <button className="btn-text" style={{marginRight: '10px'}} onClick={() => setEditingCommission(item.id)}><FaCog /> Editar</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  const renderProfiles = () => (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="admin-section glass-effect">
      <h2>Gestión de Perfiles Registrados</h2>
      {allProfiles.length === 0 ? (
        <p className="empty-state">No hay perfiles creados localmente todavía.</p>
      ) : (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nombre / Alias</th>
                <th>Estado</th>
                <th>Añadido</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {allProfiles.map((p, idx) => (
                <tr key={idx}>
                  <td className="profile-cell">
                    {p.photos?.[0]?.url && <img src={p.photos[0].url} alt="pic" className="mini-avatar" />}
                    <span>{p.profile?.name || p.email}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${p.isPublic ? 'active' : 'pending'}`}>
                      {p.isPublic ? 'Público VIP' : 'Oculto'}
                    </span>
                  </td>
                  <td>Hoy</td>
                  <td className="actions-cell">
                    {!p.isPublic ? (
                      <button className="approve-btn" onClick={() => handleToggleProfileStatus(p.email)}><FaCheckCircle /> Aprobar</button>
                    ) : (
                      <button className="suspend-btn" onClick={() => handleToggleProfileStatus(p.email)}><FaTimesCircle /> Suspender</button>
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
      <h2>Ajustes Generales del Sitio</h2>
      <form onSubmit={handleSaveSettings} className="settings-form">
        <div className="form-group-refined">
          <label>Nombre del Sitio</label>
          <input 
            type="text" 
            value={siteSettings.siteName} 
            onChange={(e) => setSiteSettings({...siteSettings, siteName: e.target.value})}
            className="input-refined"
          />
        </div>
        
        <div className="form-group-refined row-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={siteSettings.allowNewRegistrations}
              onChange={(e) => setSiteSettings({...siteSettings, allowNewRegistrations: e.target.checked})}
            />
            <span className="custom-checkbox"></span>
            Permitir Nuevos Registros
          </label>
        </div>

        <div className="form-group-refined row-group">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={siteSettings.maintenanceMode}
              onChange={(e) => setSiteSettings({...siteSettings, maintenanceMode: e.target.checked})}
            />
            <span className="custom-checkbox"></span>
            Modo Mantenimiento (Ocultar sitio al público)
          </label>
        </div>

        <div className="form-group-refined">
          <label>Anuncio Global (Banner)</label>
          <textarea 
            value={siteSettings.globalAnnouncement} 
            onChange={(e) => setSiteSettings({...siteSettings, globalAnnouncement: e.target.value})}
            className="input-refined"
            placeholder="Mensaje que aparecerá en la parte superior de todas las páginas..."
            rows="3"
          />
        </div>

        <button type="submit" className="btn-primary">Guardar Ajustes</button>
      </form>
    </motion.div>
  );

  return (
    <div className="admin-dashboard container page-wrapper animate-fade-in">
      <div className="admin-header">
        <div className="admin-header-content">
          <h1>PANEL <span className="text-glow">dueño</span></h1>
          <p>Centro de Comando y Configuración de Rococo Privé</p>
        </div>
        <button className="btn-logout" onClick={onLogout}>
          <FaSignOutAlt /> Salir
        </button>
      </div>

      <div className="admin-tabs">
        <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          Métricas y Resumen
        </button>
        <button className={`tab-btn ${activeTab === 'commissions' ? 'active' : ''}`} onClick={() => setActiveTab('commissions')}>
          Comisiones y Precios
        </button>
        <button className={`tab-btn ${activeTab === 'profiles' ? 'active' : ''}`} onClick={() => setActiveTab('profiles')}>
          Verificación de Perfiles
        </button>
        <button className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          Ajustes del Sitio
        </button>
      </div>

      <div className="admin-content">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <motion.div key="ov" exit={{opacity: 0}}>{renderOverview()}</motion.div>}
          {activeTab === 'commissions' && <motion.div key="co" exit={{opacity: 0}}>{renderCommissions()}</motion.div>}
          {activeTab === 'profiles' && <motion.div key="pr" exit={{opacity: 0}}>{renderProfiles()}</motion.div>}
          {activeTab === 'settings' && <motion.div key="se" exit={{opacity: 0}}>{renderSettings()}</motion.div>}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminDashboard;
