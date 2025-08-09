import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          padding: '3.5rem 2.5rem',
          borderRadius: '16px',
          boxShadow: '0 6px 32px rgba(0,0,0,0.10)',
          minWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Logo */}
                {/* Logo & Title */}
        <div style={{
          marginBottom: 28,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <img
            src="/logo.png"
            alt="Company Logo"
            style={{
              width: 90,
              height: 90,
              objectFit: 'contain',
              display: 'block',
              marginBottom: 6
            }}
          />
          <h2 style={{
            color: '#4f7cff',
            margin: 0,
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: 1,
            marginTop: 4 // brings the title closer to the logo
          }}>
            TV Management
          </h2>
     
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <input
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '12px 14px',
            marginBottom: 16,
            borderRadius: 8,
            border: '1px solid #b3c6e0',
            fontSize: 17
          }}
          autoFocus
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          style={{
            width: '100%',
            padding: '12px 14px',
            marginBottom: 22,
            borderRadius: 8,
            border: '1px solid #b3c6e0',
            fontSize: 17
          }}
        />
        <button
          type="submit"
                style={{
            width: '100%',
            padding: '12px 0',
            background: '#4f7cff',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 18,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.2s'
        }}
        >
          Login
        </button>
      </form>
    </div>
  );}