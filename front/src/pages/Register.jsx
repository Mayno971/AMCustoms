import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Empêche la soumission de champs ne contenant que des espaces
    if (!formData.firstname.trim() || !formData.lastname.trim() || !formData.email.trim() || !formData.password.trim() || !formData.phone.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      // Tentative d'inscription sur le serveur
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.status === 409) {
        setError('Cet e-mail est déjà utilisé.');
        return;
      }
    } catch (err) {
      console.warn("Serveur inaccessible, utilisation du stockage local uniquement.");
    }

    // On récupère la liste des utilisateurs existants (ou un tableau vide si aucun)
    const existingUsers = JSON.parse(localStorage.getItem('am_customs_users')) || [];
    
    // On vérifie si l'email existe déjà (vérification locale)
    if (existingUsers.some(user => user.email === formData.email)) {
      setError('Cet e-mail est déjà utilisé.');
      return;
    }

    // On ajoute le nouvel utilisateur (avec un tableau de rendez-vous vide) et on sauvegarde
    const newUser = { ...formData, role: 'client', appointments: [] };
    existingUsers.push(newUser);
    localStorage.setItem('am_customs_users', JSON.stringify(existingUsers));
    
    // Redirection vers la page de connexion
    navigate('/login');
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Créer un compte</h1>
          <p className="auth-subtitle">Rejoignez l'élite automobile.</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstname">Prénom</label>
              <input type="text" id="firstname" placeholder="Jean" value={formData.firstname} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="lastname">Nom</label>
              <input type="text" id="lastname" placeholder="Dupont" value={formData.lastname} onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Numéro de téléphone</label>
            <input type="tel" id="phone" placeholder="06 12 34 56 78" value={formData.phone} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label htmlFor="address">Adresse postale (Facultative)</label>
            <input type="text" id="address" placeholder="123 Avenue des Champs-Élysées, Paris" value={formData.address} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label htmlFor="email">Adresse e-mail</label>
            <input type="email" id="email" placeholder="exemple@domaine.com" value={formData.email} onChange={handleChange} required />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input type="password" id="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn-submit">S'inscrire</button>
        </form>
        
        <div className="auth-footer">
          <p>Vous avez déjà un compte ?</p>
          <Link to="/login" className="auth-link">Se connecter</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;