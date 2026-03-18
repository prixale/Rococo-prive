import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  CreditCard, 
  Building2, 
  Smartphone, 
  Globe, 
  DollarSign, 
  Plus, 
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import './Wallet.css';

const WalletTab = ({ onNavigate }) => {
  const [activeSection, setActiveSection] = useState('balance');
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('CL');
  const [processing, setProcessing] = useState(false);
  const [newCard, setNewCard] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    type: 'visa'
  });

  // Payment methods by country (World Cup countries + Chile neighbors)
  const countries = {
    // World Cup countries
    CL: { name: 'Chile', currency: 'CLP', symbol: '$', flag: '🇨🇱' },
    AR: { name: 'Argentina', currency: 'ARS', symbol: '$', flag: '🇦🇷' },
    BR: { name: 'Brasil', currency: 'BRL', symbol: 'R$', flag: '🇧🇷' },
    CO: { name: 'Colombia', currency: 'COP', symbol: '$', flag: '🇨🇴' },
    MX: { name: 'México', currency: 'MXN', symbol: '$', flag: '🇲🇽' },
    US: { name: 'Estados Unidos', currency: 'USD', symbol: '$', flag: '🇺🇸' },
    ES: { name: 'España', currency: 'EUR', symbol: '€', flag: '🇪🇸' },
    PT: { name: 'Portugal', currency: 'EUR', symbol: '€', flag: '🇵🇹' },
    GB: { name: 'Reino Unido', currency: 'GBP', symbol: '£', flag: '🇬🇧' },
    FR: { name: 'Francia', currency: 'EUR', symbol: '€', flag: '🇫🇷' },
    DE: { name: 'Alemania', currency: 'EUR', symbol: '€', flag: '🇩🇪' },
    IT: { name: 'Italia', currency: 'EUR', symbol: '€', flag: '🇮🇹' },
    NL: { name: 'Países Bajos', currency: 'EUR', symbol: '€', flag: '🇳🇱' },
    BE: { name: 'Bélgica', currency: 'EUR', symbol: '€', flag: '🇧🇪' },
    JP: { name: 'Japón', currency: 'JPY', symbol: '¥', flag: '🇯🇵' },
    KR: { name: 'Corea del Sur', currency: 'KRW', symbol: '₩', flag: '🇰🇷' },
    AU: { name: 'Australia', currency: 'AUD', symbol: '$', flag: '🇦🇺' },
    CA: { name: 'Canadá', currency: 'CAD', symbol: '$', flag: '🇨🇦' },
    CH: { name: 'Suiza', currency: 'CHF', symbol: 'Fr', flag: '🇨🇭' },
    // Chile neighbors
    PE: { name: 'Perú', currency: 'PEN', symbol: 'S/', flag: '🇵🇪' },
    BO: { name: 'Bolivia', currency: 'BOB', symbol: 'Bs', flag: '🇧🇴' },
    PY: { name: 'Paraguay', currency: 'PYG', symbol: '₲', flag: '🇵🇾' },
    UY: { name: 'Uruguay', currency: 'UYU', symbol: '$', flag: '🇺🇾' },
  };

  // Payment methods available
  const paymentMethods = [
    { id: 'visa', name: 'Visa', icon: '💳' },
    { id: 'mastercard', name: 'Mastercard', icon: '💳' },
    { id: 'amex', name: 'American Express', icon: '💳' },
    { id: 'paypal', name: 'PayPal', icon: '📧' },
    { id: 'webpay', name: 'WebPay (Chile)', icon: '💳' },
    { id: 'servipag', name: 'ServiPag (Chile)', icon: '💰' },
    { id: 'multicaja', name: 'Multicaja (Chile)', icon: '📦' },
    { id: 'santander', name: 'Santander (Chile)', icon: '🏦' },
    { id: 'bcb', name: 'Banco de Chile', icon: '🏦' },
    { id: 'scotiabank', name: 'Scotiabank Chile', icon: '🏦' },
    { id: 'bancoestado', name: 'BancoEstado', icon: '🏦' },
    { id: 'cibc', name: 'Banco Itaú Chile', icon: '🏦' },
    { id: ' PSE', name: 'PSE (Colombia)', icon: '🏦' },
    { id: 'oxxo', name: 'OXXO (México)', icon: '🏪' },
    { id: 'baloto', name: 'Baloto (Colombia)', icon: '🎰' },
    { id: 'loteria', name: 'Lotería (Argentina)', icon: '🎱' },
    { id: 'picpay', name: 'PicPay (Brasil)', icon: '📱' },
    { id: 'mercadopago', name: 'MercadoPago', icon: '💲' },
    { id: 'klarna', name: 'Klarna (Europa)', icon: '🛒' },
    { id: 'afterpay', name: 'Afterpay', icon: '💳' },
    { id: 'crypto', name: 'Criptomonedas', icon: '₿' },
  ];

  // Cards stored in localStorage
  const [cards, setCards] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('rococo_cards') || '[]');
    } catch { return []; }
  });

  const formatCardNumber = (val) => {
    return val.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim().slice(0, 19);
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    if (newCard.number.replace(/\s/g, '').length < 16) {
      alert('Número de tarjeta inválido.');
      return;
    }
    const masked = '•••• •••• •••• ' + newCard.number.replace(/\s/g, '').slice(-4);
    const card = { ...newCard, masked, id: Date.now(), country: selectedCountry };
    const updated = [...cards, card];
    setCards(updated);
    localStorage.setItem('rococo_cards', JSON.stringify(updated));
    setNewCard({ number: '', name: '', expiry: '', cvv: '', type: 'visa' });
    setShowAddCard(false);
  };

  const removeCard = (id) => {
    const updated = cards.filter(c => c.id !== id);
    setCards(updated);
    localStorage.setItem('rococo_cards', JSON.stringify(updated));
  };

  const handleDeposit = (e) => {
    e.preventDefault();
    const amount = parseFloat(e.target.amount.value);
    if (!amount || amount <= 0) {
      alert('Monto inválido');
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setBalance(balance + amount);
      setTransactions([{ type: 'Depósito', amount, date: new Date().toLocaleString(), icon: '💰' }, ...transactions]);
      setProcessing(false);
      alert('Depósito realizado con éxito!');
    }, 2000);
  };

  const handleWithdraw = (e) => {
    e.preventDefault();
    const amount = parseFloat(e.target.amount.value);
    if (!amount || amount <= 0) {
      alert('Monto inválido');
      return;
    }
    if (amount > balance) {
      alert('Saldo insuficiente');
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setBalance(balance - amount);
      setTransactions([{ type: 'Retiro', amount: -amount, date: new Date().toLocaleString(), icon: '📤' }, ...transactions]);
      setProcessing(false);
      alert('Retiro solicitado con éxito!');
    }, 2000);
  };

  const country = countries[selectedCountry];

  const renderContent = () => {
    switch (activeSection) {
      case 'balance':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="wallet-balance-card glass-effect">
              <div className="balance-header">
                <Wallet size={24} />
                <span>Tu Balance</span>
              </div>
              <div className="balance-amount">
                <span className="currency">{country.flag} {country.symbol}</span>
                <span className="amount">{balance.toLocaleString()}</span>
              </div>
              <div className="balance-actions">
                <button className="btn-deposit" onClick={() => setActiveSection('deposit')}>
                  <Plus size={18} /> Depositar
                </button>
                <button className="btn-withdraw" onClick={() => setActiveSection('withdraw')}>
                  <DollarSign size={18} /> Retirar
                </button>
              </div>
            </div>

            <div className="country-selector glass-effect">
              <Globe size={20} />
              <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                {Object.entries(countries).map(([code, c]) => (
                  <option key={code} value={code}>{c.flag} {c.name} ({c.currency})</option>
                ))}
              </select>
            </div>

            <div className="transactions-section">
              <h3><CheckCircle size={20} /> Actividad Reciente</h3>
              {transactions.length === 0 ? (
                <div className="no-transactions glass-effect">
                  <AlertCircle size={40} />
                  <p>Sin movimientos aún</p>
                </div>
              ) : (
                <div className="transactions-list">
                  {transactions.map((tx, idx) => (
                    <div key={idx} className="transaction-item glass-effect">
                      <span className="tx-icon">{tx.icon}</span>
                      <div className="tx-info">
                        <span className="tx-type">{tx.type}</span>
                        <span className="tx-date">{tx.date}</span>
                      </div>
                      <span className={`tx-amount ${tx.amount > 0 ? 'positive' : 'negative'}`}>
                        {tx.amount > 0 ? '+' : ''}{country.symbol}{Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'deposit':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="deposit-section glass-effect">
              <h3><CreditCard size={24} /> Depositar Fondos</h3>
              
              <div className="country-selector">
                <Globe size={20} />
                <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                  {Object.entries(countries).map(([code, c]) => (
                    <option key={code} value={code}>{c.flag} {c.name} ({c.currency})</option>
                  ))}
                </select>
              </div>

              <div className="payment-methods-grid">
                {paymentMethods.slice(0, 12).map(pm => (
                  <div key={pm.id} className="payment-method-card">
                    <span className="pm-icon">{pm.icon}</span>
                    <span className="pm-name">{pm.name}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleDeposit} className="deposit-form">
                <div className="form-group">
                  <label>Monto a Depositar ({country.currency})</label>
                  <input type="number" name="amount" placeholder="0.00" required />
                </div>
                <div className="quick-amounts">
                  {[10000, 25000, 50000, 100000].map(amt => (
                    <button key={amt} type="button" onClick={(e) => e.target.form.amount.value = amt}>
                      {country.symbol}{amt.toLocaleString()}
                    </button>
                  ))}
                </div>
                <button type="submit" className="btn-submit" disabled={processing}>
                  {processing ? 'PROCESANDO...' : `✅ CONFIRMAR DEPÓSITO EN ${country.currency}`}
                </button>
              </form>
            </div>
          </motion.div>
        );

      case 'withdraw':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="withdraw-section glass-effect">
              <h3><Building2 size={24} /> Retirar Fondos</h3>
              
              <div className="country-selector">
                <Globe size={20} />
                <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                  {Object.entries(countries).map(([code, c]) => (
                    <option key={code} value={code}>{c.flag} {c.name} ({c.currency})</option>
                  ))}
                </select>
              </div>

              <div className="payment-methods-grid">
                {paymentMethods.slice(0, 12).map(pm => (
                  <div key={pm.id} className="payment-method-card">
                    <span className="pm-icon">{pm.icon}</span>
                    <span className="pm-name">{pm.name}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleWithdraw} className="withdraw-form">
                <div className="form-group">
                  <label>Monto a Retirar ({country.currency})</label>
                  <input type="number" name="amount" placeholder="0.00" required />
                </div>
                <div className="form-group">
                  <label>Número de Cuenta / IBAN</label>
                  <input type="text" placeholder="XXXX XXXX XXXX XXXX" required />
                </div>
                <button type="submit" className="btn-submit" disabled={processing}>
                  {processing ? 'VERIFICANDO...' : `📤 SOLICITAR RETIRO EN ${country.currency}`}
                </button>
              </form>
            </div>
          </motion.div>
        );

      case 'cards':
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="cards-section">
              <div className="section-header">
                <h3><CreditCard size={24} /> Mis Métodos de Pago</h3>
                <button className="btn-add" onClick={() => setShowAddCard(!showAddCard)}>
                  <Plus size={18} /> Agregar
                </button>
              </div>

              {showAddCard && (
                <div className="add-card-form glass-effect">
                  <h4>Agregar Nuevo Método de Pago</h4>
                  <form onSubmit={handleAddCard}>
                    <div className="form-group">
                      <label>País</label>
                      <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
                        {Object.entries(countries).map(([code, c]) => (
                          <option key={code} value={code}>{c.flag} {c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Tipo de Pago</label>
                      <select value={newCard.type} onChange={(e) => setNewCard({ ...newCard, type: e.target.value })}>
                        {paymentMethods.map(pm => (
                          <option key={pm.id} value={pm.id}>{pm.icon} {pm.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Número de Tarjeta/Cuenta</label>
                      <input type="text" value={newCard.number} onChange={(e) => setNewCard({ ...newCard, number: formatCardNumber(e.target.value) })} placeholder="XXXX XXXX XXXX XXXX" maxLength={19} required />
                    </div>
                    <div className="form-group">
                      <label>Nombre del Titular</label>
                      <input type="text" value={newCard.name} onChange={(e) => setNewCard({ ...newCard, name: e.target.value.toUpperCase() })} placeholder="NOMBRE APELLIDO" required />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Vencimiento</label>
                        <input type="text" value={newCard.expiry} onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })} placeholder="MM/AA" maxLength={5} required />
                      </div>
                      <div className="form-group">
                        <label>CVV</label>
                        <input type="password" value={newCard.cvv} onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })} placeholder="***" maxLength={4} required />
                      </div>
                    </div>
                    <button type="submit" className="btn-submit">🔒 VINCULAR MÉTODO DE PAGO</button>
                  </form>
                </div>
              )}

              {cards.length === 0 && !showAddCard ? (
                <div className="no-cards glass-effect">
                  <CreditCard size={60} />
                  <p>No tienes métodos de pago vinculados</p>
                  <button onClick={() => setShowAddCard(true)}>Agregar Primer Método</button>
                </div>
              ) : (
                <div className="cards-grid">
                  {cards.map(card => (
                    <div key={card.id} className={`card-item ${card.type}`}>
                      <div className="card-header">
                        <span className="card-type">{paymentMethods.find(p => p.id === card.type)?.icon} {paymentMethods.find(p => p.id === card.type)?.name}</span>
                        <span className="card-country">{countries[card.country]?.flag}</span>
                      </div>
                      <div className="card-number">{card.masked}</div>
                      <div className="card-footer">
                        <span>{card.name}</span>
                        <button onClick={() => removeCard(card.id)}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="wallet-container">
      <div className="wallet-tabs">
        <button className={activeSection === 'balance' ? 'active' : ''} onClick={() => setActiveSection('balance')}>
          <Wallet size={20} /> Balance
        </button>
        <button className={activeSection === 'deposit' ? 'active' : ''} onClick={() => setActiveSection('deposit')}>
          <CreditCard size={20} /> Depositar
        </button>
        <button className={activeSection === 'withdraw' ? 'active' : ''} onClick={() => setActiveSection('withdraw')}>
          <Building2 size={20} /> Retirar
        </button>
        <button className={activeSection === 'cards' ? 'active' : ''} onClick={() => setActiveSection('cards')}>
          <Smartphone size={20} /> Métodos
        </button>
      </div>
      {renderContent()}
    </div>
  );
};

export default WalletTab;
