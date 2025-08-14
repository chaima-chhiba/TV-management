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
  },
  async create(data) {
    const r = await fetch(API_URL, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error('Failed to create profile');
    return r.json();
  },
  async update(id, data) {
    const r = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error('Failed to update profile');
    return r.json();
  },
  async remove(id) {
    const r = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: headers()
    });
    if (!r.ok) throw new Error('Failed to delete profile');
    return r.json();
  }
};

export default profileService;