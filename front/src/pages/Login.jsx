import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css'; // Fichier CSS partagé pour l'authentification

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [step, setStep] = useState(1); // 1 = Identifiants, 2 = Code A2F
  const [pendingEmail, setPendingEmail] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const finalizeLogin = (user) => {
    localStorage.setItem('am_customs_current_user', JSON.stringify(user));
    navigate(user.role === 'admin' ? '/admin' : `/profil/${user.firstname}`);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      // Tentative de connexion via le serveur
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.requires2FA) {
          setPendingEmail(data.email);
          setStep(2); // Passage à l'étape du code
          return;
        }
      } else if (response.status === 401) {
        setError('E-mail ou mot de passe incorrect.');
        return;
      }
    } catch (err) {
      console.warn("Serveur inaccessible, tentative de connexion locale.");
    }

    // --- Fallback local (si le serveur est éteint) ---
    const existingUsers = JSON.parse(localStorage.getItem('am_customs_users')) || [];
    
    // On cherche un utilisateur local avec cet email et ce mot de passe
    const user = existingUsers.find(
      u => u.email === formData.email && u.password === formData.password
    );

    if (user) {
      alert("MODE HORS LIGNE : Votre code A2F de secours est 123456");
      setPendingEmail(user.email);
      setStep(2);
    } else {
      setError('E-mail ou mot de passe incorrect.');
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, code: twoFactorCode })
      });

      if (response.ok) {
        const data = await response.json();
        finalizeLogin(data.user);
        return;
      } else {
        setError('Code de vérification incorrect.');
        return;
      }
    } catch (err) {
      console.warn("Serveur inaccessible, vérification 2FA locale.");
    }

    // Fallback local
    if (twoFactorCode === '123456') {
      const existingUsers = JSON.parse(localStorage.getItem('am_customs_users')) || [];
      const user = existingUsers.find(u => u.email === pendingEmail);
      if (user) finalizeLogin(user);
    } else {
      setError('Code de vérification incorrect.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">{step === 1 ? 'Connexion' : 'Sécurité A2F'}</h1>
          <p className="auth-subtitle">{step === 1 ? 'Heureux de vous revoir chez AM Customs.' : 'Un code de vérification est requis.'}</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        {step === 1 ? (
          <form className="auth-form" onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label htmlFor="email">Adresse e-mail</label>
              <input type="email" id="email" placeholder="exemple@domaine.com" value={formData.email} onChange={handleChange} required />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input type="password" id="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
              <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--text-gray)', textAlign: 'right', marginTop: '0.25rem', textDecoration: 'underline' }}>
                Mot de passe oublié ?
              </Link>
            </div>
            
            <button type="submit" className="btn-submit">Se connecter</button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handle2FASubmit}>
            <div className="form-group">
              <label htmlFor="twoFactorCode">Code à 6 chiffres</label>
              <input type="text" id="twoFactorCode" placeholder="123456" maxLength="6" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} required style={{textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.25rem'}} />
              <span style={{fontSize: '0.75rem', color: 'var(--text-gray)', marginTop: '0.5rem', textAlign: 'center'}}>
                Regardez la console de votre serveur Node.js pour voir le code généré.
              </span>
            </div>
            <button type="submit" className="btn-submit">Vérifier l'identité</button>
            <button type="button" onClick={() => setStep(1)} style={{background: 'none', border: 'none', color: 'var(--text-gray)', textDecoration: 'underline', cursor: 'pointer', marginTop: '1rem'}}>
              Annuler
            </button>
          </form>
        )}
        
        <div className="auth-footer">
          <p>Vous n'avez pas de compte ?</p>
          <Link to="/register" className="auth-link">Créer un compte</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;