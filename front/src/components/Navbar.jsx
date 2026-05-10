import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  
  // Récupération de l'utilisateur actuel pour adapter l'affichage
  const currentUser = JSON.parse(localStorage.getItem('am_customs_current_user'));

  const handleLogout = () => {
    localStorage.removeItem('am_customs_current_user');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          AM<span>Customs</span>
        </Link>
      </div>

      <ul className="navbar-menu">
        <li><Link to="/">Accueil</Link></li>
        <li><Link to="/track">Suivre ma réservation</Link></li>
        
        {currentUser ? (
          <>
            <li><Link to={currentUser.role === 'admin' ? '/admin' : `/profil/${currentUser.firstname}`}>Mon Espace</Link></li>
            <li><button onClick={handleLogout} className="btn-logout" style={{ cursor: 'pointer' }}>Déconnexion</button></li>
          </>
        ) : (
          <li><Link to="/login" className="btn-login">Connexion</Link></li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
