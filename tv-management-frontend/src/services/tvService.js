import axios from 'axios';
import { getToken } from './authService'; // Make sure the path is correct

const API_URL = 'http://localhost:5000/api/tv';

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`
  }
});

const tvService = {
  async getTVs() {
    const res = await axios.get(API_URL, getAuthHeaders());
    return res.data;
  },

  async addTV(tv) {
    const res = await axios.post(API_URL, tv, getAuthHeaders());
    return res.data;
  },

  async updateTV(tvId, tv) {
    const res = await axios.put(`${API_URL}/${tvId}`, tv, getAuthHeaders());
    return res.data;
  },

  async deleteTV(tvId) {
    const res = await axios.delete(`${API_URL}/${tvId}`, getAuthHeaders());
    return res.data;
  }
};

export default tvService;
