import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TVs from './pages/TVs';
import ContentLibrary from './pages/ContentLibrary';
import Profiles from './pages/Profiles';
import Display from './pages/Display'; // ADD

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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Login without layout */}
        <Route path="/login" element={<Login />} />

        {/* Public display without Topbar */}
        <Route path="/display/:tvId" element={<Display />} /> {/* ADD */}

        {/* App routes with Topbar */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tvs" element={<TVs />} />
          <Route path="/content" element={<ContentLibrary />} />

          {/* Profiles + alias */}
          <Route path="/profiles" element={<Profiles />} />    {/* ADD */}
          <Route path="/profile" element={<Navigate to="/profiles" replace />} /> {/* ADD */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
