import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css'; // Fichier CSS partagé pour l'authentification

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        const user = data.user;

        // Succès : On sauvegarde la session active
        localStorage.setItem('am_customs_current_user', JSON.stringify(user));
        
        // Redirection
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(`/profil/${user.firstname}`);
        }
        return; // On arrête la fonction ici si le serveur a répondu
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
      // Succès : On sauvegarde la session active et on redirige vers son profil
      localStorage.setItem('am_customs_current_user', JSON.stringify(user));
      if (user.role === 'admin') {
        // Si c'est l'administrateur, on l'envoie sur le tableau de bord
        navigate('/admin');
      } else {
        // Sinon, c'est un client classique, on l'envoie sur son profil
        navigate(`/profil/${user.firstname}`);
      }
    } else {
      setError('E-mail ou mot de passe incorrect.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Connexion</h1>
          <p className="auth-subtitle">Heureux de vous revoir chez AM Customs.</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Adresse e-mail</label>
            <input type="email" id="email" placeholder="exemple@domaine.com" value={formData.email} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input type="password" id="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
          </div>
          
          <button type="submit" className="btn-submit">Se connecter</button>
        </form>
        
        <div className="auth-footer">
          <p>Vous n'avez pas de compte ?</p>
          <Link to="/register" className="auth-link">Créer un compte</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;