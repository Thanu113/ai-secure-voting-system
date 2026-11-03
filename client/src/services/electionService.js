import api from './api';

export const electionService = {
  async getElections(status) {
    const params = status ? { status } : {};
    const res = await api.get('/elections', { params });
    return res.data;
  },

  async getElectionById(id) {
    const res = await api.get(`/elections/${id}`);
    return res.data;
  },

  async getResults(id) {
    const res = await api.get(`/elections/${id}/results`);
    return res.data;
  },
};

