# AstroGuard Production Backend & ML Engine

A production-ready backend and machine learning microservice for **AstroGuard**, an AI-powered astronaut health monitoring platform designed to detect physiological anomalies during spaceflight missions.

---

## 🏗️ Architecture Overview

```
Next.js Frontend (Port 3000)
        │
        ▼ HTTP REST / JSON
Node.js + Express + TypeScript Backend API (Port 5000)
        ├── Helmet / CORS / Rate-Limit
        ├── Zod Request Validation
        ├── Mongoose Models (Astronaut, HealthData, Analysis, Alert)
        │
        ▼ HTTP REST
Python FastAPI ML Service (Port 8000)
        ├── Multi-Variate Isolation Forest
        ├── Statistical Baseline Calculation
        └── Contributor Impact Analysis
        │
        ▼
Node.js Ingestion Pipeline
        ├── Personal & Mission Baseline Comparison
        ├── Explainable Insights Generation
        ├── Automated Severity Alerts (Normal / Watch / Warning / Critical)
        │
        ▼
MongoDB Storage & Next.js Response
```

---

## 📁 Project Structure

```
backend/
│
├── src/
│   ├── config/
│   │   ├── db.ts                     # MongoDB Mongoose connection
│   │   └── env.ts                    # Zod-validated environment config
│   │
│   ├── controllers/
│   │   ├── astronaut.controller.ts   # Astronaut profile endpoints
│   │   ├── health.controller.ts      # Telemetry ingestion & query
│   │   ├── analysis.controller.ts    # AI Analysis triggers & queries
│   │   └── alert.controller.ts       # Alert management & resolution
│   │
│   ├── routes/
│   │   ├── astronaut.routes.ts       # /api/astronauts
│   │   ├── health.routes.ts          # /api/health
│   │   ├── analysis.routes.ts        # /api/analysis
│   │   └── alert.routes.ts           # /api/alerts
│   │
│   ├── models/
│   │   ├── Astronaut.ts              # Astronaut schema & interface
│   │   ├── HealthData.ts             # Health telemetry schema & indexes
│   │   ├── Analysis.ts               # AI Analysis & baseline schema
│   │   └── Alert.ts                  # Health alert schema
│   │
│   ├── services/
│   │   ├── health.service.ts         # Ingestion orchestration pipeline
│   │   ├── analysis.service.ts       # Baseline deviation & explainability
│   │   ├── alert.service.ts          # Alert generation & resolution
│   │   └── ml.service.ts             # HTTP client for Python ML engine
│   │
│   ├── middleware/
│   │   ├── error.middleware.ts       # Central error & 404 handler
│   │   └── validation.middleware.ts  # Zod schema validation middleware
│   │
│   ├── validators/
│   │   ├── astronaut.validator.ts    # Astronaut input schemas
│   │   ├── health.validator.ts       # Telemetry ranges validation
│   │   ├── analysis.validator.ts     # Analysis trigger schemas
│   │   └── alert.validator.ts        # Alert query & resolve schemas
│   │
│   ├── utils/
│   │   ├── response.ts               # Standardized success/error response
│   │   └── seed.ts                   # 30-day realistic historical seed script
│   │
│   ├── app.ts                        # Express application & middleware
│   └── server.ts                     # Server bootstrap
│
├── ml/
│   ├── api/
│   │   └── main.py                   # FastAPI application entrypoint
│   │
│   ├── services/
│   │   ├── anomaly_detection.py      # Isolation Forest training & inference
│   │   └── baseline.py               # Baseline & deviation analytics
│   │
│   ├── models/
│   │   └── anomaly_model.pkl         # Serialized ML model
│   │
│   ├── data/
│   │   └── sample_health_data.csv    # Synthetic astronaut telemetry dataset
│   │
│   ├── requirements.txt              # Python dependencies
│   └── README.md                     # ML microservice documentation
│
├── .env                              # Local environment variables
├── .env.example                      # Environment template
├── .gitignore                        # Git ignore rules
├── package.json                      # Node.js dependencies and scripts
├── tsconfig.json                     # Strict TypeScript config
└── README.md                         # Backend documentation
```

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the `backend/` directory (or copy from `.env.example`):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/astroguard
ML_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🚀 Step-by-Step Run Guide

### 1. Start MongoDB
Ensure MongoDB is running locally or provide a MongoDB Atlas URI in `.env`:
```bash
# Example if using local MongoDB service:
mongod
```

### 2. Run the Python ML Service

Open a terminal and navigate to `backend/ml`:
```bash
cd backend/ml

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn api.main:app --reload --port 8000
```
FastAPI service will be listening on `http://localhost:8000`.

### 3. Run the Node.js Express Backend

Open a second terminal and navigate to `backend`:
```bash
cd backend

# Install dependencies
npm install

# Seed the database with astronauts & 30-day telemetry
npm run seed

# Start development server with live reload
npm run dev
```

The Express API will be live on `http://localhost:5000`.

---

## 📡 API Reference & Examples

### Health Telemetry Ingestion (Manual Input Flow)
**Endpoint**: `POST /api/health`

**Description**: Ingests physiological data, stores it in MongoDB, queries historical data, calculates personal and mission baselines, executes Isolation Forest inference via Python ML service, computes risk scores, synthesizes explainable insights, creates alerts if needed, and returns the unified result.

**Request**:
```json
{
  "astronautId": "AST-001",
  "heartRate": 72,
  "spo2": 98.2,
  "sleep": 7.4,
  "activity": 68,
  "source": "manual"
}
```

**Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Health data processed and analyzed successfully",
  "data": {
    "health": {
      "_id": "67de34a2f8b...",
      "astronautId": "AST-001",
      "heartRate": 72,
      "spo2": 98.2,
      "sleep": 7.4,
      "activity": 68,
      "source": "manual",
      "timestamp": "2026-09-20T12:00:00.000Z"
    },
    "analysis": {
      "_id": "67de34a3f8b...",
      "astronautId": "AST-001",
      "anomalyScore": 18,
      "riskLevel": "Low",
      "confidence": 94.2,
      "model": "Multi-Variate Isolation Forest",
      "contributors": [
        {
          "signal": "Heart Rate",
          "change": "+2.8%",
          "impact": "Low",
          "percentage": 22,
          "description": "Minimal drift within normal resting window"
        },
        {
          "signal": "SpO₂ Oxygen",
          "change": "+0.2%",
          "impact": "Normal",
          "percentage": 8,
          "description": "Oxygenation saturation is stable and nominal"
        },
        {
          "signal": "Sleep Duration",
          "change": "-2.6%",
          "impact": "Low",
          "percentage": 18,
          "description": "Sleep duration aligned with circadian schedule"
        },
        {
          "signal": "Activity Level",
          "change": "+3.1%",
          "impact": "Low",
          "percentage": 14,
          "description": "Daily physical output aligns with standard countermeasure protocol"
        }
      ],
      "personalBaseline": {
        "heartRate": "70 BPM",
        "spo2": "98.0%",
        "sleep": "7.6 hrs",
        "activity": "65%"
      },
      "missionBaseline": {
        "heartRate": "72 BPM",
        "spo2": "97.8%",
        "sleep": "7.8 hrs",
        "activity": "62%"
      },
      "explanation": {
        "headline": "Nominal Physiological Baseline",
        "summary": "Current physiological markers are tightly aligned with calibrated personal baselines and mission cohort parameters. All vital telemetry streams remain within expected stability windows.",
        "changePointDetails": "No statistically significant change-point detected in current telemetry window.",
        "safetyNote": "AI-generated monitoring signal, not a medical diagnosis. Continuous passive telemetry active."
      },
      "recommendations": [
        "Maintain standard fluid and electrolyte hydration protocol.",
        "Continue prescribed daily cardiovascular countermeasure routine.",
        "Target 7–8 hours of unfragmented deep rest before next operational shift."
      ]
    },
    "alert": null
  }
}
```

---

### Additional Core Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health and uptime |
| `GET` | `/api/astronauts` | List all registered astronaut profiles |
| `GET` | `/api/astronauts/:id` | Get specific astronaut by ID |
| `POST` | `/api/astronauts` | Create new astronaut profile |
| `GET` | `/api/health/:astronautId` | Get historical telemetry (with pagination) |
| `GET` | `/api/health/:astronautId/latest` | Get latest recorded telemetry reading |
| `POST` | `/api/analysis` | Trigger on-demand AI analysis |
| `GET` | `/api/analysis/:astronautId/latest` | Get latest AI analysis & explanation |
| `GET` | `/api/analysis/:astronautId/history` | Get historical AI analysis records |
| `GET` | `/api/alerts` | List all alerts (supports `?severity=Critical&resolved=false`) |
| `GET` | `/api/alerts/:astronautId` | List alerts for specific astronaut |
| `POST` | `/api/alerts/:id/resolve` | Mark an alert as resolved |

---

## 🔗 How to Connect Next.js Frontend to Backend

In the Next.js frontend (e.g. `frontend/src/app/input/page.tsx` or an API helper file `frontend/src/services/api.ts`):

```typescript
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function submitHealthData(formData: {
  astronautId: string;
  heartRate: number;
  spo2: number;
  sleep: number;
  activity: number;
}) {
  const response = await fetch(`${BACKEND_URL}/api/health`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...formData,
      source: "manual",
    }),
  });

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.message || "Failed to submit telemetry");
  }

  return result.data; // contains { health, analysis, alert }
}
```

Set in `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```
