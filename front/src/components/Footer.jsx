import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-logo">AM<span>Customs</span></h3>
          <p className="footer-description">
            L'excellence de la personnalisation automobile. Performance, esthétique et protection pour votre véhicule.
          </p>
        </div>

        <div className="footer-section">
          <h4>Navigation</h4>
          <ul>
            <li><Link to="/">Accueil</Link></li>
            <li><Link to="/track">Suivre ma réservation</Link></li>
            <li><Link to="/login">Connexion</Link></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact</h4>
          <ul>
            <li>📍 123 Avenue de l'Automobile, Paris</li>
            <li>📞 01 23 45 67 89</li>
            <li>✉️ contact@amcustoms.fr</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Horaires</h4>
          <ul>
            <li>Lun - Ven: 09:00 - 18:00</li>
            <li>Samedi: 10:00 - 16:00</li>
            <li>Dimanche: Fermé</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} AM Customs. Tous droits réservés.</p>
        <div className="footer-socials">
          <a href="#" aria-label="Instagram">IG</a>
          <a href="#" aria-label="Facebook">FB</a>
          <a href="#" aria-label="TikTok">TK</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
