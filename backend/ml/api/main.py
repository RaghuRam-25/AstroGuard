import os
import sys

# Ensure parent directory is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from services.anomaly_detection import AnomalyDetector
from services.baseline import (
    calculate_personal_baseline,
    calculate_mission_baseline,
    calculate_deviation,
)

app = FastAPI(
    title="AstroGuard ML Anomaly Detection Service",
    description="Microservice for astronaut physiological anomaly detection using Isolation Forest",
    version="1.0.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthDataInput(BaseModel):
    heartRate: float = Field(..., ge=30, le=220, description="Heart rate in BPM")
    spo2: float = Field(..., ge=50, le=100, description="Blood oxygen saturation percentage")
    sleep: float = Field(..., ge=0, le=24, description="Sleep duration in hours")
    activity: float = Field(..., ge=0, le=100, description="Physical activity percentage")

class PredictResponse(BaseModel):
    anomaly: bool
    anomalyScore: int
    confidence: float
    model: str

class BaselineCalculationInput(BaseModel):
    current: HealthDataInput
    history: Optional[List[Dict[str, Any]]] = None

@app.on_event("startup")
def startup_event():
    print("[AstroGuard ML] Initializing Isolation Forest ML engine...")
    AnomalyDetector.train_or_load_model()
    print("[AstroGuard ML] Ready for inference.")

@app.get("/")
@app.get("/health")
def health_check():
    return {
        "status": "ONLINE",
        "service": "AstroGuard ML Service",
        "algorithm": "Isolation Forest",
        "version": "1.0.0"
    }

@app.post("/predict", response_model=PredictResponse)
def predict_anomaly(data: HealthDataInput):
    """
    Receives astronaut physiological parameters and returns Isolation Forest anomaly analysis.
    """
    try:
        result = AnomalyDetector.predict(
            heart_rate=data.heartRate,
            spo2=data.spo2,
            sleep=data.sleep,
            activity=data.activity,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/baseline")
def compute_baseline_and_deviations(data: BaselineCalculationInput):
    """
    Calculates dynamic personal baseline and signal deviations.
    """
    try:
        history = data.history or []
        personal_baseline = calculate_personal_baseline(history)
        current_dict = {
            "heartRate": data.current.heartRate,
            "spo2": data.current.spo2,
            "sleep": data.current.sleep,
            "activity": data.current.activity,
        }
        deviations = calculate_deviation(current_dict, personal_baseline)
        return {
            "personalBaseline": personal_baseline,
            "deviations": deviations,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Baseline computation error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
