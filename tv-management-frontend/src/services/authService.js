import axios from 'axios';

const TOKEN_KEY = 'tv_admin_token';

export async function login({ username, password }) {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    return res.data;
  } catch (err) {
    throw new Error('Login failed');
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}