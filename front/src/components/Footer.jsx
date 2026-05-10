import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Footer.module.scss';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>
            AM<span>Customs</span>
          </Link>
          <p>
            L'excellence automobile à votre service. Spécialistes en detailing, personnalisation et protection de véhicules de prestige.
          </p>
        </div>

        <div className={styles.links}>
          <h4>Navigation</h4>
          <Link to="/">Accueil</Link>
          <a href="#prestations">Nos Prestations</a>
          <Link to="/track">Suivre une réservation</Link>
          <Link to="/login">Espace Client</Link>
        </div>

        <div className={styles.contact}>
          <h4>Contact</h4>
          <p>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            123 Avenue de l'Excellence, 75000 Paris
          </p>
          <p>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            contact@amcustoms.fr
          </p>
          <p>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
            01 23 45 67 89
          </p>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} AM Customs. Tous droits réservés.</p>
      </div>
    </footer>
  );
};

export default Footer;