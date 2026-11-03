import os
import json
from fastapi import APIRouter, HTTPException, Header, status
from typing import Optional

from app.models.schemas import (
    ExtractEmbeddingRequest,
    ExtractEmbeddingResponse,
    VerifyFaceRequest,
    VerifyFaceResponse,
    LivenessCheckRequest,
    LivenessCheckResponse,
    AnomalyDetectionRequest,
    AnomalyDetectionResponse,
    ModelMetricsResponse,
)
from app.services.face_recognizer import (
    process_face_image_to_embedding,
    compare_face_embeddings,
)
from app.services.liveness_detector import evaluate_liveness_frames
from app.services.anomaly_detector import predict_anomaly
from app.core.config import settings

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

@router.post("/extract-embedding", response_model=ExtractEmbeddingResponse)
async def extract_embedding(payload: ExtractEmbeddingRequest):
    """
    Extracts a 128-dimensional facial biometric descriptor from an image.
    """
    success, embedding, message = process_face_image_to_embedding(payload.image)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return ExtractEmbeddingResponse(
        success=True,
        face_detected=True,
        embedding=embedding,
        dimensions=len(embedding),
        message=message,
    )

@router.post("/verify-face", response_model=VerifyFaceResponse)
async def verify_face(payload: VerifyFaceRequest):
    """
    Compares live webcam snapshot against registered KYC face embedding.
    """
    success, live_embedding, message = process_face_image_to_embedding(payload.live_image)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    verified, distance, match_score = compare_face_embeddings(
        live_embedding,
        payload.registered_embedding
    )

    msg = "Facial identity verified." if verified else "Facial biometric identity mismatch."

    return VerifyFaceResponse(
        verified=verified,
        distance=distance,
        match_score=match_score,
        threshold=settings.FACE_MATCH_DISTANCE_THRESHOLD,
        message=msg,
    )

@router.post("/liveness-check", response_model=LivenessCheckResponse)
async def liveness_check(payload: LivenessCheckRequest):
    """
    Analyzes frame sequence for eye blink and biometric micro-movements (anti-spoofing).
    """
    passed, blinks, ears, variance, message = evaluate_liveness_frames(payload.frames)

    return LivenessCheckResponse(
        liveness_passed=passed,
        blinks_detected=blinks,
        ear_scores=ears,
        variance=variance,
        message=message,
    )

@router.post("/detect-fraud", response_model=AnomalyDetectionResponse)
async def detect_fraud(payload: AnomalyDetectionRequest):
    """
    Evaluates behavioral telemetry with the Isolation Forest anomaly detector.
    """
    features = payload.model_dump()
    is_anomaly, score, decision = predict_anomaly(features)

    return AnomalyDetectionResponse(
        is_anomaly=is_anomaly,
        anomaly_score=score,
        decision=decision,
        features_evaluated=features,
    )

@router.post("/train-anomaly-model")
async def train_model():
    """
    Triggers synthetic generation and training of the Isolation Forest model.
    """
    try:
        from training.train_isolation_forest import train_and_save_model
        from training.evaluate_model import evaluate

        train_and_save_model()
        report = evaluate()
        return {"success": True, "message": "Model trained and evaluated successfully", "report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics", response_model=ModelMetricsResponse)
async def get_model_metrics():
    """
    Returns the latest offline evaluation metrics of the fraud detection model.
    """
    report_file = os.path.join(settings.MODEL_DIR, "evaluation_report.json")
    if os.path.exists(report_file):
        try:
            with open(report_file, "r") as f:
                data = json.load(f)
            return ModelMetricsResponse(
                model_name=data.get("model_name", "Isolation Forest"),
                is_trained=data.get("is_trained", True),
                accuracy=data.get("accuracy"),
                precision=data.get("precision"),
                recall=data.get("recall"),
                f1_score=data.get("f1_score"),
                confusion_matrix=data.get("confusion_matrix"),
            )
        except Exception:
            pass

    return ModelMetricsResponse(
        model_name="Isolation Forest Anomaly Classifier",
        is_trained=False,
    )

