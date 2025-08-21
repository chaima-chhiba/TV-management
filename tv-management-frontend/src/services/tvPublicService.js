const API_BASE = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

const tvPublicService = {
  async ping(id, status = 'online') {
    const r = await fetch(`${API_BASE}/api/public/tv/${id}/ping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!r.ok) throw new Error(`TV ping failed ${r.status}`);
    return r.json();
  },
  async getByName(name) {
    const r = await fetch(`${API_BASE}/api/public/tv/by-name/${encodeURIComponent(name)}`);
    if (!r.ok) throw new Error(`GET tv by name ${r.status}`);
    return r.json();
  }
};

export default tvPublicService;