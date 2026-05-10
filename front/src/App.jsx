import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Accueil from './pages/Accueil';
import Profil from './pages/Profil';
import Login from './pages/Login';
import Register from './pages/Register';
import Admin from './pages/Admin';
import ForgotPassword from './pages/ForgotPassword';
import TrackBooking from './pages/TrackBooking';
import Navbar from './components/Navbar';
import './App.scss';

function AppContent() {
  return (
      <div className="app-container">
        {/* Navigation Premium */}
        <Navbar />

        {/* Contenu des routes */}
        <main>
          <Routes>
            <Route path="/" element={<Accueil />} />
            <Route path="/profil/:nom" element={<Profil />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/track" element={<TrackBooking />} />
            <Route path="/admin" element={<Admin />} />
            
            {/* Page 404 Stylisée */}
            <Route path="*" element={
              <div className="not-found-container">
                <h1 className="not-found-title">404</h1>
                <h2 className="not-found-subtitle">Page introuvable</h2>
                <Link to="/" className="not-found-link">Retourner à l'accueil</Link>
              </div>
            } />
          </Routes>
        </main>
      </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;