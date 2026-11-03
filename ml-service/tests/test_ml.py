import pytest
import numpy as np
import os
import sys

# Add app and training to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.face_recognizer import (
    extract_128d_embedding,
    compare_face_embeddings
)
from app.services.liveness_detector import compute_eye_aspect_ratio_approx
from app.services.anomaly_detector import predict_anomaly

def test_extract_128d_embedding():
    # Create synthetic test face image (128x128 BGR)
    synthetic_face = np.ones((128, 128, 3), dtype=np.uint8) * 128
    # Add dummy contrast patterns
    synthetic_face[40:60, 40:60] = 50
    synthetic_face[40:60, 68:88] = 50

    embedding = extract_128d_embedding(synthetic_face)
    assert len(embedding) == 128
    # Norm should be approximately 1.0
    norm = np.linalg.norm(np.array(embedding))
    assert abs(norm - 1.0) < 0.01

def test_compare_face_embeddings_identical():
    vec = [0.1] * 128
    norm = np.linalg.norm(vec)
    normalized_vec = [float(x / norm) for x in vec]

    verified, distance, match_score = compare_face_embeddings(normalized_vec, normalized_vec)
    assert verified is True
    assert distance == 0.0
    assert match_score == 1.0

def test_compare_face_embeddings_different():
    vec1 = [0.0] * 128
    vec1[0] = 1.0

    vec2 = [0.0] * 128
    vec2[1] = 1.0 # Orthogonal vector

    verified, distance, match_score = compare_face_embeddings(vec1, vec2)
    # Euclidean distance between orthogonal unit vectors is sqrt(2) ~= 1.414 > 0.55 threshold
    assert verified is False
    assert distance > 0.55

def test_compute_eye_aspect_ratio():
    synthetic_eye = np.zeros((30, 40), dtype=np.uint8)
    # Upper/lower eyelid gradient
    synthetic_eye[0:5, :] = 255
    synthetic_eye[25:30, :] = 255

    ear = compute_eye_aspect_ratio_approx(synthetic_eye)
    assert isinstance(ear, float)
    assert 0.1 <= ear <= 0.45

def test_predict_anomaly_normal_behavior():
    normal_telemetry = {
        "login_frequency_24h": 1.0,
        "ip_change_count": 0.0,
        "time_to_vote_seconds": 45.0, # Normal human taking 45 seconds
        "failed_attempts_ratio": 0.0,
        "hour_of_day": 14.0
    }
    is_anomaly, score, decision = predict_anomaly(normal_telemetry)
    assert is_anomaly is False
    assert decision == "NORMAL_VOTING_BEHAVIOR"

def test_predict_anomaly_bot_attack():
    bot_telemetry = {
        "login_frequency_24h": 20.0,
        "ip_change_count": 8.0,
        "time_to_vote_seconds": 0.3, # Sub-second automated script!
        "failed_attempts_ratio": 0.7,
        "hour_of_day": 3.0
    }
    is_anomaly, score, decision = predict_anomaly(bot_telemetry)
    assert is_anomaly is True
    assert decision == "FLAGGED_ANOMALOUS_BEHAVIOR"

