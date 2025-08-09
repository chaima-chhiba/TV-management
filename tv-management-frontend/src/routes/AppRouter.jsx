import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import TVs from '../pages/TVs';
import ContentLibrary from '../pages/ContentLibrary';
import Login from '../pages/Login';
import ProtectedRoute from '../components/ProtectedRoute';

export default function AppRouter() {
  return (
    <BrowserRouter>
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
        {/* Add other routes here, e.g. Content, Scheduler, Profile */}
      </Routes>
    </BrowserRouter>
  );
}