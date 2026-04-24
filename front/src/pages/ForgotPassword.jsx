import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function ForgotPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', phone: '', newPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('Votre mot de passe a été réinitialisé avec succès. Redirection...');
        setTimeout(() => navigate('/login'), 3000);
        return;
      } else {
        const data = await response.json();
        setError(data.error || 'Informations incorrectes.');
        return;
      }
    } catch (err) {
      console.warn("Serveur inaccessible, tentative locale.");
    }

    // --- Fallback local (si le serveur est éteint) ---
    const existingUsers = JSON.parse(localStorage.getItem('am_customs_users')) || [];
    const userIndex = existingUsers.findIndex(u => u.email === formData.email && u.phone === formData.phone);

    if (userIndex !== -1) {
      existingUsers[userIndex].password = formData.newPassword;
      localStorage.setItem('am_customs_users', JSON.stringify(existingUsers));
      setSuccess('Votre mot de passe a été réinitialisé avec succès. Redirection...');
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError('Aucun compte ne correspond à cet e-mail et numéro de téléphone.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Mot de passe oublié</h1>
          <p className="auth-subtitle">Vérifiez votre identité pour récupérer l'accès.</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="toast-notification success" style={{position: 'relative', bottom: 'auto', right: 'auto', marginBottom: '1.5rem', animation: 'none', width: '100%', boxSizing: 'border-box'}}>{success}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Adresse e-mail du compte</label>
            <input type="email" id="email" placeholder="exemple@domaine.com" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Numéro de téléphone (Vérification)</label>
            <input type="tel" id="phone" placeholder="06 12 34 56 78" value={formData.phone} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">Nouveau mot de passe</label>
            <input type="password" id="newPassword" placeholder="••••••••" value={formData.newPassword} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn-submit">Réinitialiser</button>
        </form>
        
        <div className="auth-footer">
          <p>Vous vous en souvenez ?</p>
          <Link to="/login" className="auth-link">Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;