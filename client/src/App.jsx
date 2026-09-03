import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from './i18n.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ChatComplaint from './pages/ChatComplaint.jsx';
import Track from './pages/Track.jsx';
import Help from './pages/Help.jsx';
import MapDashboard from './pages/MapDashboard.jsx';
import OfficerDashboard from './pages/OfficerDashboard.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Transparency from './pages/Transparency.jsx';
import Leaderboard from './pages/Leaderboard.jsx';

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/complaint" element={<ChatComplaint />} />
            <Route path="/track" element={<Track />} />
            <Route path="/help" element={<Help />} />
            <Route path="/map" element={<MapDashboard />} />
            <Route path="/transparency" element={<Transparency />} />
            <Route path="/analytics" element={<Transparency />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route
              path="/officer"
              element={
                <ProtectedRoute roles={['officer', 'admin']}>
                  <OfficerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Landing />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </I18nProvider>
  );
}
