import React from 'react';
import { Monitor, Upload, Calendar,Files} from 'lucide-react';

import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../services/authService';

const navLinks = [
  { to: '/', label: 'Dashboard', icon: Monitor },
  { to: '/tvs', label: 'TVs', icon: Monitor },
  { to: '/content', label: 'Content', icon: Upload },
  { to: '/schedule', label: 'Scheduler', icon: Calendar }
];

export default function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      width: '100%',
      background: '#fff',
      boxShadow: '0 2px 8px rgba(79,124,255,0.08)',
      padding: 0,
      position: 'sticky',
      top: 0,
      zIndex: 900
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        height: 72
      }}>
        {/* Logo and Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Monitor color="#4f7cff" size={32} />
          <span style={{ fontWeight: 700, fontSize: 22, color: '#22223b', letterSpacing: 1 }}>
            TV Management System
          </span>
        </div>
        {/* Navigation */}
        <nav style={{ display: 'flex', gap: 4 }}>
          {navLinks.map(link => (
            <button
              key={link.to}
              onClick={() => navigate(link.to)}
              style={{
                background: location.pathname === link.to ? '#2563eb' : 'transparent',
                color: location.pathname === link.to ? '#fff' : '#22223b',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                fontWeight: 500,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s'
              }}
            >
              <link.icon size={20} />
              <span>{link.label}</span>
            </button>
          ))}
        </nav>
        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            background: '#4f7cff',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            padding: '7px 16px',
            cursor: 'pointer',
            marginLeft: 16
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}