import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  
  // État pour le "calendrier" : date sélectionnée (Aujourd'hui par défaut)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Nouveaux états pour la navigation et la recherche
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('day'); // 'day' ou 'week'
  const [selectedApptDetails, setSelectedApptDetails] = useState(null); // État pour la modale de détails
  
  const [showStartForm, setShowStartForm] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState('');
  
  // Pagination pour les clients
  const [usersCurrentPage, setUsersCurrentPage] = useState(1);
  const USERS_PER_PAGE = 8;

  useEffect(() => {
    // Sécurité : on vérifie que c'est bien l'admin qui est connecté
    const currentUser = JSON.parse(localStorage.getItem('am_customs_current_user'));
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/'); // Retour à l'accueil si non autorisé
      return;
    }

    fetchAdminData();
  }, [navigate]);

  // Système d'alertes automatiques (Rappels)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      appointments.forEach(appt => {
        if (appt.status === 'En attente') {
          const [datePart, timePart] = appt.date.split(' à ');
          const apptDate = new Date(`${datePart}T${timePart}:00`);
          
          const diffMs = apptDate.getTime() - now.getTime();
          const diffMins = Math.floor(diffMs / 60000); // Conversion en minutes

          // Déclenchement des alertes
          if (diffMins === 60) {
            alert(`RAPPEL IMMINENT : Le client ${appt.clientName} arrive dans 1 heure !`);
          } else if (diffMins === 15) {
            alert(`ALERTE : Le rendez-vous de ${appt.clientName} commence dans 15 minutes. Préparez l'atelier.`);
          }
        }
      });
    }, 60000); // Vérification toutes les minutes
    return () => clearInterval(interval);
  }, [appointments]);

  const fetchAdminData = async () => {
    try {
      // Appels REST à notre nouvelle API Admin
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const resUsers = await fetch(`${API_URL}/api/admin/users`);
      const resAppts = await fetch(`${API_URL}/api/admin/appointments`);
      
      if (resUsers.ok && resAppts.ok) {
        const dataUsers = await resUsers.json();
        const dataAppts = await resAppts.json();
        
        setUsers(dataUsers.users);
        setAppointments(dataAppts.appointments);
        return;
      }
    } catch (error) {
      console.warn("Serveur injoignable, utilisation des données locales.");
    }

    // Fallback local si le serveur est coupé
    const localUsers = JSON.parse(localStorage.getItem('am_customs_users')) || [];
    let localAppts = [];
    localUsers.forEach(u => {
      if (u.appointments) localAppts = [...localAppts, ...u.appointments];
    });
    
    setUsers(localUsers);
    setAppointments(localAppts);
  };

  const handleLogout = () => {
    localStorage.removeItem('am_customs_current_user');
    navigate('/');
  };

  // Permet à l'admin de changer l'état d'un RDV
  const handleStatusChange = async (id, newStatus, startTime = null, endTime = null) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/api/admin/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, startTime, endTime })
      });
      if (!response.ok) throw new Error('Erreur serveur');
    } catch (error) {
      console.warn("Serveur injoignable, mise à jour locale uniquement.");
    }

    // Mise à jour de l'affichage local
    const updatedAppts = appointments.map(appt => 
      appt.id === id ? { ...appt, status: newStatus, ...(startTime && {startTime}), ...(endTime && {endTime}) } : appt
    );
    setAppointments(updatedAppts);

    // Mise à jour du fallback (localStorage)
    const localUsers = JSON.parse(localStorage.getItem('am_customs_users')) || [];
    const updatedUsers = localUsers.map(u => {
      if (u.appointments) {
        u.appointments = u.appointments.map(a => a.id === id ? { ...a, status: newStatus, ...(startTime && {startTime}), ...(endTime && {endTime}) } : a);
      }
      return u;
    });
    localStorage.setItem('am_customs_users', JSON.stringify(updatedUsers));
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'En attente': return 'status-pending';
      case 'En cours': return 'status-progress';
      case 'Terminé': return 'status-done';
      case 'Annulé': return 'status-cancelled';
      default: return 'status-done';
    }
  };

  // Démarrer la prestation
  const confirmStartService = async (appt) => {
    if (!startTimeInput) return alert("Veuillez saisir l'heure de début.");
    await handleStatusChange(appt.id, 'En cours', startTimeInput, null);
    
    setShowStartForm(false);
    setStartTimeInput('');
    setSelectedApptDetails({...appt, status: 'En cours', startTime: startTimeInput});
  };

  // Terminer la prestation
  const confirmEndService = async (appt) => {
    const endTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ':');
    if(!window.confirm(`Confirmer la fin de la prestation pour ${appt.clientName} à ${endTime} ?`)) return;
    
    await handleStatusChange(appt.id, 'Terminé', appt.startTime, endTime);
    setSelectedApptDetails({...appt, status: 'Terminé', endTime: endTime});
    
    // On bascule automatiquement sur l'onglet facture
    setActiveTab('invoices');
  };

  // Filtrer les rendez-vous pour la date sélectionnée (Le Calendrier)
  const appointmentsForDate = appointments.filter(appt => appt.date.startsWith(selectedDate));

  // Trouver le prochain rendez-vous à venir (Futur)
  const now = new Date();
  const upcomingAppts = appointments.filter(a => {
    if (a.status !== 'En attente' && a.status !== 'En cours') return false;
    const [datePart, timePart] = a.date.split(' à ');
    const apptDate = new Date(`${datePart}T${timePart}:00`);
    return apptDate > now;
  }).sort((a, b) => {
    const dateA = new Date(a.date.replace(' à ', 'T') + ':00');
    const dateB = new Date(b.date.replace(' à ', 'T') + ':00');
    return dateA - dateB;
  });
  const nextAppointment = upcomingAppts.length > 0 ? upcomingAppts[0] : null;

  // Statistiques globales
  const totalClients = users.filter(u => u.role !== 'admin').length;
  const pendingAppts = appointments.filter(a => a.status === 'En attente').length;
  const completedAppts = appointments.filter(a => a.status === 'Terminé').length;
  
  // Calcul du chiffre d'affaires estimé (Extraction des chiffres du prix "À partir de XX €")
  const totalRevenue = appointments.filter(a => a.status === 'Terminé').reduce((sum, a) => {
    if (!a.price) return sum;
    const match = String(a.price).match(/\d+/);
    return sum + (match ? parseInt(match[0], 10) : 0);
  }, 0);

  // Filtrage des utilisateurs pour la recherche
  const filteredUsers = users.filter(u => 
    u.role !== 'admin' && 
    (u.firstname.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.lastname.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Pagination logique pour les clients
  const totalUserPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((usersCurrentPage - 1) * USERS_PER_PAGE, usersCurrentPage * USERS_PER_PAGE);

  // Simulation de la gestion documentaire
  const handleDocument = (type, appt) => {
    alert(`${type} pour ${appt.clientName} (Prestation n°${appt.id}) traité avec succès !`);
  };

  // --- Logique de navigation du Calendrier ---
  const adjustDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handlePrevPeriod = () => adjustDate(viewMode === 'week' ? -7 : -1);
  const handleNextPeriod = () => adjustDate(viewMode === 'week' ? 7 : 1);

  const getWeekDates = (baseDateStr) => {
    const baseDate = new Date(baseDateStr);
    const day = baseDate.getDay(); 
    const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1); // Ajuste pour que Lundi soit le 1er jour
    const monday = new Date(baseDate);
    monday.setDate(diff);
    
    const weekDates = [];
    for(let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      weekDates.push(`${year}-${month}-${dayStr}`);
    }
    return weekDates;
  };

  const formatDateFr = (dateStr) => {
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return new Date(dateStr).toLocaleDateString('fr-FR', options);
  };

  const renderAppointmentsList = (apptsList, emptyMessage) => (
    <ul className="appointments-list" aria-live="polite">
      {apptsList.length > 0 ? (
        apptsList.map(appt => {
          const time = appt.date.split(' à ')[1];
          return (
            <li key={appt.id} className="appt-item" onClick={() => setSelectedApptDetails(appt)}>
              <div className="appt-time">{time}</div>
              <div className="appt-details">
                <div className="appt-client">
                  {appt.clientName} {appt.phone && <span style={{color: 'var(--text-gray)'}}>({appt.phone})</span>} <span className="appt-car">- {appt.carModel}</span>
                </div>
                <div className="appt-action">{appt.action}</div>
                {appt.details && (
                  <div className="appt-extra-details">"{appt.details}"</div>
                )}
              </div>
              {/* e.stopPropagation() empêche d'ouvrir la modale si on clique juste sur le sélecteur de statut */}
              <div className={`appt-status ${getStatusClass(appt.status)}`} onClick={(e) => e.stopPropagation()}>
                <select 
                  value={appt.status} 
                  aria-label={`Modifier le statut de la réservation pour ${appt.clientName}`}
                  onChange={(e) => handleStatusChange(appt.id, e.target.value)}
                  className="status-select"
                >
                  <option value="En attente">En attente</option>
                  <option value="En cours">En cours</option>
                  <option value="Terminé">Terminé</option>
                  <option value="Annulé">Annulé</option>
                </select>
              </div>
            </li>
          );
        })
      ) : (
        <p className="empty-state">{emptyMessage}</p>
      )}
    </ul>
  );

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <h1 className="admin-title">Espace Prestataire</h1>
            <p className="admin-subtitle">Gérez votre activité d'une main de maître.</p>
          </div>
          <button onClick={handleLogout} className="btn-logout">Déconnexion</button>
        </header>

        {/* Navigation par onglets */}
        <nav className="admin-tabs">
          <button className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
            Vue d'ensemble
          </button>
          <button className={`admin-tab-btn ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            Réservations
          </button>
          <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            Base Clients
          </button>
          <button className={`admin-tab-btn ${activeTab === 'invoices' ? 'active' : ''}`} onClick={() => setActiveTab('invoices')}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            Facturation
          </button>
        </nav>

        {/* ONGLET 1 : VUE D'ENSEMBLE */}
        {activeTab === 'overview' && (
          <div className="tab-content fade-in">
            
            {/* CARTE : PROCHAIN RENDEZ-VOUS */}
            {nextAppointment && (
              <div className="next-appt-hero">
                <div className="next-appt-info">
                  <span className="next-appt-badge">Prochain rendez-vous</span>
                  <h3 className="next-appt-client">{nextAppointment.clientName}</h3>
                  <p className="next-appt-service">{nextAppointment.action} — <span style={{color: 'var(--text-main)'}}>{nextAppointment.carModel}</span></p>
                  <div className="next-appt-time">
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {nextAppointment.date}
                  </div>
                </div>
                <div className="next-appt-actions">
                  <button className="btn-jump-calendar" onClick={() => {
                    setSelectedDate(nextAppointment.date.split(' à ')[0]);
                    setActiveTab('appointments');
                    setViewMode('day');
                  }}>
                    Voir dans le calendrier
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </button>
                </div>
              </div>
            )}

            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-card-value">{pendingAppts}</span>
                <span className="stat-card-label">RDV en attente</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-value">{completedAppts}</span>
                <span className="stat-card-label">Prestations terminées</span>
              </div>
              <div className="stat-card">
                <span className="stat-card-value">{totalClients}</span>
                <span className="stat-card-label">Clients inscrits</span>
              </div>
              <div className="stat-card revenue-card">
                <span className="stat-card-value">{totalRevenue} €</span>
                <span className="stat-card-label">Chiffre d'affaires estimé</span>
              </div>
            </div>
            
            <div className="admin-grid">
              <section className="admin-card">
                <h2 className="card-heading">Planning du jour</h2>
                {renderAppointmentsList(
                  appointments.filter(appt => appt.date.startsWith(new Date().toISOString().split('T')[0])), 
                  "Aucune prestation prévue pour aujourd'hui."
                )}
              </section>
              <section className="admin-card">
                <h2 className="card-heading">Derniers inscrits</h2>
                <div className="users-list">
                  {filteredUsers.slice(-4).reverse().map((u, idx) => (
                    <div key={idx} className="user-item">
                      <div className="user-avatar">{u.firstname.charAt(0)}{u.lastname.charAt(0)}</div>
                      <div className="user-info">
                        <div className="user-name">{u.firstname} {u.lastname}</div>
                        <div className="user-email">{u.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {/* ONGLET 2 : RÉSERVATIONS */}
        {activeTab === 'appointments' && (
          <div className="tab-content fade-in">
            <section className="admin-card">
              <div className="card-header-flex">
                <h2 className="card-heading">Gestion du Calendrier</h2>
                
                <div className="calendar-toolbar">
                  <div className="view-toggles">
                    <button className={`view-btn ${viewMode === 'day' ? 'active' : ''}`} onClick={() => setViewMode('day')}>Jour</button>
                    <button className={`view-btn ${viewMode === 'week' ? 'active' : ''}`} onClick={() => setViewMode('week')}>Semaine</button>
                  </div>
                  
                  <div className="date-navigation">
                    <button className="nav-arrow" onClick={handlePrevPeriod} aria-label="Précédent">
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <label htmlFor="admin-date" className="sr-only">Sélectionner une date</label>
                    <input 
                      id="admin-date"
                      type="date" 
                      className="admin-date-picker" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)} 
                    />
                    <button className="nav-arrow" onClick={handleNextPeriod} aria-label="Suivant">
                      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === 'day' ? (
                renderAppointmentsList(appointmentsForDate, "Aucune prestation prévue à cette date.")
              ) : (
                <div className="week-view-list">
                  {getWeekDates(selectedDate).map(dateStr => {
                    const dayAppts = appointments.filter(appt => appt.date.startsWith(dateStr));
                    return (
                      <div key={dateStr} className="week-day-group">
                        <div className="week-day-header">
                          <span className="week-day-name">{formatDateFr(dateStr)}</span>
                          <span className="week-day-count">{dayAppts.length} RDV</span>
                        </div>
                        {renderAppointmentsList(dayAppts, "Aucune prestation aujourd'hui")}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ONGLET 3 : CLIENTS */}
        {activeTab === 'users' && (
          <div className="tab-content fade-in">
            <section className="admin-card">
              <div className="card-header-flex">
                <h2 className="card-heading">Base de Données Clients</h2>
                <input 
                  type="text" 
                  className="admin-search-input" 
                  placeholder="Rechercher par nom, email..." 
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setUsersCurrentPage(1); }}
                />
              </div>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Contact</th>
                      <th>Réservations</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length > 0 ? (
                      paginatedUsers.map((u, idx) => (
                        <tr key={idx}>
                          <td>
                            <div className="table-client-info">
                              <div className="user-avatar">{u.firstname.charAt(0)}{u.lastname.charAt(0)}</div>
                              <span className="user-name">{u.firstname} {u.lastname}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{display: 'flex', flexDirection: 'column'}}>
                              <span className="user-email">{u.email}</span>
                              <span style={{fontSize: '0.75rem', color: 'var(--text-gray)'}}>{u.phone || 'Non renseigné'}</span>
                            </div>
                          </td>
                          <td>
                            <span className="stat-badge">{u.appointmentsCount || 0} RDV</span>
                          </td>
                          <td>
                            <span className="badge-active">Actif</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="empty-state" style={{textAlign: 'center', padding: '3rem'}}>
                          Aucun client trouvé pour {searchQuery}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {totalUserPages > 1 && (
                  <div className="pagination-controls">
                    <button 
                      disabled={usersCurrentPage === 1} 
                      onClick={() => setUsersCurrentPage(prev => prev - 1)}
                      className="btn-pagination"
                    >Précédent</button>
                    <span className="pagination-info">Page {usersCurrentPage} sur {totalUserPages}</span>
                    <button 
                      disabled={usersCurrentPage === totalUserPages} 
                      onClick={() => setUsersCurrentPage(prev => prev + 1)}
                      className="btn-pagination"
                    >Suivant</button>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {/* ONGLET 4 : FACTURATION */}
        {activeTab === 'invoices' && (
          <div className="tab-content fade-in">
            <section className="admin-card">
              <div className="card-header-flex">
                <h2 className="card-heading">Contrats & Facturation</h2>
                <p style={{color: 'var(--text-gray)', fontSize: '0.875rem'}}>Éditez et gérez les documents contractuels de vos clients.</p>
              </div>
              
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>N° Facture</th>
                      <th>Date d'édition</th>
                      <th>Client & Prestation</th>
                      <th>Montant</th>
                      <th>Gestion Documentaire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.filter(a => a.status === 'Terminé').reverse().map((appt, idx) => (
                      <tr key={idx}>
                        <td><span style={{fontWeight: '700', color: 'var(--primary-cyan)'}}>FAC-{appt.id.toString().slice(-6)}</span></td>
                        <td>{appt.date.split(' à ')[0]}</td>
                        <td>
                          <div style={{display: 'flex', flexDirection: 'column'}}>
                            <span style={{fontWeight: '700', color: 'var(--text-main)'}}>{appt.clientName}</span>
                            <span style={{fontSize: '0.75rem', color: 'var(--text-gray)'}}>{appt.action}</span>
                          </div>
                        </td>
                        <td><span style={{fontWeight: '700'}}>{appt.price}</span></td>
                        <td>
                          <div className="doc-actions">
                            <button onClick={() => handleDocument('Devis généré', appt)} className="btn-doc export" title="Générer Devis">
                              Devis
                            </button>
                            <button onClick={() => handleDocument('Contrat généré', appt)} className="btn-doc export" title="Générer Contrat">
                              Contrat
                            </button>
                            <button onClick={() => handleDocument('Facture générée', appt)} className="btn-doc export-main" title="Générer Facture">
                              Facture
                            </button>
                            <button onClick={() => handleDocument('Document importé', appt)} className="btn-doc import" title="Importer un document signé">
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* MODALE DE DÉTAILS DU RENDEZ-VOUS */}
      {selectedApptDetails && (
        <div className="appt-modal-overlay" onClick={() => { setSelectedApptDetails(null); setShowStartForm(false); }}>
          <div className="appt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="appt-modal-header">
              <h3>Détails de la prestation</h3>
              <button className="btn-close-modal" aria-label="Fermer" onClick={() => { setSelectedApptDetails(null); setShowStartForm(false); }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="appt-modal-content">
              <div className="detail-group">
                <label>Client</label>
                <span>{selectedApptDetails.clientName}</span>
              </div>
              <div className="detail-group">
                <label>Contact</label>
                <span>{selectedApptDetails.email} {selectedApptDetails.phone ? ` • ${selectedApptDetails.phone}` : ''}</span>
              </div>
              <div className="detail-group">
                <label>Véhicule</label>
                <span style={{color: 'var(--primary-orange)'}}>{selectedApptDetails.carModel}</span>
              </div>
              <div className="detail-group">
                <label>Date et Heure</label>
                <span>{selectedApptDetails.date}</span>
              </div>
              <div className="detail-group">
                <label>Service sélectionné</label>
                <span>{selectedApptDetails.action} ({selectedApptDetails.price || 'Sur devis'})</span>
              </div>
              <div className="detail-group">
                <label>Statut actuel</label>
                <span className="appt-modal-badge">{selectedApptDetails.status}</span>
              </div>
              {selectedApptDetails.details && (
                <div className="detail-group full-width">
                  <label>Précisions / Attentes du client</label>
                  <p className="detail-notes">"{selectedApptDetails.details}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;