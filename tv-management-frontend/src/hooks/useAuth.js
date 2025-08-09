import { useState } from 'react';
import { login, logout, isAuthenticated } from '../services/authService';

export function useAuth() {
  const [auth, setAuth] = useState(isAuthenticated());

  const handleLogin = async (credentials) => {
    await login(credentials);
    setAuth(true);
  };

  const handleLogout = () => {
    logout();
    setAuth(false);
  };

  return { auth, handleLogin, handleLogout };
}