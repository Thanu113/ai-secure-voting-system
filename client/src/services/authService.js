import api from './api';

export const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async verifyOtp(email, otp) {
    const res = await api.post('/auth/verify-otp', { email, otp });
    return res.data;
  },

  async resendOtp(email) {
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
  },

  async login(identifier, password) {
    const res = await api.post('/auth/login', { identifier, password });
    if (res.data?.data?.accessToken) {
      localStorage.setItem('accessToken', res.data.data.accessToken);
      localStorage.setItem('authUser', JSON.stringify(res.data.data.user));
    }
    return res.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('authUser');
    }
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async deleteMyAccount() {
    const res = await api.delete('/auth/me');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authUser');
    return res.data;
  },
};

