import { getToken } from './authService';
const API_URL = 'http://localhost:5000/api/profiles';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
});

const profileService = {
  async getAll() {
    const r = await fetch(API_URL, { headers: headers() });
    if (!r.ok) throw new Error('Failed to fetch profiles');
    return r.json();
  }
};

export default profileService;