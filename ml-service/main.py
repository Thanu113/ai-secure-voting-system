import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as ml_router
from app.services.anomaly_detector import load_anomaly_models
from app.core.config import settings

app = FastAPI(
    title="AI Secure Voting - ML Biometrics & Fraud Detection Service",
    description="Microservice providing 128-d face embeddings, EAR liveness challenge, and Isolation Forest behavioral fraud detection.",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(ml_router)

@app.on_event("startup")
async def startup_event():
    print("[FastAPI ML Service] Starting up... Initializing models.")
    load_anomaly_models()

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "UP",
        "service": "FastAPI ML Microservice",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )

