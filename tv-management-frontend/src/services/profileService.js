import { getToken } from './authService';

const API_URL = 'http://localhost:5000/api/profiles';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
});

const profileService = {
  async getAll() {
    const r = await fetch(API_URL, { headers: headers() });
    if (!r.ok) throw new Error(`profiles HTTP ${r.status}`);
    return r.json();
  },
  async create(data) {
    const r = await fetch(API_URL, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(`create profile HTTP ${r.status}`);
    return r.json();
  },
  async update(id, data) {
    const r = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(data)
    });
    if (!r.ok) throw new Error(`update profile HTTP ${r.status}`);
    return r.json();
  },
  async remove(id) {
    const r = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: headers()
    });
    if (!r.ok) throw new Error(`delete profile HTTP ${r.status}`);
    return r.json();
  }
};

export default profileService;