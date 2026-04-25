const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Indispensable pour autoriser le front (ex: localhost:5173) à communiquer avec localhost:3000
app.use(express.json()); // Permet de lire le corps des requêtes POST en JSON

// --- Base de données en mémoire ---
// (À remplacer par MongoDB, PostgreSQL, etc. pour une vraie mise en production)
let users = [
  {
    firstname: 'Admin',
    lastname: 'Prestataire',
    email: 'admin@amcustoms.fr',
    password: 'admin', 
    role: 'admin',
    appointments: []
  }
];
let appointments = [];

// ==========================================
// ROUTES: RENDEZ-VOUS (APPOINTMENTS)
// ==========================================

// 1. Obtenir les créneaux déjà réservés pour une date
// (Appelé par Accueil.jsx : GET http://localhost:3000/api/appointments?date=YYYY-MM-DD)
app.get('/api/appointments', (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Le paramètre date est requis.' });
  }

  // Filtre les RDV correspondant à la date demandée et n'étant pas annulés
  const bookedTimes = appointments
    .filter(appt => appt.date.startsWith(date) && appt.status !== 'Annulé')
    .map(appt => {
      // "2024-10-25 à 14:00" -> on isole "14:00"
      const parts = appt.date.split(' à ');
      return parts.length === 2 ? parts[1] : null;
    })
    .filter(Boolean); // Retire les valeurs nulles si le split échoue

  // On renvoie un objet avec un tableau de chaînes de caractères (ex: { bookedTimes: ['09:00', '14:00'] })
  res.json({ bookedTimes });
});

// 2. Prendre un nouveau rendez-vous
// (Appelé par Accueil.jsx : POST http://localhost:3000/api/appointments)
app.post('/api/appointments', (req, res) => {
  const newAppt = req.body;

  if (!newAppt || !newAppt.date || !newAppt.clientName) {
    return res.status(400).json({ error: 'Données manquantes ou invalides.' });
  }

  // Ajout du rendez-vous à la base de données globale
  appointments.push(newAppt);

  // Ajout au profil de l'utilisateur (s'il existe en mémoire côté serveur)
  const user = users.find(u => u.email === newAppt.userId);
  if (user) {
    user.appointments.push(newAppt);
  }

  res.status(201).json({ 
    message: 'Rendez-vous confirmé et enregistré sur le serveur.', 
    appointment: newAppt 
  });
});

// 2b. Suivre une réservation (Invités / Clients)
app.get('/api/appointments/track', (req, res) => {
  const { email, ref } = req.query;
  if (!email || !ref) {
    return res.status(400).json({ error: 'Email et numéro de suivi requis.' });
  }
  
  const appointment = appointments.find(a => a.email === email && a.ref === ref);
  if (!appointment) {
    return res.status(404).json({ error: 'Aucune réservation trouvée avec ces identifiants.' });
  }
  res.json({ appointment });
});

// 3. Annuler un rendez-vous
app.put('/api/appointments/:id/cancel', (req, res) => {
  const apptId = parseInt(req.params.id, 10);
  const appointment = appointments.find(a => a.id === apptId);
  
  if (!appointment) {
    return res.status(404).json({ error: 'Rendez-vous introuvable.' });
  }

  appointment.status = 'Annulé';

  // Mettre à jour aussi dans l'utilisateur lié
  const user = users.find(u => u.email === appointment.userId);
  if (user) {
    const userAppt = user.appointments.find(a => a.id === apptId);
    if (userAppt) userAppt.status = 'Annulé';
  }

  res.json({ message: 'Le rendez-vous a été annulé.', appointment });
});

// ==========================================
// ROUTES: UTILISATEURS (AUTH)
// ==========================================

// 4. Inscription (Register)
app.post('/api/auth/register', (req, res) => {
  const { firstname, lastname, email, password, phone, address } = req.body;

  if (!firstname || !lastname || !email || !password || !phone) {
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis.' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Cet e-mail est déjà utilisé.' });
  }

  const newUser = { firstname, lastname, email, password, phone, address, role: 'client', appointments: [] };
  users.push(newUser);
  res.status(201).json({ message: 'Utilisateur créé avec succès.', user: newUser });
});

// 5. Connexion (Login)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Identifiants incorrects.' });
  }

  // Génération d'un code A2F à 6 chiffres
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  user.twoFactorCode = code;

  // Simulation de l'envoi du code (SMS/Email)
  console.log(`\n🔐 [SÉCURITÉ A2F] Code de connexion pour ${email} : ${code}\n`);

  res.json({ message: 'Veuillez saisir le code A2F.', requires2FA: true, email: user.email });
});

// 5b. Vérification du code A2F (Double Facteur)
app.post('/api/auth/verify-2fa', (req, res) => {
  const { email, code } = req.body;
  const user = users.find(u => u.email === email);

  if (!user || user.twoFactorCode !== code) {
    return res.status(401).json({ error: 'Code de vérification incorrect ou expiré.' });
  }

  // Nettoyage du code une fois utilisé pour éviter la réutilisation
  user.twoFactorCode = null;
  res.json({ message: 'Connexion sécurisée réussie.', user });
});

// 6. Réinitialisation du mot de passe (Forgot Password)
app.post('/api/auth/reset-password', (req, res) => {
  const { email, phone, newPassword } = req.body;
  
  const user = users.find(u => u.email === email && u.phone === phone);
  
  if (!user) {
    return res.status(404).json({ error: 'Aucun compte ne correspond à cet e-mail et numéro de téléphone.' });
  }

  user.password = newPassword;
  res.json({ message: 'Mot de passe réinitialisé avec succès.' });
});

// ==========================================
// ROUTES: ADMINISTRATEUR (ADMIN)
// ==========================================

// 7. Obtenir tous les utilisateurs (Profils)
app.get('/api/admin/users', (req, res) => {
  // On renvoie les utilisateurs en masquant les mots de passe par sécurité
  const safeUsers = users.map(u => ({
    firstname: u.firstname,
    lastname: u.lastname,
    email: u.email,
    role: u.role,
    appointmentsCount: u.appointments.length
  }));
  
  res.json({ users: safeUsers });
});

// 7. Obtenir toutes les réservations
app.get('/api/admin/appointments', (req, res) => {
  res.json({ appointments });
});

// 8. Modifier le statut d'une réservation (Admin)
app.put('/api/admin/appointments/:id/status', (req, res) => {
  const apptId = parseInt(req.params.id, 10);
  const { status, startTime, endTime } = req.body;

  const appointment = appointments.find(a => a.id === apptId);
  if (!appointment) {
    return res.status(404).json({ error: 'Rendez-vous introuvable.' });
  }

  appointment.status = status;
  if (startTime) appointment.startTime = startTime;
  if (endTime) appointment.endTime = endTime;

  // Mettre à jour le statut dans la fiche de l'utilisateur lié
  const user = users.find(u => u.email === appointment.userId);
  if (user) {
    const userAppt = user.appointments.find(a => a.id === apptId);
    if (userAppt) {
      userAppt.status = status;
      if (startTime) userAppt.startTime = startTime;
      if (endTime) userAppt.endTime = endTime;
    }
  }

  res.json({ message: 'Statut mis à jour.', appointment });
});

// Lancement du serveur
app.listen(PORT, () => {
  console.log(`Le serveur AM Customs est démarré sur http://localhost:${PORT}`);
});