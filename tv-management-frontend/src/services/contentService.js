// services/contentService.js
const API_URL = 'http://localhost:5000/api/content';

import { getToken } from './authService';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
});

const contentService = {
  async getAll() {
    const res = await fetch(API_URL, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch content');
    return res.json();
  },
  async create(data) {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create content');
    return res.json();
  },
  async update(id, data) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update content');
    return res.json();
  },
  async remove(id) {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete content');
    return res.json();
  }
};

export default contentService;