import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

function TrackBooking() {
  const [formData, setFormData] = useState({ email: '', ref: '' });
  const [appointment, setAppointment] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.id]: e.target.value });

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setAppointment(null);
    setMessage('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/appointments/track?email=${formData.email}&ref=${formData.ref}`);
      
      if (response.ok) {
        const data = await response.json();
        setAppointment(data.appointment);
        return;
      } else {
        const data = await response.json();
        setError(data.error || 'Réservation introuvable.');
        return;
      }
    } catch (err) {
      console.warn("Serveur injoignable, recherche locale...");
    }

    // Fallback Local (Mémoire de secours)
    const guestAppts = JSON.parse(localStorage.getItem('am_customs_guest_appts')) || [];
    let found = guestAppts.find(a => a.email === formData.email && a.ref === formData.ref);
    
    if (!found) {
      const allUsers = JSON.parse(localStorage.getItem('am_customs_users')) || [];
      allUsers.forEach(u => {
        const match = (u.appointments || []).find(a => a.email === formData.email && a.ref === formData.ref);
        if (match) found = match;
      });
    }

    if (found) {
      setAppointment(found);
    } else {
      setError('Aucune réservation trouvée avec ces informations.');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await fetch(`${API_URL}/api/appointments/${appointment.id}/cancel`, { method: 'PUT' });
    } catch (error) {
      console.warn("Serveur inaccessible, annulation locale uniquement.");
    }

    const updatedAppt = { ...appointment, status: 'Annulé' };
    setAppointment(updatedAppt);
    setMessage('Votre réservation a été annulée avec succès.');

    // Fallback Local : Mettre à jour la réservation invité
    const guestAppts = JSON.parse(localStorage.getItem('am_customs_guest_appts')) || [];
    const updatedGuestAppts = guestAppts.map(a => a.id === appointment.id ? updatedAppt : a);
    localStorage.setItem('am_customs_guest_appts', JSON.stringify(updatedGuestAppts));
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: appointment ? '36rem' : '28rem' }}>
        <div className="auth-header">
          <h1 className="auth-title">Suivre ma réservation</h1>
          <p className="auth-subtitle">Accédez aux détails de votre prestation via le numéro de suivi reçu par e-mail.</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        {message && <div className="toast-notification success" style={{position: 'relative', bottom: 'auto', right: 'auto', marginBottom: '1.5rem', animation: 'none', width: '100%', boxSizing: 'border-box'}}>{message}</div>}

        {!appointment ? (
          <form className="auth-form" onSubmit={handleSearch}>
            <div className="form-group">
              <label htmlFor="email">Adresse e-mail renseignée</label>
              <input type="email" id="email" placeholder="jean@exemple.com" value={formData.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="ref">Numéro de suivi</label>
              <input type="text" id="ref" placeholder="AM-12345" value={formData.ref} onChange={handleChange} required />
            </div>
            <button type="submit" className="btn-submit">Rechercher la réservation</button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Composant de carte de résultat stylisé */}
            <div style={{ backgroundColor: 'var(--bg-color)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>{appointment.action}</h3>
                <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '700', backgroundColor: appointment.status === 'Annulé' ? 'rgba(239, 68, 68, 0.15)' : (appointment.status === 'En attente' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)'), color: appointment.status === 'Annulé' ? '#FCA5A5' : (appointment.status === 'En attente' ? '#FCD34D' : '#6EE7B7') }}>{appointment.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: '700' }}>Date et Heure</span><p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: 'var(--text-main)' }}>{appointment.date}</p></div>
                <div><span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: '700' }}>Véhicule</span><p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: 'var(--primary-orange)' }}>{appointment.carModel}</p></div>
                <div><span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: '700' }}>Tarif estimé</span><p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: 'var(--text-main)' }}>{appointment.price}</p></div>
                <div><span style={{ fontSize: '0.75rem', color: 'var(--text-gray)', textTransform: 'uppercase', fontWeight: '700' }}>N° de suivi</span><p style={{ margin: '0.25rem 0 0 0', fontWeight: '600', color: 'var(--text-gray)' }}>{appointment.ref}</p></div>
              </div>
              {appointment.status === 'En attente' && (
                <button onClick={handleCancel} style={{ marginTop: '1.5rem', width: '100%', padding: '0.75rem', backgroundColor: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '0.5rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseOver={e => e.target.style.backgroundColor='rgba(239,68,68,0.1)'} onMouseOut={e => e.target.style.backgroundColor='transparent'}>Annuler la réservation</button>
              )}
            </div>
            <button onClick={() => {setAppointment(null); setMessage('');}} className="btn-submit" style={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>Nouvelle recherche</button>
          </div>
        )}

        <div className="auth-footer" style={{ marginTop: '2rem' }}>
          <Link to="/" className="auth-link">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}

export default TrackBooking;