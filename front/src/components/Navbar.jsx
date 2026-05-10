import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Navbar.module.scss';

const Navbar = () => {
  const navigate = useNavigate();
  
  // Récupération de l'utilisateur actuel pour adapter l'affichage
  const currentUser = JSON.parse(localStorage.getItem('am_customs_current_user'));

  const handleLogout = () => {
    localStorage.removeItem('am_customs_current_user');
    navigate('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.navbarBrand}>
        <Link to="/" className={styles.navbarLogo}>
          AM<span>Customs</span>
        </Link>
      </div>

      <ul className={styles.navbarMenu}>
        <li><Link to="/" className={styles.navLink}>Accueil</Link></li>
        <li><Link to="/track" className={styles.navLink}>Suivre ma réservation</Link></li>
        
        {currentUser ? (
          <>
            <li><Link to={currentUser.role === 'admin' ? '/admin' : `/profil/${currentUser.firstname}`} className={styles.navLink}>Mon Espace</Link></li>
            <li><button onClick={handleLogout} className={styles.btnLogout}>Déconnexion</button></li>
          </>
        ) : (
          <li><Link to="/login" className={styles.btnLogin}>Connexion</Link></li>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
