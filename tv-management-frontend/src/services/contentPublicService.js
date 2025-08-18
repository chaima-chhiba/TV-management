const API_BASE = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

const contentPublicService = {
  async getAll() {
    const r = await fetch(`${API_BASE}/api/public/content`);
    if (!r.ok) throw new Error(`GET public content ${r.status}`);
    return r.json();
  }
};

export default contentPublicService;