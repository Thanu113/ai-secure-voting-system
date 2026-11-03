from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ExtractEmbeddingRequest(BaseModel):
    image: str = Field(..., description="Base64 encoded image string (with or without data URI prefix)")

class ExtractEmbeddingResponse(BaseModel):
    success: bool
    face_detected: bool
    embedding: List[float]
    dimensions: int
    message: str

class VerifyFaceRequest(BaseModel):
    live_image: str = Field(..., description="Base64 encoded live webcam snapshot")
    registered_embedding: List[float] = Field(..., description="128-dimensional registered KYC embedding vector")

class VerifyFaceResponse(BaseModel):
    verified: bool
    distance: float
    match_score: float
    threshold: float
    message: str

class LivenessCheckRequest(BaseModel):
    frames: List[str] = Field(..., min_length=2, description="Sequence of 2-5 consecutive webcam frames")

class LivenessCheckResponse(BaseModel):
    liveness_passed: bool
    blinks_detected: int
    ear_scores: List[float]
    variance: float
    message: str

class AnomalyDetectionRequest(BaseModel):
    login_frequency_24h: float = Field(..., ge=0)
    ip_change_count: float = Field(..., ge=0)
    time_to_vote_seconds: float = Field(..., ge=0)
    failed_attempts_ratio: float = Field(..., ge=0.0, le=1.0)
    hour_of_day: float = Field(..., ge=0, le=24)

class AnomalyDetectionResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    decision: str
    features_evaluated: Dict[str, float]

class ModelMetricsResponse(BaseModel):
    model_name: str
    is_trained: bool
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    confusion_matrix: Optional[List[List[int]]] = None
    last_evaluated: Optional[str] = None

