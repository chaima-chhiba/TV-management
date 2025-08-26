import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TVs from './pages/TVs';
import ContentLibrary from './pages/ContentLibrary';
import Display from './pages/Display'; 
import Schedule from './pages/Schedule'; 
import ToastProvider from './components/ToastProvider';
import { getToken } from './services/authService'; // ADD

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar />
      <main className="pt-4 px-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

// ADD: auth guard
function RequireAuth() {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public: login */}
          <Route path="/login" element={<Login />} />

          {/* Public: display */}
          <Route path="/display/:tvId" element={<Display />} />

          {/* Protected app routes (wrap with auth guard, then layout) */}
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tvs" element={<TVs />} />
              <Route path="/content" element={<ContentLibrary />} />
              <Route path="/schedule" element={<Schedule />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
