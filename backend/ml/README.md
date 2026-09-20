# AstroGuard ML Service (Python + FastAPI)

AI-powered Isolation Forest anomaly detection microservice for astronaut physiological telemetry monitoring.

## 🚀 Features

- **Multi-Variate Isolation Forest**: Scikit-Learn unsupervised anomaly detection algorithm.
- **FastAPI**: Ultra-fast RESTful inference API with automatic validation.
- **Baseline Engine**: Calculates personal and mission-level baseline averages and percentage deviations.
- **Model Persistence**: Serializes trained models to `ml/models/anomaly_model.pkl` with automated training if absent.

## 🛠️ Installation & Setup

1. Navigate to the `backend/ml` directory:
```bash
cd backend/ml
```

2. Create and activate a Python virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the ML server:
```bash
uvicorn api.main:app --reload --port 8000
```

The service will be live at `http://localhost:8000`. Interactive Swagger documentation is available at `http://localhost:8000/docs`.

## 📡 API Endpoints

### 1. Health Check
`GET /health`

### 2. Predict Anomaly
`POST /predict`

**Request Body**:
```json
{
  "heartRate": 72,
  "spo2": 98,
  "sleep": 7.4,
  "activity": 68
}
```

**Response**:
```json
{
  "anomaly": false,
  "anomalyScore": 18,
  "confidence": 94.2,
  "model": "Isolation Forest"
}
```
