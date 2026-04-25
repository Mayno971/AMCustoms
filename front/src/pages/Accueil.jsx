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

  const [guestFirstname, setGuestFirstname] = useState('');
  const [guestLastname, setGuestLastname] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const year = tomorrowDate.getFullYear();
  const month = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrowDate.getDate()).padStart(2, '0');
  const tomorrow = `${year}-${month}-${day}`;
  
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
    
    // Sécurité supplémentaire : blocage si la date est antérieure à demain
    if (bookingDate < tomorrow) {
      setToastMessage("Les réservations se font uniquement à partir de demain.");
      setTimeout(() => setToastMessage(''), 5000);
      return;
    }

    const currentUser = JSON.parse(localStorage.getItem('am_customs_current_user'));
    const isGuest = !currentUser;
    const bookingRef = `AM-${Math.floor(10000 + Math.random() * 90000)}`; // Génération du numéro de suivi
    
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
      if (!response.ok) {
        console.warn("Erreur lors de l'enregistrement sur le serveur.");
      }
    } catch (error) {
      console.error("Serveur inaccessible, sauvegarde locale uniquement.", error);
    }
    
    if (!isGuest) {
      const updatedUser = { 
        ...currentUser, 
        appointments: [...(currentUser.appointments || []), newAppt] 
      };
      
      localStorage.setItem('am_customs_current_user', JSON.stringify(updatedUser));
      
      const allUsers = JSON.parse(localStorage.getItem('am_customs_users')) || [];
      const updatedUsers = allUsers.map(u => u.email === updatedUser.email ? updatedUser : u);
      localStorage.setItem('am_customs_users', JSON.stringify(updatedUsers));
    } else {
      // Sauvegarde de secours locale pour les invités
      const guestAppts = JSON.parse(localStorage.getItem('am_customs_guest_appts')) || [];
      guestAppts.push(newAppt);
      localStorage.setItem('am_customs_guest_appts', JSON.stringify(guestAppts));
    }

    setIsModalOpen(false);
    setBookingDate('');
    setBookingTime('');
    
    // Affichage de la notification de succès
    if (isGuest) {
      setToastMessage(`Réservation confirmée ! N° de suivi : ${bookingRef}. Un e-mail récapitulatif vous a été envoyé.`);
      setTimeout(() => setToastMessage(''), 10000); // On laisse 10s pour que l'invité note le code
    } else {
      setToastMessage(`Rendez-vous confirmé le ${bookingDate} à ${bookingTime}`);
      setTimeout(() => setToastMessage(''), 5000);
    }
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
            
            <div className="hero-contact-info">
              <div className="contact-address">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span>123 Avenue de l'Excellence, 75000 Paris</span>
              </div>
              <div className="social-links">
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon insta" aria-label="Instagram">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://snapchat.com" target="_blank" rel="noreferrer" className="social-icon snap" aria-label="Snapchat">
                  <svg width="20" height="20" viewBox="147.353 39.286 514.631 514.631" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#FFFC00" d="M147.553,423.021v0.023c0.308,11.424,0.403,22.914,2.33,34.268 c2.042,12.012,4.961,23.725,10.53,34.627c7.529,14.756,17.869,27.217,30.921,37.396c9.371,7.309,19.608,13.111,30.94,16.771 c16.524,5.33,33.571,7.373,50.867,7.473c10.791,0.068,21.575,0.338,32.37,0.293c78.395-0.33,156.792,0.566,235.189-0.484 c10.403-0.141,20.636-1.41,30.846-3.277c19.569-3.582,36.864-11.932,51.661-25.133c17.245-15.381,28.88-34.205,34.132-56.924 c3.437-14.85,4.297-29.916,4.444-45.035v-3.016c0-1.17-0.445-256.892-0.486-260.272c-0.115-9.285-0.799-18.5-2.54-27.636 c-2.117-11.133-5.108-21.981-10.439-32.053c-5.629-10.641-12.68-20.209-21.401-28.57c-13.359-12.81-28.775-21.869-46.722-26.661 c-16.21-4.327-32.747-5.285-49.405-5.27c-0.027-0.004-0.09-0.173-0.094-0.255H278.56c-0.005,0.086-0.008,0.172-0.014,0.255 c-9.454,0.173-18.922,0.102-28.328,1.268c-10.304,1.281-20.509,3.21-30.262,6.812c-15.362,5.682-28.709,14.532-40.11,26.347 c-12.917,13.386-22.022,28.867-26.853,46.894c-4.31,16.084-5.248,32.488-5.271,49.008"/>
                    <path fill="#FFFFFF" d="M407.001,473.488c-1.068,0-2.087-0.039-2.862-0.076c-0.615,0.053-1.25,0.076-1.886,0.076 c-22.437,0-37.439-10.607-50.678-19.973c-9.489-6.703-18.438-13.031-28.922-14.775c-5.149-0.854-10.271-1.287-15.22-1.287 c-8.917,0-15.964,1.383-21.109,2.389c-3.166,0.617-5.896,1.148-8.006,1.148c-2.21,0-4.895-0.49-6.014-4.311 c-0.887-3.014-1.523-5.934-2.137-8.746c-1.536-7.027-2.65-11.316-5.281-11.723c-28.141-4.342-44.768-10.738-48.08-18.484 c-0.347-0.814-0.541-1.633-0.584-2.443c-0.129-2.309,1.501-4.334,3.777-4.711c22.348-3.68,42.219-15.492,59.064-35.119 c13.049-15.195,19.457-29.713,20.145-31.316c0.03-0.072,0.065-0.148,0.101-0.217c3.247-6.588,3.893-12.281,1.926-16.916 c-3.626-8.551-15.635-12.361-23.58-14.882c-1.976-0.625-3.845-1.217-5.334-1.808c-7.043-2.782-18.626-8.66-17.083-16.773 c1.124-5.916,8.949-10.036,15.273-10.036c1.756,0,3.312,0.308,4.622,0.923c7.146,3.348,13.575,5.045,19.104,5.045 c6.876,0,10.197-2.618,11-3.362c-0.198-3.668-0.44-7.546-0.674-11.214c0-0.004-0.005-0.048-0.005-0.048 c-1.614-25.675-3.627-57.627,4.546-75.95c24.462-54.847,76.339-59.112,91.651-59.112c0.408,0,6.674-0.062,6.674-0.062 c0.283-0.005,0.59-0.009,0.908-0.009c15.354,0,67.339,4.27,91.816,59.15c8.173,18.335,6.158,50.314,4.539,76.016l-0.076,1.23 c-0.222,3.49-0.427,6.793-0.6,9.995c0.756,0.696,3.795,3.096,9.978,3.339c5.271-0.202,11.328-1.891,17.998-5.014 c2.062-0.968,4.345-1.169,5.895-1.169c2.343,0,4.727,0.456,6.714,1.285l0.106,0.041c5.66,2.009,9.367,6.024,9.447,10.242 c0.071,3.932-2.851,9.809-17.223,15.485c-1.472,0.583-3.35,1.179-5.334,1.808c-7.952,2.524-19.951,6.332-23.577,14.878 c-1.97,4.635-1.322,10.326,1.926,16.912c0.036,0.072,0.067,0.145,0.102,0.221c1,2.344,25.205,57.535,79.209,66.432 c2.275,0.379,3.908,2.406,3.778,4.711c-0.048,0.828-0.248,1.656-0.598,2.465c-3.289,7.703-19.915,14.09-48.064,18.438 c-2.642,0.408-3.755,4.678-5.277,11.668c-0.63,2.887-1.271,5.717-2.146,8.691c-0.819,2.797-2.641,4.164-5.567,4.164h-0.441 c-1.905,0-4.604-0.346-8.008-1.012c-5.95-1.158-12.623-2.236-21.109-2.236c-4.948,0-10.069,0.434-15.224,1.287 c-10.473,1.744-19.421,8.062-28.893,14.758C444.443,462.88,429.436,473.488,407.001,473.488"/>
                    <path fill="#020202" d="M408.336,124.235c14.455,0,64.231,3.883,87.688,56.472c7.724,17.317,5.744,48.686,4.156,73.885 c-0.248,3.999-0.494,7.875-0.694,11.576l-0.084,1.591l1.062,1.185c0.429,0.476,4.444,4.672,13.374,5.017l0.144,0.008l0.15-0.003 c5.904-0.225,12.554-2.059,19.776-5.442c1.064-0.498,2.48-0.741,3.978-0.741c1.707,0,3.521,0.321,5.017,0.951l0.226,0.09 c3.787,1.327,6.464,3.829,6.505,6.093c0.022,1.28-0.935,5.891-14.359,11.194c-1.312,0.518-3.039,1.069-5.041,1.7 c-8.736,2.774-21.934,6.96-26.376,17.427c-2.501,5.896-1.816,12.854,2.034,20.678c1.584,3.697,26.52,59.865,82.631,69.111 c-0.011,0.266-0.079,0.557-0.229,0.9c-0.951,2.24-6.996,9.979-44.612,15.783c-5.886,0.902-7.328,7.5-9,15.17 c-0.604,2.746-1.218,5.518-2.062,8.381c-0.258,0.865-0.306,0.914-1.233,0.914c-0.128,0-0.278,0-0.442,0 c-1.668,0-4.2-0.346-7.135-0.922c-5.345-1.041-12.647-2.318-21.982-2.318c-5.21,0-10.577,0.453-15.962,1.352 c-11.511,1.914-20.872,8.535-30.786,15.543c-13.314,9.408-27.075,19.143-48.071,19.143c-0.917,0-1.812-0.031-2.709-0.076 l-0.236-0.01l-0.237,0.018c-0.515,0.045-1.034,0.068-1.564,0.068c-20.993,0-34.76-9.732-48.068-19.143 c-9.916-7.008-19.282-13.629-30.791-15.543c-5.38-0.896-10.752-1.352-15.959-1.352c-9.333,0-16.644,1.428-21.978,2.471 c-2.935,0.574-5.476,1.066-7.139,1.066c-1.362,0-1.388-0.08-1.676-1.064c-0.844-2.865-1.461-5.703-2.062-8.445 c-1.676-7.678-3.119-14.312-9.002-15.215c-37.613-5.809-43.659-13.561-44.613-15.795c-0.149-0.352-0.216-0.652-0.231-0.918 c56.11-9.238,81.041-65.408,82.63-69.119c3.857-7.818,4.541-14.775,2.032-20.678c-4.442-10.461-17.638-14.653-26.368-17.422 c-2.007-0.635-3.735-1.187-5.048-1.705c-11.336-4.479-14.823-8.991-14.305-11.725c0.601-3.153,6.067-6.359,10.837-6.359 c1.072,0,2.012,0.173,2.707,0.498c7.747,3.631,14.819,5.472,21.022,5.472c9.751,0,14.091-4.537,14.557-5.055l1.057-1.182 l-0.085-1.583c-0.197-3.699-0.44-7.574-0.696-11.565c-1.583-25.205-3.563-56.553,4.158-73.871 c23.37-52.396,72.903-56.435,87.525-56.435c0.36,0,6.717-0.065,6.717-0.065C407.744,124.239,408.033,124.235,408.336,124.235 M408.336,115.197h-0.017c-0.333,0-0.646,0-0.944,0.004c-2.376,0.024-6.282,0.062-6.633,0.066c-8.566,0-25.705,1.21-44.115,9.336 c-10.526,4.643-19.994,10.921-28.14,18.66c-9.712,9.221-17.624,20.59-23.512,33.796c-8.623,19.336-6.576,51.905-4.932,78.078 l0.006,0.041c0.176,2.803,0.361,5.73,0.53,8.582c-1.265,0.581-3.316,1.194-6.339,1.194c-4.864,0-10.648-1.555-17.187-4.619 c-1.924-0.896-4.12-1.349-6.543-1.349c-3.893,0-7.997,1.146-11.557,3.239c-4.479,2.63-7.373,6.347-8.159,10.468 c-0.518,2.726-0.493,8.114,5.492,13.578c3.292,3.008,8.128,5.782,14.37,8.249c1.638,0.645,3.582,1.261,5.641,1.914 c7.145,2.271,17.959,5.702,20.779,12.339c1.429,3.365,0.814,7.793-1.823,13.145c-0.069,0.146-0.138,0.289-0.201,0.439 c-0.659,1.539-6.807,15.465-19.418,30.152c-7.166,8.352-15.059,15.332-23.447,20.752c-10.238,6.617-21.316,10.943-32.923,12.855 c-4.558,0.748-7.813,4.809-7.559,9.424c0.078,1.33,0.39,2.656,0.931,3.939c0.004,0.008,0.009,0.016,0.013,0.023 c1.843,4.311,6.116,7.973,13.063,11.203c8.489,3.943,21.185,7.26,37.732,9.855c0.836,1.59,1.704,5.586,2.305,8.322 c0.629,2.908,1.285,5.898,2.22,9.074c1.009,3.441,3.626,7.553,10.349,7.553c2.548,0,5.478-0.574,8.871-1.232 c4.969-0.975,11.764-2.305,20.245-2.305c4.702,0,9.575,0.414,14.48,1.229c9.455,1.574,17.606,7.332,27.037,14 c13.804,9.758,29.429,20.803,53.302,20.803c0.651,0,1.304-0.021,1.949-0.066c0.789,0.037,1.767,0.066,2.799,0.066 c23.88,0,39.501-11.049,53.29-20.799l0.022-0.02c9.433-6.66,17.575-12.41,27.027-13.984c4.903-0.814,9.775-1.229,14.479-1.229 c8.102,0,14.517,1.033,20.245,2.15c3.738,0.736,6.643,1.09,8.872,1.09l0.218,0.004h0.226c4.917,0,8.53-2.699,9.909-7.422 c0.916-3.109,1.57-6.029,2.215-8.986c0.562-2.564,1.46-6.674,2.296-8.281c16.558-2.6,29.249-5.91,37.739-9.852 c6.931-3.215,11.199-6.873,13.053-11.166c0.556-1.287,0.881-2.621,0.954-3.979c0.261-4.607-2.999-8.676-7.56-9.424 c-51.585-8.502-74.824-61.506-75.785-63.758c-0.062-0.148-0.132-0.295-0.205-0.438c-2.637-5.354-3.246-9.777-1.816-13.148 c2.814-6.631,13.621-10.062,20.771-12.332c2.07-0.652,4.021-1.272,5.646-1.914c7.039-2.78,12.07-5.796,15.389-9.221 c3.964-4.083,4.736-7.995,4.688-10.555c-0.121-6.194-4.856-11.698-12.388-14.393c-2.544-1.052-5.445-1.607-8.399-1.607 c-2.011,0-4.989,0.276-7.808,1.592c-6.035,2.824-11.441,4.368-16.082,4.588c-2.468-0.125-4.199-0.66-5.32-1.171 c0.141-2.416,0.297-4.898,0.458-7.486l0.067-1.108c1.653-26.19,3.707-58.784-4.92-78.134c-5.913-13.253-13.853-24.651-23.604-33.892 c-8.178-7.744-17.678-14.021-28.242-18.661C434.052,116.402,416.914,115.197,408.336,115.197"/>
                  </svg>
                </a>
              </div>
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
              icon={<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>}
              onBook={handleBookClick}
            />
            {/* Service: Phares */}
            <ServiceCard 
              title="Rénovation Phares"
              desc="Restauration de la clarté et de la brillance de vos phares ternis ou jaunis par le temps."
              img="https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&q=60&w=500"
              color="#FACC15"
              price="À partir de 50 €"
              icon={<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
              onBook={handleBookClick}
            />
            {/* Service: Jantes & Étriers */}
            <ServiceCard 
              title="Peintures Jantes & Étriers"
              desc="Personnalisation et protection haute résistance pour vos jantes et étriers de frein."
              img="https://images.unsplash.com/photo-1551522435-a13afa10f103?auto=format&fit=crop&q=60&w=500"
              color="#FF4D00"
              price="À partir de 250 €"
              icon={<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>}
              onBook={handleBookClick}
            />
            {/* Service: Shampooing */}
            <ServiceCard 
              title="Shampooing Sièges & Moquettes"
              desc="Nettoyage en profondeur par extraction pour sièges, moquettes et même canapés."
              img="https://images.unsplash.com/photo-1605276374104-162f15cebcd1?auto=format&fit=crop&q=60&w=500"
              color="#A855F7"
              price="À partir de 80 €"
              icon={<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"></path></svg>}
              onBook={handleBookClick}
            />
            {/* Service: Haute Pression */}
            <ServiceCard 
              title="Nettoyage Haute Pression"
              desc="Décrassage intensif de la carrosserie et des soubassements au nettoyeur haute pression."
              img="https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=60&w=500"
              color="#3B82F6"
              price="À partir de 40 €"
              icon={<svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>}
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

function ServiceCard({ title, desc, img, color, price, icon, onBook }) {
  return (
    <div className="service-card">
      <div className="card-content">
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-icon" style={{ color: color }}>{icon}</div>
            <h3 className="card-title">{title}</h3>
          </div>
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