const API_BASE = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000';

const schedulePublicService = {
  async getByTv(tvId) {
    const r = await fetch(`${API_BASE}/api/public/schedule/tv/${tvId}`);
    if (!r.ok) throw new Error(`GET public schedules ${r.status}`);
    return r.json();
  }
};

export default schedulePublicService;