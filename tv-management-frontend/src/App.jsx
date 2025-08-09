import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Topbar from './components/Topbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TVs from './pages/TVs';
import ContentLibrary from './pages/ContentLibrary';
// import other pages if needed

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
        {/* Login route without layout */}
        <Route path="/login" element={<Login />} />

        {/* All other routes with Topbar */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tvs" element={<TVs />} />
           <Route path="/content" element={<ContentLibrary />} />
          {/* Add more protected routes here */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
