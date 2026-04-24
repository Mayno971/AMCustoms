import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import Accueil from './pages/Accueil';
import Profil from './pages/Profil';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import ForgotPassword from './pages/ForgotPassword';
import './App.css';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Met à jour la navbar automatiquement à chaque changement de page
    const currentUser = JSON.parse(localStorage.getItem('am_customs_current_user'));
    setUser(currentUser);
  }, [location]);

  const handleLogout = () => {
    // Simulation d'une déconnexion SSO Globale
    localStorage.removeItem('am_customs_current_user');
    sessionStorage.clear(); // Nettoie les sessions temporaires
    setUser(null);
    
    // Redirection stricte vers le login pour valider la coupure d'accès (Comportement typique SSO)
    navigate('/login');
  };

  return (
      <div className="app-container">
        {/* Navigation Premium */}
        <nav className="app-nav" aria-label="Menu principal">
          <div className="nav-left">
            <Link to="/" className="nav-brand" aria-label="Retour à l'accueil AM Customs">
              AM <span className="text-accent">CUSTOMS</span>
            </Link>
            
            <div className="nav-links">
              <Link to="/" className="nav-link">
                Accueil
              </Link>
              <a href="/#prestations" className="nav-link">Prestations</a>
              <a href="/#contact" className="nav-link">Contact</a>
            </div>
          </div>

          <div className="nav-right">
            <button className="nav-lang">
              FR
            </button>
            
            {user ? (
              <div className="user-actions">
                <Link to={user.role === 'admin' ? '/admin' : `/profil/${user.firstname}`} className="nav-profile-btn" title={user.role === 'admin' ? "Espace Administrateur" : "Mon Profil"}>
                  <div className="avatar-circle">
                    {user.role === 'admin' ? 'AD' : `${user.firstname.charAt(0)}${user.lastname ? user.lastname.charAt(0) : ''}`}
                  </div>
                  <span className="profile-name">{user.role === 'admin' ? 'Admin' : user.firstname}</span>
                </Link>
                <button onClick={handleLogout} className="btn-logout-nav">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-login-nav">
                SE CONNECTER
              </Link>
            )}
          </div>
        </nav>

        {/* Contenu des routes */}
        <main>
          <Routes>
            <Route path="/" element={<Accueil />} />
            <Route path="/profil/:nom" element={<Profil />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/admin" element={<Admin />} />
            
            {/* Page 404 Stylisée */}
            <Route path="*" element={
              <div className="not-found-container">
                <h1 className="not-found-title">404</h1>
                <h2 className="not-found-subtitle">Page introuvable</h2>
                <Link to="/" className="not-found-link">Retourner à l'accueil</Link>
              </div>
            } />
          </Routes>
        </main>
      </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;