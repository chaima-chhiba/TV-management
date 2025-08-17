import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import TVs from '../pages/TVs';
import ContentLibrary from '../pages/ContentLibrary';
import Login from '../pages/Login';
import ProtectedRoute from '../components/ProtectedRoute';
import Display from '../pages/Display';
import Profiles from '../pages/Profiles';
import Schedule from '../pages/Schedule'; // ADD

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tvs"
        element={
          <ProtectedRoute>
            <TVs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/content"
        element={
          <ProtectedRoute>
            <ContentLibrary />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profiles"
        element={
          <ProtectedRoute>
            <Profiles />
          </ProtectedRoute>
        }
      />
      {/* NEW: Scheduling UI */}
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <Schedule />
          </ProtectedRoute>
        }
      />
      {/* alias for old /profile links */}
      <Route path="/profile" element={<Navigate to="/profiles" replace />} />

      {/* kiosk display should be publicly accessible */}
      <Route path="/display/:tvId" element={<Display />} />

      {/* not found */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}