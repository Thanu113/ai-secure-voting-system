const axios = require('axios');
const env = require('../config/env');

const mlApi = axios.create({
  baseURL: env.ML_SERVICE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Service-Key': process.env.INTERNAL_SERVICE_KEY || 'secret_internal_ml_service_token_ai_vote_2026',
  },
});

/**
 * Extract 128-dimensional biometric face embedding from an uploaded image
 */
const extractFaceEmbedding = async (imageBase64) => {
  try {
    const res = await mlApi.post('/api/ml/extract-embedding', { image: imageBase64 });
    return res.data;
  } catch (err) {
    console.error('[ML Service Error - Extract Embedding]:', err?.response?.data || err.message);
    throw new Error(err?.response?.data?.detail || 'Failed to extract facial biometric features');
  }
};

/**
 * Compare live webcam capture embedding with stored KYC reference embedding
 */
const verifyFace = async (liveImageBase64, registeredEmbedding) => {
  try {
    const res = await mlApi.post('/api/ml/verify-face', {
      live_image: liveImageBase64,
      registered_embedding: registeredEmbedding,
    });
    return res.data; // { verified: boolean, distance: number, threshold: number, message: string }
  } catch (err) {
    console.error('[ML Service Error - Face Verification]:', err?.response?.data || err.message);
    throw new Error(err?.response?.data?.detail || 'Biometric facial verification service failed');
  }
};

/**
 * Verify liveness (blink / Eye Aspect Ratio across sequence of frames)
 */
const checkLiveness = async (framesBase64) => {
  try {
    const res = await mlApi.post('/api/ml/liveness-check', {
      frames: framesBase64,
    });
    return res.data; // { liveness_passed: boolean, ear_scores: number[], blinks_detected: number }
  } catch (err) {
    console.error('[ML Service Error - Liveness Check]:', err?.response?.data || err.message);
    throw new Error(err?.response?.data?.detail || 'Liveness anti-spoofing check failed');
  }
};

/**
 * Evaluate behavioral telemetry through Isolation Forest anomaly detector
 */
const detectAnomaly = async (features) => {
  try {
    const res = await mlApi.post('/api/ml/detect-fraud', features);
    return res.data; // { is_anomaly: boolean, anomaly_score: number, decision: string }
  } catch (err) {
    console.warn('[ML Service Warning - Anomaly Detector]:', err?.response?.data || err.message);
    // Graceful fallback if ML service offline
    return {
      is_anomaly: false,
      anomaly_score: 0.1,
      decision: 'SERVICE_FALLBACK_PERMISSIVE',
    };
  }
};

module.exports = {
  extractFaceEmbedding,
  verifyFace,
  checkLiveness,
  detectAnomaly,
};

