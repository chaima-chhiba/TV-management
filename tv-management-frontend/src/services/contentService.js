// services/contentService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/content';

const contentService = {
  async getAll() {
    const res = await axios.get(API_URL);
    return res.data;
  },
  async create(data) {
    const res = await axios.post(API_URL, data);
    return res.data;
  },
  async update(id, data) {
    const res = await axios.put(`${API_URL}/${id}`, data);
    return res.data;
  },
  async remove(id) {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  },
};

export default contentService;
