import api from './api';

export const adminService = {
  async getDashboardStats() {
    const res = await api.get('/admin/dashboard-stats');
    return res.data;
  },

  async getVoters(params = {}) {
    const res = await api.get('/admin/voters', { params });
    return res.data;
  },

  async updateVoterStatus(id, status, rejectionReason = '') {
    const res = await api.patch(`/admin/voters/${id}/status`, { status, rejectionReason });
    return res.data;
  },

  async deleteVoter(id) {
    const res = await api.delete(`/admin/voters/${id}`);
    return res.data;
  },

  async createElection(data) {
    const res = await api.post('/admin/elections', data);
    return res.data;
  },

  async updateElectionStatus(id, status) {
    const res = await api.patch(`/admin/elections/${id}/status`, { status });
    return res.data;
  },

  async auditLedger(electionId) {
    const res = await api.get(`/admin/elections/${electionId}/audit-ledger`);
    return res.data;
  },

  async getFraudAlerts() {
    const res = await api.get('/admin/fraud-alerts');
    return res.data;
  },

  async resolveFraudAlert(id, status, reviewNote = '') {
    const res = await api.patch(`/admin/fraud-alerts/${id}`, { status, reviewNote });
    return res.data;
  },

  async getAuditLogs(params = {}) {
    const res = await api.get('/admin/audit-logs', { params });
    return res.data;
  },
};

