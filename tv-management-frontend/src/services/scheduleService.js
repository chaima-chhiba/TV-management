import { getToken } from './authService';

const API_BASE = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';
const base = `${API_BASE}/api/schedule`;

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`
});

const scheduleService = {
  async getByTv(tvId) {
    const r = await fetch(`${base}/tv/${tvId}`, { headers: headers() });
    if (!r.ok) throw new Error(`GET schedules ${r.status}`);
    return r.json();
  },
  async getAll() {
    const r = await fetch(base, { headers: headers() });
    if (!r.ok) throw new Error(`GET schedules ${r.status}`);
    return r.json();
  },
  async create(data) {
    const r = await fetch(base, { method: 'POST', headers: headers(), body: JSON.stringify(data) });
    if (!r.ok) throw new Error(`POST schedule ${r.status}`);
    return r.json();
  },
  async update(id, data) {
    const r = await fetch(`${base}/${id}`, { method: 'PUT', headers: headers(), body: JSON.stringify(data) });
    if (!r.ok) throw new Error(`PUT schedule ${r.status}`);
    return r.json();
  },
  async remove(id) {
    const r = await fetch(`${base}/${id}`, { method: 'DELETE', headers: headers() });
    if (!r.ok) throw new Error(`DELETE schedule ${r.status}`);
    return r;
  }
};

export default scheduleService;