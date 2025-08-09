import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  const [open, setOpen] = useState(true);

  // Responsive toggle for mobile
  const toggleSidebar = () => setOpen(!open);

  return (
    <>
      {/* Hamburger for mobile */}
      <button
        onClick={toggleSidebar}
        style={{
          position: 'fixed',
          top: 18,
          left: 18,
          zIndex: 1001,
          background: '#4f7cff',
          border: 'none',
          borderRadius: 4,
          width: 40,
          height: 40,
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 24,
          cursor: 'pointer'
        }}
        className="sidebar-toggle"
      >
        ☰
      </button>
      <nav
        style={{
          width: open ? 220 : 0,
          background: '#4f7cff',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: open ? '2rem 1rem 1rem 1rem' : 0,
          boxShadow: open ? '2px 0 12px rgba(79,124,255,0.08)' : 'none',
          transition: 'width 0.3s, padding 0.3s',
          overflow: 'hidden',
          minHeight: '100vh',
          position: 'relative',
          zIndex: 1000
        }}
        className="sidebar"
      >
        <img
          src="/logo.png"
          alt="Company Logo"
          style={{
            width: 80,
            height: 70,
            objectFit: 'contain',
            marginBottom: 10,
            marginTop: 4,
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))'
          }}
        />
      
        <div style={{ width: '100%', flex: 1 }}>
          <SidebarLink to="/tvs" label="TV Management" />
          <SidebarLink to="/content" label="Content Library" />
          <SidebarLink to="/schedule" label="Scheduling" />
          <SidebarLink to="/profiles" label="Profiles" />
        </div>
      </nav>
      {/* Responsive styles */}
      <style>
        {`
          @media (max-width: 900px) {
            .sidebar {
              position: fixed;
              left: 0;
              top: 0;
              height: 100vh;
              width: ${open ? '220px' : '0'};
              padding: ${open ? '2rem 1rem 1rem 1rem' : '0'};
              box-shadow: ${open ? '2px 0 12px rgba(79,124,255,0.08)' : 'none'};
              transition: width 0.3s, padding 0.3s;
              z-index: 1000;
            }
            .sidebar-toggle {
              display: flex;
            }
          }
        `}
      </style>
    </>
  );
}

function SidebarLink({ to, label }) {
  return (
    <Link
      to={to}
      style={{
        color: '#fff',
        textDecoration: 'none',
        marginBottom: 18,
        fontSize: 17,
        fontWeight: 500,
        padding: '10px 0 10px 16px',
        borderRadius: 6,
        display: 'block',
        transition: 'background 0.2s',
      }}
      activeclassname="active"
    >
      {label}
    </Link>
  );
}