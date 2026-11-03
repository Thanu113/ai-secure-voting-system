import os
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

class Settings:
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1")
    INTERNAL_SERVICE_KEY: str = os.getenv("INTERNAL_SERVICE_KEY", "secret_internal_ml_service_token_ai_vote_2026")

    # Directories
    APP_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ROOT_DIR: str = os.path.dirname(APP_DIR)
    MODEL_DIR: str = os.path.join(ROOT_DIR, "training", "models")
    ISOLATION_FOREST_MODEL_PATH: str = os.path.join(MODEL_DIR, "isolation_forest.joblib")
    SCALER_PATH: str = os.path.join(MODEL_DIR, "scaler.joblib")

    # ML Biometrics & Anti-Spoofing Thresholds
    FACE_MATCH_DISTANCE_THRESHOLD: float = float(os.getenv("FACE_MATCH_DISTANCE_THRESHOLD", "0.76"))
    EAR_BLINK_THRESHOLD: float = float(os.getenv("EAR_BLINK_THRESHOLD", "0.22"))

settings = Settings()
