import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Profil.css';

function Profil() {
  const { nom } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    // On récupère l'utilisateur connecté depuis le localStorage
    const currentUser = JSON.parse(localStorage.getItem('am_customs_current_user'));
    
    // Si aucun utilisateur n'est connecté ou si le prénom de l'URL ne correspond pas au compte, on le renvoie à la connexion
    if (!currentUser || currentUser.firstname !== nom) {
      navigate('/login');
    } else {
      setUser(currentUser);
    }
  }, [navigate, nom]);

  const handleLogout = () => {
    // Simulation d'une déconnexion SSO Globale
    localStorage.removeItem('am_customs_current_user');
    sessionStorage.clear();
    
    // Redirection stricte vers le login
    navigate('/login');
  };

  const handleCancelAppt = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;

    // Appel au serveur pour annuler le rendez-vous
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      await fetch(`${API_URL}/api/appointments/${id}/cancel`, {
        method: 'PUT'
      });
    } catch (error) {
      console.warn("Serveur inaccessible, annulation locale uniquement.");
    }

    const updatedAppts = user.appointments.map(appt => 
      appt.id === id ? { ...appt, status: 'Annulé' } : appt
    );
    const updatedUser = { ...user, appointments: updatedAppts };

    // Mise à jour de la session actuelle
    localStorage.setItem('am_customs_current_user', JSON.stringify(updatedUser));
    
    // Mise à jour de la base de données globale
    const allUsers = JSON.parse(localStorage.getItem('am_customs_users')) || [];
    const updatedUsers = allUsers.map(u => u.email === updatedUser.email ? updatedUser : u);
    localStorage.setItem('am_customs_users', JSON.stringify(updatedUsers));

    setUser(updatedUser);
    setToastMessage('Le rendez-vous a été annulé avec succès.');
    setTimeout(() => setToastMessage(''), 5000);
  };

  const isCancellable = (dateString) => {
    const [datePart, timePart] = dateString.split(' à ');
    const apptDate = new Date(`${datePart}T${timePart}:00`);
    return (apptDate.getTime() - new Date().getTime()) > 24 * 60 * 60 * 1000;
  };

  if (!user) {
    return <div className="profil-loading">Chargement du profil...</div>;
  }

  // On récupère les rendez-vous réels stockés dans l'utilisateur
  const history = user.appointments || [];

  // On trie l'historique du plus récent (ou futur) au plus ancien
  const sortedHistory = [...history].sort((a, b) => {
    const dateA = new Date(a.date.replace(' à ', 'T') + ':00');
    const dateB = new Date(b.date.replace(' à ', 'T') + ':00');
    return dateB.getTime() - dateA.getTime();
  });

  // Statistiques du tableau de bord
  const upcomingCount = history.filter(h => h.status === 'En attente').length;
  const completedCount = history.filter(h => h.status === 'Terminé').length;

  // Logique de pagination
  const totalPages = Math.ceil(sortedHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = sortedHistory.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="profil-page">
      <div className="profil-container">
        
        <header className="profil-header">
          <div>
            <h1 className="profil-title">Bonjour, <span>{user.firstname}</span>.</h1>
            <p className="profil-subtitle">Bienvenue dans votre espace client personnel.</p>
          </div>
          <button onClick={handleLogout} className="btn-logout">Déconnexion</button>
        </header>

        <div className="profil-stats-row">
          <div className="stat-box">
            <span className="stat-number">{upcomingCount}</span>
            <span className="stat-label">Rendez-vous à venir</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{completedCount}</span>
            <span className="stat-label">Prestations terminées</span>
          </div>
        </div>

        <div className="profil-grid">
          
          {/* Carte : Informations Personnelles */}
          <section className="profil-card">
            <h2 className="card-heading">Informations Personnelles</h2>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Nom complet</span>
                <span className="info-value">{user.firstname} {user.lastname}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Adresse e-mail</span>
                <span className="info-value">{user.email}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Statut membre</span>
                <span className="info-value accent-text">Client VIP</span>
              </div>
            </div>
          </section>

          {/* Carte : Historique des Prestations */}
          <section className="profil-card lg-span-2">
            <h2 className="card-heading">Historique des Prestations</h2>
            <div className="history-list">
              {paginatedHistory.length > 0 ? (
                paginatedHistory.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-main">
                      <h3 className="history-action">{item.action}</h3>
                      <span className="history-date">{item.date}</span>
                    </div>
                    <div className="history-meta">
                      <span className="history-price">{item.price}</span>
                      <span className={`status-badge ${item.status === 'Annulé' ? 'status-cancelled' : item.status === 'En attente' || item.status === 'En cours' ? 'status-pending' : 'status-done'}`}>
                        {item.status}
                      </span>
                      
                      {item.status === 'En attente' && isCancellable(item.date) && (
                        <button className="btn-cancel-appt" onClick={() => handleCancelAppt(item.id)}>
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="empty-history">Vous n'avez aucune prestation réservée pour le moment.</p>
              )}
            </div>
            
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="btn-pagination"
                >Précédent</button>
                <span className="pagination-info">Page {currentPage} sur {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="btn-pagination"
                >Suivant</button>
              </div>
            )}
          </section>

        </div>
        
        {/* Notification Toast */}
        {toastMessage && (
          <div className="toast-notification success">{toastMessage}</div>
        )}
      </div>
    </div>
  );
}

export default Profil;