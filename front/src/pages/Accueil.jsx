import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Accueil.css';

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

function Accueil() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [carModel, setCarModel] = useState('');
  const [details, setDetails] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);

  // États pour la réservation Invité (Guest)
  const [guestFirstname, setGuestFirstname] = useState('');
  const [guestLastname, setGuestLastname] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Date de demain au format YYYY-MM-DD (Réservation minimum à J+1)
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];
  
  useEffect(() => {
    if (!bookingDate) {
      setBookedSlots([]);
      return;
    }

    const fetchBookedSlots = async () => {
      try {
        // Requête GET vers votre futur serveur pour vérifier les dispos
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/api/appointments?date=${bookingDate}`);
        if (response.ok) {
          const data = await response.json();
          setBookedSlots(data.bookedTimes); // Le serveur renvoie ex: ['09:00', '14:00']
          return;
        }
      } catch (error) {
        console.warn("Serveur non détecté, utilisation des données locales.");
      }

      // Fallback local en attendant que le serveur soit prêt
      const allUsers = JSON.parse(localStorage.getItem('am_customs_users')) || [];
      const booked = [];
      allUsers.forEach(u => {
        (u.appointments || []).forEach(appt => {
          const [datePart, timePart] = appt.date.split(' à ');
          if (datePart === bookingDate && appt.status !== 'Annulé') booked.push(timePart);
        });
      });
      setBookedSlots(booked);
    };

    fetchBookedSlots();
  }, [bookingDate, isModalOpen]);

  const handleBookClick = (service) => {
    setSelectedService(service);
    
    // Pré-sélection de la date la plus proche (Demain) pour afficher immédiatement les dispos
    setBookingDate(tomorrow); 
    setBookingTime('');
    setCarModel('');
    setDetails('');
    setIsModalOpen(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime) return;

    const currentUser = JSON.parse(localStorage.getItem('am_customs_current_user'));
    const isGuest = !currentUser;
    
    const newAppt = {
      id: Date.now(),
      userId: isGuest ? `guest_${Date.now()}` : currentUser.email,
      clientName: isGuest ? `${guestFirstname} ${guestLastname}` : `${currentUser.firstname} ${currentUser.lastname}`,
      email: isGuest ? guestEmail : currentUser.email,
      phone: isGuest ? guestPhone : (currentUser.phone || 'Non renseigné'),
      carModel: carModel,
      details: details,
      date: `${bookingDate} à ${bookingTime}`,
      action: selectedService.title,
      status: 'En attente',
      price: selectedService.price || 'Sur devis'
    };
    
    try {
      // Requête POST pour envoyer la réservation au serveur
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppt),
      });
      if (!response.ok) {
        console.warn("Erreur lors de l'enregistrement sur le serveur.");
      }
    } catch (error) {
      console.error("Serveur inaccessible, sauvegarde locale uniquement.", error);
    }

    // Sauvegarde locale (Fallback pour que le site continue de fonctionner instantanément)
    if (!isGuest) {
      const updatedUser = { 
        ...currentUser, 
        appointments: [...(currentUser.appointments || []), newAppt] 
      };
      
      localStorage.setItem('am_customs_current_user', JSON.stringify(updatedUser));
      
      const allUsers = JSON.parse(localStorage.getItem('am_customs_users')) || [];
      const updatedUsers = allUsers.map(u => u.email === updatedUser.email ? updatedUser : u);
      localStorage.setItem('am_customs_users', JSON.stringify(updatedUsers));
    }

    setIsModalOpen(false);
    setBookingDate('');
    setBookingTime('');
    
    // Affichage de la notification de succès
    setToastMessage(`Rendez-vous confirmé le ${bookingDate} à ${bookingTime}`);
    setTimeout(() => setToastMessage(''), 5000);
  };

  return (
    <div className="accueil-page">
      
      {/* Background Decoratif (Fixé pour ne pas bouger au scroll) */}
      <div className="bg-decorations">
        <div className="glow-orange"></div>
        <div className="glow-cyan"></div>
      </div>

      <main className="main-content">
        
        {/* Section Hero */}
        <section className="hero-section">
          <div className="hero-text">
            <div className="hero-badge">
              Atelier de Prestige
            </div>
            <h1 className="hero-title">
              L'ADN DU <br />
              <span>PRESTIGE.</span>
            </h1>
            <p className="hero-desc">
              Élevez le style de votre véhicule. Spécialiste en nettoyage complet, rénovation et peinture sur mesure.
            </p>
            <div className="hero-actions">
              <button className="btn-explore">
                Explorer
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                </svg>
              </button>
              <button className="btn-portfolio">
                Portfolio
              </button>
            </div>
          </div>
          
          <div className="hero-visual">
             <div className="hero-glow"></div>
             <div className="hero-image-container">
               <img 
                 src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&q=80&w=1000" 
                 alt="Supercar Custom" 
                 className="hero-image"
               />
               <div className="hero-overlay"></div>
             </div>
          </div>
        </section>

        {/* Section Prestations */}
        <section id="prestations" className="services-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-line"></span> Nos Prestations
            </h2>
          </div>
          
          <div className="services-grid">
            {/* Service: Nettoyage Int/Ext */}
            <ServiceCard 
              title="Nettoyage Intérieur/Extérieur"
              desc="Nettoyage complet et minutieux de l'habitacle et de la carrosserie de votre véhicule."
              img="https://images.unsplash.com/photo-1601362840469-51e4d8d58785?auto=format&fit=crop&q=60&w=500"
              color="#00E5FF"
              price="À partir de 60 €"
              onBook={handleBookClick}
            />
            {/* Service: Phares */}
            <ServiceCard 
              title="Rénovation Phares"
              desc="Restauration de la clarté et de la brillance de vos phares ternis ou jaunis par le temps."
              img="https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&q=60&w=500"
              color="#FACC15"
              price="À partir de 50 €"
              onBook={handleBookClick}
            />
            {/* Service: Jantes & Étriers */}
            <ServiceCard 
              title="Peintures Jantes & Étriers"
              desc="Personnalisation et protection haute résistance pour vos jantes et étriers de frein."
              img="https://images.unsplash.com/photo-1551522435-a13afa10f103?auto=format&fit=crop&q=60&w=500"
              color="#FF4D00"
              price="À partir de 250 €"
              onBook={handleBookClick}
            />
            {/* Service: Shampooing */}
            <ServiceCard 
              title="Shampooing Sièges & Moquettes"
              desc="Nettoyage en profondeur par extraction pour sièges, moquettes et même canapés."
              img="https://images.unsplash.com/photo-1605276374104-162f15cebcd1?auto=format&fit=crop&q=60&w=500"
              color="#A855F7"
              price="À partir de 80 €"
              onBook={handleBookClick}
            />
            {/* Service: Haute Pression */}
            <ServiceCard 
              title="Nettoyage Haute Pression"
              desc="Décrassage intensif de la carrosserie et des soubassements au nettoyeur haute pression."
              img="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=60&w=500"
              color="#3B82F6"
              price="À partir de 40 €"
              onBook={handleBookClick}
            />
          </div>
        </section>
      </main>

      <footer className="main-footer">
        <div className="footer-content">
          <p className="footer-copy">
            © 2026 AM CUSTOMS — Excellence Automobile
          </p>
          <div className="footer-links">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="footer-link">Instagram</a>
            <a id="contact" href="mailto:contact@amcustoms.fr" className="footer-link">Contact</a>
          </div>
        </div>
      </footer>

      {/* Modal de Réservation */}
      {isModalOpen && (
        <div 
          className="booking-modal-overlay" 
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="booking-modal" onClick={e => e.stopPropagation()}>
            <div className="booking-modal-header">
              <h3 id="modal-title">Réserver : {selectedService?.title}</h3>
              <button className="btn-close-modal" aria-label="Fermer la fenêtre de réservation" onClick={() => setIsModalOpen(false)}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            <form className="booking-form" onSubmit={handleBookingSubmit}>
              
              {/* Affichage des champs de contact si l'utilisateur n'est pas connecté */}
              {!JSON.parse(localStorage.getItem('am_customs_current_user')) && (
                <div className="guest-booking-fields">
                  <p style={{fontSize: '0.875rem', color: 'var(--text-gray)', marginBottom: '1rem'}}>Vous réservez en tant qu'invité. Connectez-vous pour pré-remplir ces informations.</p>
                  <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem'}}>
                    <div className="form-group" style={{flex: 1}}>
                      <label>Prénom</label>
                      <input type="text" placeholder="Jean" value={guestFirstname} onChange={e => setGuestFirstname(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{flex: 1}}>
                      <label>Nom</label>
                      <input type="text" placeholder="Dupont" value={guestLastname} onChange={e => setGuestLastname(e.target.value)} required />
                    </div>
                  </div>
                  <div className="form-group" style={{marginBottom: '1.5rem'}}>
                    <label>E-mail</label>
                    <input type="email" placeholder="jean@exemple.com" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} required />
                  </div>
                  <div className="form-group" style={{marginBottom: '1.5rem'}}>
                    <label>Téléphone</label>
                    <input type="tel" placeholder="06 12 34 56 78" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} required />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="bookingDate">Date souhaitée</label>
                <input 
                  type="date" 
                  id="bookingDate" 
                  min={tomorrow}
                  value={bookingDate} 
                  onChange={(e) => { setBookingDate(e.target.value); setBookingTime(''); }} 
                  required 
                />
              </div>

              <div className="form-group">
                <label htmlFor="carModel">Marque et modèle du véhicule</label>
                <input 
                  type="text" 
                  id="carModel" 
                  placeholder="Ex: Porsche 911, Audi RS3..." 
                  value={carModel} 
                  onChange={(e) => setCarModel(e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="details">
                  {selectedService?.title.includes('Peinture') ? 'Couleur souhaitée et précisions' : 'Détails de votre demande (Optionnel)'}
                </label>
                <textarea 
                  id="details" 
                  rows="2" 
                  placeholder={selectedService?.title.includes('Peinture') ? "Ex: Rouge Carmin brillant..." : "Précisez l'état actuel ou vos attentes spécifiques..."} 
                  value={details} 
                  onChange={(e) => setDetails(e.target.value)}
                ></textarea>
              </div>
              
              {bookingDate && (
                <div className="form-group">
                  <label>Créneau horaire</label>
                  <div className="time-slots-grid">
                    {TIME_SLOTS.map(time => {
                      // On vérifie si le créneau est déjà réservé
                      let isUnavailable = bookedSlots.includes(time);
                      return (
                        <button key={time} type="button" className={`time-slot-btn ${bookingTime === time ? 'selected' : ''} ${isUnavailable ? 'booked' : ''}`} disabled={isUnavailable} onClick={() => setBookingTime(time)}>
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="booking-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="btn-confirm" disabled={!bookingDate || !bookingTime}>Confirmer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {toastMessage && (
        <div className="toast-notification success">{toastMessage}</div>
      )}
    </div>
  );
}

function ServiceCard({ title, desc, img, color, price, onBook }) {
  return (
    <div className="service-card">
      <div className="card-content">
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
          <div className="pulse-dot" style={{ backgroundColor: color }}></div>
        </div>
        <p className="card-desc">{desc}</p>
        <span className="card-price">{price}</span>
        <div className="card-image-container">
          <img src={img} alt={title} className="card-image" />
          <div className="card-overlay"></div>
          <button 
            className="btn-book-service" 
            onClick={() => onBook({ title, desc, price })}
          >
            Prendre rendez-vous
          </button>
        </div>
      </div>
    </div>
  );
}

export default Accueil;