# AM Customs - Espace de Réservation Automobile de Prestige

Bienvenue sur le projet **AM Customs**, une application complète (Frontend et Backend) permettant aux clients de réserver des prestations de detailing et de personnalisation automobile, et à l'administrateur de gérer son planning et sa base de données clients.

## 🏗 Architecture du projet

Le projet est divisé en deux répertoires principaux :
- **`front/`** : Application client développée en React (Vite.js). Elle contient l'interface vitrine (Accueil, Réservation), l'espace client (Profil) et l'interface d'administration (Dashboard complet avec gestion des plannings, clients et statuts).
- **`back/`** : Serveur backend développé en Node.js (Express). Il gère l'API REST pour traiter les réservations et l'authentification.

## 🚀 Installation et Lancement en Local

Pour lancer le projet sur votre machine, vous devez démarrer le serveur (Backend) et l'interface (Frontend) simultanément dans deux terminaux séparés.

### 1. Démarrer le Serveur (Backend)
Ouvrez un terminal, placez-vous dans le dossier `back` et exécutez les commandes suivantes :
```bash
cd back
npm install
node server.js
```
*Le serveur sera actif sur `http://localhost:3000`.*

### 2. Démarrer l'Application Web (Frontend)
Ouvrez un **nouveau** terminal, placez-vous dans le dossier `front` et exécutez :
```bash
cd front
npm install
npm run dev
```
*L'application sera accessible sur `http://localhost:5173` depuis votre navigateur.*

## 🔐 Accès Administrateur (Prestataire)

Un compte administrateur est configuré par défaut pour vous permettre d'accéder au tableau de bord :
- **Adresse e-mail :** `admin@amcustoms.fr`
- **Mot de passe :** `admin`

Une fois connecté, cliquez sur votre profil en haut à droite pour basculer sur l'espace d'administration.

## 🛠 Technologies Utilisées

- **Frontend :** React.js, React Router DOM, Vite, CSS natif (Variables et Flexbox/Grid).
- **Backend :** Node.js, Express, Cors.
- **Base de données :** Variables temporaires en mémoire (prêt pour intégration MongoDB).

## ⚠️ Déploiement en ligne

Pour mettre ce site en ligne :
1. Déployez le contenu du dossier `back/` sur une plateforme comme **Render.com** (Web Service).
2. Déployez le contenu du dossier `front/` sur une plateforme comme **Vercel** en y ajoutant la variable d'environnement `VITE_API_URL` pointant vers l'URL de votre backend Render.