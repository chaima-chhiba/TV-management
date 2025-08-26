import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { getToken } from '../services/authService';

// Pages
import Dashboard from '../pages/Dashboard';
import ContentLibrary from '../pages/ContentLibrary';
import Schedule from '../pages/Schedule';
// If you have a TVs page, import it too:
// import TVs from '../pages/TVs';
import Display from '../pages/Display';
import LoginForm from '../components/LoginForm';

function RequireAuth() {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/display/:tvNameOrId" element={<Display />} />

        {/* Protected routes */}
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/content" element={<ContentLibrary />} />
          <Route path="/schedule" element={<Schedule />} />
          {/* <Route path="/tvs" element={<TVs />} /> */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}