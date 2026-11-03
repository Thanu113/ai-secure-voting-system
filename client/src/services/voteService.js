import api from './api';

export const voteService = {
  async verifyBiometrics(liveImage, frames = []) {
    const res = await api.post('/votes/verify-biometrics', { liveImage, frames });
    return res.data;
  },

  async castVote({ electionId, candidateId, liveImage, frames, telemetry }) {
    const res = await api.post('/votes/cast', {
      electionId,
      candidateId,
      liveImage,
      frames,
      telemetry,
    });
    return res.data;
  },

  async verifyReceipt(receiptHash) {
    const res = await api.get(`/votes/verify-receipt/${encodeURIComponent(receiptHash)}`);
    return res.data;
  },
};

