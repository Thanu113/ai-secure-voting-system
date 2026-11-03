import os
import joblib
import numpy as np
from typing import Dict, Any, Tuple
from app.core.config import settings

# Global cached model and scaler
_model = None
_scaler = None

def load_anomaly_models():
    """
    Loads serialized Isolation Forest model and standard scaler from disk.
    """
    global _model, _scaler
    if _model is not None and _scaler is not None:
        return _model, _scaler

    model_path = settings.ISOLATION_FOREST_MODEL_PATH
    scaler_path = settings.SCALER_PATH

    if os.path.exists(model_path) and os.path.exists(scaler_path):
        try:
            _model = joblib.load(model_path)
            _scaler = joblib.load(scaler_path)
            print(f"[ML Service] Successfully loaded Isolation Forest model from {model_path}")
        except Exception as e:
            print(f"[ML Service Error] Could not load Isolation Forest model: {e}")
            _model, _scaler = None, None
    else:
        print("[ML Service Info] Isolation Forest model files not found on disk yet; fallback heuristics will be used.")

    return _model, _scaler

def predict_anomaly(features: Dict[str, float]) -> Tuple[bool, float, str]:
    """
    Evaluates voting behavior telemetry.
    Returns: (is_anomaly, anomaly_score, decision)
    """
    model, scaler = load_anomaly_models()

    raw_vec = [
        features.get("login_frequency_24h", 1.0),
        features.get("ip_change_count", 0.0),
        features.get("time_to_vote_seconds", 30.0),
        features.get("failed_attempts_ratio", 0.0),
        features.get("hour_of_day", 12.0),
    ]

    # If trained model is available on disk
    if model is not None and scaler is not None:
        X = np.array([raw_vec], dtype=np.float32)
        X_scaled = scaler.transform(X)

        # Isolation Forest decision_function: lower score = more anomalous
        score = float(model.decision_function(X_scaled)[0])
        prediction = int(model.predict(X_scaled)[0]) # -1 for anomaly, 1 for normal

        is_anomaly = bool(prediction == -1)
        decision = "FLAGGED_ANOMALOUS_BEHAVIOR" if is_anomaly else "NORMAL_VOTING_BEHAVIOR"
        return is_anomaly, round(score, 4), decision

    # Fallback heuristic rules if model is training or awaiting generation:
    # 1. Bot script submitting vote under 3 seconds
    # 2. Extreme failed attempts ratio > 0.5
    # 3. Excessive IP switches > 4
    time_to_vote = raw_vec[2]
    failed_ratio = raw_vec[3]
    ip_hops = raw_vec[1]
    login_freq = raw_vec[0]

    is_anomaly = False
    score = 0.5

    if time_to_vote < 2.5:
        is_anomaly = True
        score = -0.75
    elif failed_ratio > 0.5:
        is_anomaly = True
        score = -0.6
    elif ip_hops >= 4:
        is_anomaly = True
        score = -0.5
    elif login_freq >= 12:
        is_anomaly = True
        score = -0.4

    decision = "FLAGGED_ANOMALOUS_BEHAVIOR" if is_anomaly else "NORMAL_VOTING_BEHAVIOR"
    return is_anomaly, round(score, 4), decision

