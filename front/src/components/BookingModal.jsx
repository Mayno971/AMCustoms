import React, { useState, useEffect } from 'react';

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

const BookingModal = ({ onClose, selectedService, onSuccess }) => {
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const year = tomorrowDate.getFullYear();
  const month = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrowDate.getDate()).padStart(2, '0');
  const tomorrow = `${year}-${month}-${day}`;

  const [bookingDate, setBookingDate] = useState(tomorrow);
  const [bookingTime, setBookingTime] = useState('');
  const [carModel, setCarModel] = useState('');
  const [details, setDetails] = useState('');
  const [bookedSlots, setBookedSlots] = useState([]);

  const [guestFirstname, setGuestFirstname] = useState('');
  const [guestLastname, setGuestLastname] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('am_customs_current_user'));
  const isGuest = !currentUser;

  useEffect(() => {
    if (!bookingDate) {
      setBookedSlots([]);
      return;
    }

    const fetchBookedSlots = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/api/appointments?date=${bookingDate}`);
        if (response.ok) {
          const data = await response.json();
          setBookedSlots(data.bookedTimes);
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
  }, [bookingDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime) return;

    if (bookingDate < tomorrow) {
      onSuccess({ message: "Les réservations se font uniquement à partir de demain.", type: 'error' });
      return;
    }

    const bookingRef = `AM-${Math.floor(10000 + Math.random() * 90000)}`;

    const newAppt = {
      id: Date.now(),
      ref: bookingRef,
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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAppt),
      });
      if (!response.ok) console.warn("Erreur lors de l'enregistrement sur le serveur.");
    } catch (error) {
      console.error("Serveur inaccessible, sauvegarde locale uniquement.", error);
    }

    if (!isGuest) {
      const updatedUser = { ...currentUser, appointments: [...(currentUser.appointments || []), newAppt] };
      localStorage.setItem('am_customs_current_user', JSON.stringify(updatedUser));
      const allUsers = JSON.parse(localStorage.getItem('am_customs_users')) || [];
      const updatedUsers = allUsers.map(u => u.email === updatedUser.email ? updatedUser : u);
      localStorage.setItem('am_customs_users', JSON.stringify(updatedUsers));
    } else {
      const guestAppts = JSON.parse(localStorage.getItem('am_customs_guest_appts')) || [];
      guestAppts.push(newAppt);
      localStorage.setItem('am_customs_guest_appts', JSON.stringify(guestAppts));
    }

    onClose();
    
    const successMsg = isGuest 
      ? `Réservation confirmée ! N° de suivi : ${bookingRef}. Un e-mail récapitulatif vous a été envoyé.` 
      : `Rendez-vous confirmé le ${bookingDate} à ${bookingTime}`;
      
    onSuccess({ message: successMsg, type: 'success', duration: isGuest ? 10000 : 5000 });
  };

  return (
    <div className="booking-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="booking-modal" onClick={e => e.stopPropagation()}>
        <div className="booking-modal-header">
          <h3 id="modal-title">Réserver : {selectedService?.title}</h3>
          <button className="btn-close-modal" aria-label="Fermer la fenêtre" onClick={onClose}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form className="booking-form" onSubmit={handleSubmit}>
          {isGuest && (
            <div className="guest-booking-fields">
              <p style={{fontSize: '0.875rem', color: 'var(--text-gray)', marginBottom: '1rem'}}>Vous réservez en tant qu'invité. Connectez-vous pour pré-remplir ces informations.</p>
              <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem'}}>
                <div className="form-group" style={{flex: 1}}><label>Prénom</label><input type="text" placeholder="Jean" value={guestFirstname} onChange={e => setGuestFirstname(e.target.value)} required /></div>
                <div className="form-group" style={{flex: 1}}><label>Nom</label><input type="text" placeholder="Dupont" value={guestLastname} onChange={e => setGuestLastname(e.target.value)} required /></div>
              </div>
              <div className="form-group" style={{marginBottom: '1.5rem'}}><label>E-mail</label><input type="email" placeholder="jean@exemple.com" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} required /></div>
              <div className="form-group" style={{marginBottom: '1.5rem'}}><label>Téléphone</label><input type="tel" placeholder="06 12 34 56 78" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} required /></div>
            </div>
          )}
          <div className="form-group"><label>Date souhaitée</label><input type="date" min={tomorrow} value={bookingDate} onChange={(e) => { setBookingDate(e.target.value); setBookingTime(''); }} required /></div>
          <div className="form-group"><label>Marque et modèle du véhicule</label><input type="text" placeholder="Ex: Porsche 911, Audi RS3..." value={carModel} onChange={(e) => setCarModel(e.target.value)} required /></div>
          <div className="form-group">
            <label>{selectedService?.title.includes('Peinture') ? 'Couleur souhaitée et précisions' : 'Détails de votre demande (Optionnel)'}</label>
            <textarea rows="2" placeholder={selectedService?.title.includes('Peinture') ? "Ex: Rouge Carmin brillant..." : "Précisez l'état actuel ou vos attentes spécifiques..."} value={details} onChange={(e) => setDetails(e.target.value)}></textarea>
          </div>
          {bookingDate && (
            <div className="form-group">
              <label>Créneau horaire</label>
              <div className="time-slots-grid">
                {TIME_SLOTS.map(time => {
                  let isUnavailable = bookedSlots.includes(time);
                  return <button key={time} type="button" className={`time-slot-btn ${bookingTime === time ? 'selected' : ''} ${isUnavailable ? 'booked' : ''}`} disabled={isUnavailable} onClick={() => setBookingTime(time)}>{time}</button>;
                })}
              </div>
            </div>
          )}
          <div className="booking-actions"><button type="button" className="btn-cancel" onClick={onClose}>Annuler</button><button type="submit" className="btn-confirm" disabled={!bookingDate || !bookingTime}>Confirmer</button></div>
        </form>
      </div>
    </div>
  );
};
export default BookingModal;