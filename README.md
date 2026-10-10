# 🚀 AstroGuard — Autonomous Astronaut Health Intelligence & Telemedicine

[![NASA Space Apps Challenge](https://img.shields.io/badge/NASA%20Space%20Apps-Challenge%20Project-0B3D91?style=for-the-badge&logo=nasa&logoColor=white)](https://www.spaceappschallenge.org/)
[![NASA Open APIs](https://img.shields.io/badge/Data%20Source-NASA%20Open%20APIs%20(api.nasa.gov)-E03C31?style=for-the-badge&logo=nasa&logoColor=white)](https://api.nasa.gov/)
[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016%20%7C%20React%2019-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js & Express](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express%20%7C%20TypeScript-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python & FastAPI](https://img.shields.io/badge/Edge%20AI-Python%20%7C%20FastAPI%20%7C%20Scikit--Learn-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![WebRTC & Socket.io](https://img.shields.io/badge/Real--Time-WebRTC%20%7C%20Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)](LICENSE)

> **"Healthier Astronauts. Safer Missions."**  
> An autonomous, latency-immune astronaut health monitoring, physiological anomaly detection, and real-time telemedicine platform engineered for deep-space exploration (Lunar Artemis & Mars transit). Powered by onboard IoT telemetry, Grounded AI Intelligence, and **live NASA Open APIs** (`api.nasa.gov`).

---

## 🌐 Live Deployments & Repository

| Service | Platform | URL |
| :--- | :--- | :--- |
| **Frontend Web App** | Vercel | [https://astro-guard-liart.vercel.app](https://astro-guard-liart.vercel.app) |
| **Backend API** | Render | [https://astroguard-tgdw.onrender.com](https://astroguard-tgdw.onrender.com) |
| **GitHub Repository** | GitHub | [https://github.com/RaghuRam-25/AstroGuard](https://github.com/RaghuRam-25/AstroGuard) |

---

## 📑 Table of Contents

- [Problem Statement \& Mission Context](#-problem-statement--mission-context)
- [System Architecture](#-system-architecture)
- [NASA Open APIs Integration (api.nasa.gov)](#-nasa-open-apis-integration-apinasagov)
- [Key Features \& Portals](#-key-features--portals)
  - [1. Astronaut Portal](#1-astronaut-portal-)
  - [2. Medical Officer (Flight Surgeon) Portal](#2-medical-officer-flight-surgeon-portal-)
  - [3. Mission Control Command Center](#3-mission-control-command-center-)
  - [4. Edge AI \& Acoustic Biomarker Engine](#4-edge-ai--acoustic-biomarker-engine-)
  - [5. Zero-Manual-Entry IoT Sensor Telemetry Bus](#5-zero-manual-entry-iot-sensor-telemetry-bus-)
  - [6. NASA Open APIs Space Weather \& Radiation Engine](#6-nasa-open-apis-space-weather--radiation-engine-)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Demo Credentials](#-demo-credentials)
- [Local Installation \& Setup](#-local-installation--setup)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup-nodejs--express)
  - [2. ML \& Edge AI Engine Setup](#2-ml--edge-ai-engine-setup-python--fastapi)
  - [3. Frontend Setup](#3-frontend-setup-nextjs-16)
- [Environment Variables Guide](#-environment-variables-guide)
- [API Reference](#-api-reference)
- [Machine Learning \& Edge Diagnostic Models](#-machine-learning--edge-diagnostic-models)
- [Real-Time Communication \& Telemedicine Protocol](#-real-time-communication--telemedicine-protocol)
- [Security, Privacy \& Clinical Guardrails](#-security-privacy--clinical-guardrails)
- [Contributing \& Team](#-contributing--team)

---

## 🌌 Problem Statement & Mission Context

During long-duration deep-space transit (e.g., a 6-to-9 month voyage to Mars), astronauts endure extreme physiological and psychological stressors:
- **Cardiovascular & Musculoskeletal Deconditioning:** Zero-gravity fluid shifts, muscle atrophy, and bone mineral loss.
- **Space Radiation Hazards:** Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE).
- **Circadian Rhythm Disruption:** Altered sleep cycles in microgravity environments.
- **Isolation \& Cognitive Fatigue:** Prolonged confinement and sensory deprivation.
- **Earth-to-Mars Communication Latency:** Signal delay ranges from **4 to 24 minutes each way**, rendering real-time terrestrial ER intervention impossible during acute emergencies.

**AstroGuard** bridges this critical gap by delivering an **autonomous edge-computing health intelligence system** that detects early physiological anomalies locally without requiring continuous Earth contact, coupled with an encrypted telemedicine pipeline for scheduled consultations between astronauts and dedicated flight surgeons.

---

## 🏗️ System Architecture

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │               ASTRONAUT & CREW SENSORS                 │
                                  │  - Biosensor Watch / Bio-Band (HR, SpO2, Temp, BP)     │
                                  │  - Micro-Fluidic Sweat Patch (Electrolytes, Cortisol)  │
                                  │  - Lab-on-a-Chip Bio-Sample Reader                     │
                                  │  - RFID Nutrition Meal Scanner                         │
                                  └──────────────────────────┬─────────────────────────────┘
                                                             │ Real-Time SSE / HTTP Ingestion
                                                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                   NEXT.JS 16 FRONTEND                                    │
│                     (React 19, Tailwind CSS v4, DaisyUI, Framer Motion)                  │
│                                                                                          │
│  ┌───────────────────────┐  ┌─────────────────────────┐  ┌────────────────────────────┐  │
│  │   ASTRONAUT PORTAL    │  │  MEDICAL OFFICER PORTAL │  │   MISSION CONTROL CENTER   │  │
│  │  - Vital Telemetry    │  │  - Clinical Triage Hub  │  │  - Fleet Readiness Board   │  │
│  │  - Edge Cockpit       │  │  - Multi-Crew Analytics │  │  - Doctor/Crew Assignments │  │
│  │  - Grounded AI Chat   │  │  - Baseline Deviation   │  │  - Registration Gate       │  │
│  │  - Diagnostic Suite   │  │  - Consultation Reports │  │  - Alert Directives        │  │
│  │  - Telemedicine Call  │  │  - Telemedicine Call    │  │  - Mission Lifecycle       │  │
│  └───────────┬───────────┘  └────────────┬────────────┘  └─────────────┬──────────────┘  │
└──────────────┼───────────────────────────┼─────────────────────────────┼─────────────────┘
               │                           │                             │
               │ REST API / Cookie Auth    │ WebRTC / Socket.IO          │ REST API
               ▼                           ▼                             ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                       NODE.JS + EXPRESS + TYPESCRIPT BACKEND                             │
│                                                                                          │
│  ├── Security: Helmet, HTTP-only Cookies, CORS Origin Whitelist, Rate Limiting           │
│  ├── Validation: Zod schemas for all inbound telemetry & requests                        │
│  ├── WebSockets: Socket.io 4.8 (Audio/Video Signaling, Presence Tracking, Live Chat)     │
│  ├── Ingestion & Analytics Pipeline: Personal & Mission Baseline Deviations             │
│  ├── NASA Service: Real-time Space Weather & Ionizing Radiation Scorer (api.nasa.gov)    │
│  └── Grounded AI Service: Context-injected LLM Assistant (Gemini / OpenAI compatible)    │
└──────────────┬───────────────────────────────┬───────────────────────────┬───────────────┘
               │                               │                           │
HTTP REST (Internal)             Database Queries & Indexes      HTTPS (NASA_API_KEY)
               ▼                               ▼                           ▼
┌──────────────────────────────┐  ┌────────────────────────┐  ┌────────────────────────────┐
│ PYTHON FASTAPI ML & EDGE AI  │  │    MONGODB DATABASE    │  │   NASA OPEN APIS GATEWAY   │
│                              │  │                        │  │     (api.nasa.gov)         │
│ ├── Isolation Forest Anomaly │  │ ├── Astronaut Vitals   │  │                            │
│ ├── Librosa Voice Biomarkers │  │ ├── Mission Baselines  │  │ ├── NASA DONKI (CME/SEP)   │
│ │   - Pitch, MFCC, Centroid  │  │ ├── AI Health Scores   │  │ ├── Solar Energetic Flux   │
│ ├── ARED Workout Predictor   │  │ ├── Telemedicine Logs  │  │ ├── Space Radiation Index │
│ └── Offline Edge Inference   │  │ └── Clinical Reports   │  │ └── APOD Mission Backdrop  │
└──────────────────────────────┘  └────────────────────────┘  └────────────────────────────┘
```

---

## 🛰️ NASA Open APIs Integration (`api.nasa.gov`)

To ensure authentic spaceflight environmental data alongside individual physiological telemetry, **AstroGuard** directly connects to the **NASA Open Data API Ecosystem (`api.nasa.gov`)**:

```
                       ┌───────────────────────────────────────────────┐
                       │          NASA Open APIs (api.nasa.gov)        │
                       └───────────────────────┬───────────────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
    ┌──────────────────────┐        ┌──────────────────────┐        ┌──────────────────────┐
    │      NASA DONKI      │        │ NASA Solar Particle  │        │      NASA APOD       │
    │  Coronal Mass Events │        │   Radiation Alerts   │        │ Astronomy Picture of │
    │    (/DONKI/CME)      │        │     (/DONKI/SEP)     │        │       the Day        │
    └──────────┬───────────┘        └──────────┬───────────┘        └──────────┬───────────┘
               │                               │                               │
               └───────────────────────┬───────────────────────────────────────┘
                                       │ HTTPS / JSON (backend/src/services/nasa.service.ts)
                                       ▼
                       ┌───────────────────────────────────────────────┐
                       │           AstroGuard Backend Ingestion        │
                       │   - Real-Time Ionizing Radiation Scoring      │
                       │   - Solar Proton Flux Evaluation              │
                       │   - Storm Shelter Protocol Automated Trigger  │
                       │   - Grounded AI Health Intelligence Injection │
                       └───────────────────────────────────────────────┘
```

### 1. NASA DONKI (Space Weather Database Of Notifications, Knowledge, And Information)
- **Endpoint:** `GET https://api.nasa.gov/DONKI/SEP` & `GET https://api.nasa.gov/DONKI/CME` & `GET https://api.nasa.gov/DONKI/GST`
- **Application in AstroGuard:** Deep-space astronauts travelling outside Earth's magnetosphere are vulnerable to **Solar Particle Events (SPE)** and **Galactic Cosmic Rays (GCR)**. AstroGuard ingests real-time solar events to compute the **Cumulative Ambient Ionizing Radiation ($\text{mSv/day}$)**.
- **Automated Cabin Alert:** If high-energy protons ($>10\text{ MeV}$) or severe CMEs are confirmed by NASA DONKI, the system automatically elevates the radiation status to `HIGH_RADIATION_ALERT` and flags mandatory crew shelter in the heavily shielded cabin storm bunk.

### 2. NASA Astronomy Picture of the Day (APOD)
- **Endpoint:** `GET https://api.nasa.gov/planetary/apod`
- **Application in AstroGuard:** Synchronizes live space exploration imagery, educational planetary backdrops, and astronomical context for crew psychological morale and public dashboard portals.

### 3. NASA Open Science Data Repository (OSDR) & GeneLab Alignment
- **Space Biology Benchmarks:** AstroGuard's physiological baseline algorithms align with NASA open science datasets (LSDA & GeneLab) on human bone mineral density degradation, cardiovascular deconditioning, and fluid shift phenomena in microgravity.

---

## ✨ Key Features & Portals

### 1. Astronaut Portal 🧑‍🚀
- **Real-Time Physiological Telemetry:** Continuous live display of Heart Rate (BPM), Blood Oxygen ($\text{SpO}_2$), Core Body Temperature ($^\circ\text{C}$), Blood Pressure, and Ambient/Cumulative Radiation ($\text{mSv}$).
- **Grounded AI Health Intelligence Assistant:** A conversational agent that understands health telemetry, answers general scientific questions, analyzes vitals, and offers calm guidance with zero hallucinations. Includes Speech-to-Text voice recording and automated Text-to-Speech audio playback.
- **Diagnostic Suite & Bio-Link Station:** Lab-on-a-Chip sample analysis (Blood, Saliva, Urine, Sweat) for leukocyte count, hydration index, micro-gravity electrolyte imbalance, and metabolic stress markers.
- **RFID Smart Nutrition Scanner:** Automated meal packet scanning to monitor daily macronutrients (Calories, Protein, Carbs, Fats) and micronutrients (Potassium, Sodium, Magnesium, Calcium, Iron).
- **1-on-1 Encrypted Telemedicine Link:** One-click audio and video consultations connecting the astronaut directly to their assigned Flight Surgeon.

### 2. Medical Officer (Flight Surgeon) Portal 🩺
- **Clinical Triage & Cohort Dashboard:** Unified multi-astronaut monitoring view displaying severity statuses (**Nominal**, **Watch**, **Warning**, **Critical**).
- **Baseline Deviation Analytics:** Granular comparison between an astronaut's individual baseline and the overall mission cohort baseline to isolate true physiological anomalies from normal space adaptation syndrome.
- **Direct Telemedicine Hub:** Real-time WebRTC audio/video calling with incoming call modal, ringtones, screen toggle, and encrypted text messaging.
- **Clinical Recommendation & Prescription Suite:** Prescribe 24-hour pharmaceutical interventions, exercise adjustments, and hydration infusions with digital signatures and audit logging.
- **Official Consultation Reports:** Generate structured clinical consultation summaries with diagnostic findings, risk stratification, and follow-up schedules.

### 3. Mission Control Command Center 🛰️
- **Fleet-Wide Health Readiness Board:** High-level mission health index, telemetry connectivity status, and active crew status indicators.
- **Crew & Flight Surgeon Assignment Matrix:** Reassign astronauts to designated medical officers and bind crew members to specific mission flight paths.
- **Dynamic Registration Window Gate:** Time-limited registration gate with real-time countdown timer; open or lock self-registration for new mission crew members.
- **Mission Lifecycle Controls:** Manage mission duration, active flight phases (Pre-Launch, Transit, Orbital Insertion, Surface Operations), and emergency alert broadcasting.

### 4. Edge AI & Acoustic Biomarker Engine 🧠
- **100% Offline Edge Computing:** Runs locally on spacecraft cabin hardware with zero dependencies on Earth cloud servers.
- **Acoustic Voice Stress Analysis:** Extracts acoustic features from 10-second daily voice check-ins using `librosa`:
  - **Fundamental Frequency ($F_0$) & Pitch Jitter**
  - **Spectral Centroid (Vocal Effort & Exhaustion)**
  - **13-Coefficient MFCCs (Mel-Frequency Cepstral Coefficients) for Cognitive Strain**
  - Generates an automated **Stress Perturbation Score (0–100)** to detect isolation fatigue before operational degradation occurs.
- **Personalized Countermeasure Prescriptions:** Computes exact workout wattage on the Cycle Ergometer and load resistance for the Advanced Resistive Exercise Device (ARED) based on daily muscle impedance and cardiovascular fatigue.

### 5. Zero-Manual-Entry IoT Sensor Telemetry Bus 📡
- **Smart Bio-Band:** Non-invasive photoplethysmography (PPG) and ECG monitoring for heart rate variability, blood pressure, and oxygen saturation.
- **Micro-Fluidic Sweat Patch:** Continuous transdermal biomarker collection measuring cortisol, lactate, and electrolyte depletion.
- **Sleep Pod Environmental Sensors:** Contactless ballistocardiography, sleep cycle staging (REM / Deep / Light), and cabin ambient $\text{CO}_2$ / radiation tracking.

---

## 💻 Technology Stack

### Frontend Application
- **Framework:** Next.js 16.3.5 (App Router)
- **Library:** React 19.2.8
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS v4, DaisyUI 5, Vanilla CSS Design System
- **Animation & Visuals:** Framer Motion 13, Custom CSS Canvas Space Engine, Solar System Orbitals
- **Charts & Data Viz:** Recharts 3.10
- **Real-Time Client:** Socket.IO Client 4.8.3, WebRTC MediaStream API
- **Icons:** Lucide React

### Backend API Server
- **Runtime:** Node.js (>= 20.19.0)
- **Framework:** Express 4.21.2
- **Language:** TypeScript 5.7 (compiled via `tsc`, hot-reloading with `tsx`)
- **Database ORM:** Mongoose 8.9.5 (MongoDB Atlas / Local)
- **Real-Time Protocol:** Socket.IO 4.8.3 (signaling, presence, chat)
- **Authentication & Security:** JWT (Access & Refresh tokens in HTTP-only cookies), Bcryptjs 3.0, Helmet 8.0, Express Rate Limit 7.5, CORS origin filtering
- **Data Validation:** Zod 3.24.1
- **File & Media Storage:** Multer 2.4, Cloudinary SDK 2.11

### Machine Learning & Edge Microservice
- **Runtime:** Python 3.10+
- **API Framework:** FastAPI, Uvicorn (ASGI)
- **Anomaly Detection:** Scikit-Learn (Multi-Variate Isolation Forest), NumPy, Pandas
- **Acoustic Biomarkers:** Librosa, SoundFile (MFCCs, spectral centroid, pitch tracking)
- **Data Serialization:** Joblib, Pickle

---

## 📁 Repository Structure

```
AstroGuard/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.ts                    # MongoDB Mongoose connection
│   │   │   └── env.ts                   # Zod-validated environment config
│   │   ├── controllers/                 # Express request handlers
│   │   │   ├── astronaut.controller.ts  # Astronaut profile & telemetry endpoints
│   │   │   ├── health.controller.ts     # Health telemetry queries & ingestion
│   │   │   ├── analysis.controller.ts   # AI analysis triggers & reports
│   │   │   ├── alert.controller.ts      # Clinical alert management
│   │   │   ├── auth.controller.ts       # Authentication & token rotation
│   │   │   ├── medical.controller.ts    # Flight Surgeon cohort & triage
│   │   │   └── missionControl.controller.ts # Fleet management & assignments
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts       # Role-based JWT authentication
│   │   │   ├── error.middleware.ts      # Global error & 404 handler
│   │   │   └── validation.middleware.ts # Zod schema validation
│   │   ├── models/                      # 21 Mongoose Database Schemas
│   │   │   ├── Astronaut.ts             # Astronaut profile schema
│   │   │   ├── HealthData.ts            # High-frequency physiological telemetry
│   │   │   ├── Analysis.ts              # AI baseline & anomaly records
│   │   │   ├── Alert.ts                 # Real-time health alerts
│   │   │   ├── User.ts                  # Role-based user accounts
│   │   │   ├── Mission.ts               # Space mission lifecycle
│   │   │   ├── BioSample.ts             # Lab-on-a-Chip diagnostic samples
│   │   │   ├── CallLogs.ts              # Telemedicine call session logs
│   │   │   ├── MedicalChat.ts           # Encrypted clinical messaging
│   │   │   ├── ConsultationReport.ts    # Flight Surgeon clinical reports
│   │   │   ├── DailyNutrientIntake.ts   # RFID nutritional logs
│   │   │   └── SystemSetting.ts         # Dynamic registration gates
│   │   ├── routes/                      # 19 REST API Route modules
│   │   ├── services/
│   │   │   ├── aiChat.service.ts        # Grounded conversational AI engine
│   │   │   ├── analysis.service.ts      # Baseline & deviation analytics
│   │   │   ├── health.service.ts        # Telemetry ingestion pipeline
│   │   │   ├── medicalCommunication.service.ts # Telemedicine & WebRTC
│   │   │   └── ml.service.ts            # Client for Python ML microservice
│   │   ├── utils/
│   │   │   ├── seed.ts                  # Comprehensive demo database seed
│   │   │   ├── seedDemo.ts              # Safe idempotent demo account restore
│   │   │   └── response.ts              # Standardized API response formatters
│   │   ├── app.ts                       # Express app configuration & middleware
│   │   ├── server.ts                    # HTTP & Socket.IO server bootstrap
│   │   └── socket.ts                    # WebRTC signaling & real-time events
│   ├── ml/                              # Python Machine Learning Microservice
│   │   ├── api/main.py                  # FastAPI application entrypoint
│   │   ├── services/
│   │   │   ├── anomaly_detection.py     # Isolation Forest training & inference
│   │   │   └── baseline.py              # Cohort baseline analytics
│   │   ├── models/anomaly_model.pkl     # Serialized ML model
│   │   ├── data/sample_health_data.csv  # Synthetic astronaut dataset
│   │   └── requirements.txt             # Python dependencies
│   ├── edge_health_ai.py                # Standalone Edge AI Voice & Prescription service
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                         # Next.js App Router Pages
│   │   │   ├── page.tsx                 # Public Landing Page & Launch Animation
│   │   │   ├── login/                   # Role-based Login page
│   │   │   ├── register/                # Gated Crew Registration page
│   │   │   ├── about/                   # About AstroGuard & Platform Pillars
│   │   │   ├── mission/                 # Deep Space Mission Overview
│   │   │   ├── sensors/                 # Zero-Manual IoT Hardware Specifications
│   │   │   ├── astrocrew/               # Interactive Space Medicine Cockpit
│   │   │   ├── edge-cockpit/            # Offline Edge AI & Acoustic Biomarkers
│   │   │   ├── astronaut/               # Astronaut Portal
│   │   │   │   ├── dashboard/           # Astronaut Live Vitals Dashboard
│   │   │   │   ├── ai-analysis/         # Grounded AI Chat Assistant (Voice I/O)
│   │   │   │   ├── diagnostic-suite/    # RFID Nutrition & Lab-on-a-Chip
│   │   │   │   ├── medical-consult/     # Telemedicine 1-on-1 Video Link
│   │   │   │   └── profile/             # Crew Profile & Medical History
│   │   │   ├── medical/                 # Medical Officer (Flight Surgeon) Portal
│   │   │   │   ├── dashboard/           # Clinical Triage & Cohort Board
│   │   │   │   ├── ai-analysis/         # Baseline Deviation Analytics
│   │   │   │   ├── medical-consult/     # Telemedicine Hub (Video & CallModal)
│   │   │   │   ├── reports/             # Consultation Reports
│   │   │   │   └── clinical-protocols/  # Medical Directives & Prescriptions
│   │   │   └── mission-control/         # Mission Control Command Portal
│   │   │       └── dashboard/           # Fleet Oversight & Registration Gate
│   │   ├── components/                  # Reusable UI Components
│   │   │   ├── analysis/                # AI Message & Key Findings Cards
│   │   │   ├── astrocrew/               # Space Medicine Simulation
│   │   │   ├── medical/                 # CallModal, ClinicalTriageHub, Telemedicine
│   │   │   ├── mission-control/         # MissionControlDashboard
│   │   │   ├── public/                  # PublicShell, Header, Footer
│   │   │   └── SpaceLaunchOverlay.tsx   # Interactive Rocket Launch Simulation
│   │   ├── context/
│   │   │   ├── AuthContext.tsx          # JWT Auth & Role session state
│   │   │   ├── CallContext.tsx          # WebRTC Call signaling & Audio/Video state
│   │   │   └── RegistrationContext.tsx  # Dynamic registration window listener
│   │   ├── hooks/
│   │   │   ├── useTelemetryStream.ts    # High-frequency vitals stream hook
│   │   │   ├── useVoiceRecorder.ts      # Audio capture & speech recording
│   │   │   └── useSpeechPlayback.ts     # Speech synthesis voice playback
│   │   ├── lib/api.ts                   # Centralized Axios client & API helpers
│   │   └── middleware.ts                # Next.js Route Guard & Role-based redirects
│   ├── package.json
│   └── tsconfig.json
│
└── README.md                            # AstroGuard Master Documentation
```

---

## 🔑 Demo Credentials

To explore the platform immediately without registration, use the pre-configured role-based credentials:

| Role | Name | Email | Password | Primary Portal |
| :--- | :--- | :--- | :--- | :--- |
| **Astronaut** | Alex Morgan (AST-001) | `alex@astroguard.local` | `AstroGuard@2025!` | `/astronaut/dashboard` |
| **Flight Surgeon** | Dr. Evelyn Vance | `medical@astroguard.local` | `AstroGuard@2025!` | `/medical/dashboard` |
| **Mission Control** | Flight Dynamics Lead | `mission@astroguard.local` | `AstroGuard@2025!` | `/mission-control/dashboard` |

> 💡 **Tip:** Open two different browser windows (e.g. one standard and one incognito) — log in as Alex Morgan in one and Dr. Evelyn Vance in the other to test the **real-time 1-on-1 WebRTC audio/video calling** and encrypted medical chat!

---

## 🛠️ Local Installation & Setup

### Prerequisites
- **Node.js:** v20.19.0 or higher
- **npm:** v10.0 or higher
- **Python:** v3.10 or higher
- **MongoDB:** Local MongoDB instance running on `localhost:27017` OR a MongoDB Atlas cluster URI
- **Git**

---

### 1. Backend Setup (Node.js & Express)

1. Open your terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Configure your `.env` file:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and verify your `MONGODB_URI` (e.g. `mongodb://localhost:27017/astroguard`).*

4. Seed the database with demo missions, astronauts, and clinical records:
   ```bash
   npm run seed -- --force
   ```

5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The Express API will be running at:* `http://localhost:5000`  
   *Verify API status at:* `http://localhost:5000/health`

---

### 2. ML & Edge AI Engine Setup (Python & FastAPI)

1. Open a new terminal and navigate to the `backend/ml` directory:
   ```bash
   cd backend/ml
   ```

2. Create and activate a Python virtual environment:
   - **Windows:**
     ```powershell
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **Linux / macOS:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Install required ML packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Launch the FastAPI ML microservice:
   ```bash
   uvicorn api.main:app --reload --port 8000
   ```
   *The ML service will be running at:* `http://localhost:8000`  
   *Interactive Swagger Documentation:* `http://localhost:8000/docs`

5. *(Optional)* Launch the standalone Edge Audio Biomarker service:
   ```bash
   python -m uvicorn edge_health_ai:app --reload --port 8001
   ```

---

### 3. Frontend Setup (Next.js 16)

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Configure your local environment file:
   Create a `.env.local` file with the following variable:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

4. Launch the Next.js development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## ⚙️ Environment Variables Guide

### Backend (`backend/.env`)
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB Database Connection
MONGODB_URI=mongodb://localhost:27017/astroguard

# JWT Secrets for Authentication
JWT_SECRET=astroguard_jwt_super_secret_key_2025_secure_telemetry
REFRESH_TOKEN_SECRET=astroguard_refresh_token_super_secret_key_2025_deep_space
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS Allowed Origins (Comma-separated)
FRONTEND_URL=http://localhost:3000

# Microservices
ML_SERVICE_URL=http://localhost:8000

# Optional AI / LLM Configuration (OpenAI or Gemini)
AI_API_BASE_URL=
AI_API_KEY=
AI_MODEL=gpt-4o-mini
GEMINI_API_KEY=

# Optional Cloudinary (for avatar & diagnostic upload)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_URL=

# NASA Open APIs (api.nasa.gov) — DEMO_KEY or your registered NASA Key
NASA_API_KEY=DEMO_KEY
```

### Frontend (`frontend/.env.local`)
```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## 📡 API Reference

### NASA Open APIs (`/api/nasa` & `/api/v1/nasa`)
| Method | Endpoint | Description | Source / Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/nasa/space-weather` | Live Coronal Mass Ejections (CME), Solar Energetic Particles (SEP), & storm shelter alerts | NASA DONKI / Public |
| `GET` | `/api/nasa/radiation` | Deep-space ionizing radiation score ($\text{mSv/day}$) & solar proton flux evaluation | NASA DONKI / Public |
| `GET` | `/api/nasa/apod` | Daily astronomical deep-space imagery & educational mission context | NASA APOD / Public |

### Authentication & Users (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new crew account (subject to registration window) | Public / Gated |
| `POST` | `/api/auth/login` | Authenticate user and issue HTTP-only JWT cookies | Public |
| `POST` | `/api/auth/logout` | Revoke session and clear authentication cookies | Authenticated |
| `GET` | `/api/auth/me` | Fetch currently authenticated user profile | Authenticated |
| `POST` | `/api/auth/refresh` | Refresh expired access token using refresh token | Authenticated |

### Physiological Telemetry (`/api/health` & `/api/telemetry`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/health` | Ingest new physiological sensor telemetry record | Astronaut / IoT |
| `GET` | `/api/health/:astronautId` | Retrieve historical vitals query for an astronaut | Authenticated |
| `GET` | `/api/health/:astronautId/latest` | Fetch most recent real-time vital metrics | Authenticated |
| `GET` | `/api/telemetry/stream` | Server-Sent Events (SSE) live telemetry feed | Authenticated |

### AI Analysis & Anomaly Detection (`/api/analysis` & `/api/ai`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/analysis` | Trigger Isolation Forest anomaly evaluation | Authenticated |
| `GET` | `/api/analysis/:astronautId` | Fetch latest AI health analysis \& baseline comparison | Authenticated |
| `POST` | `/api/ai/chat` | Send prompt to Grounded AI Health Assistant (with NASA Space Weather context) | Authenticated |
| `GET` | `/api/ai/chat/history` | Retrieve conversational message history | Authenticated |

### Medical Operations & Telemedicine (`/api/medical` & `/api/medical-communication`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/medical/cohort` | Fetch flight surgeon's assigned crew members and triage status | Medical Officer |
| `POST` | `/api/medical/recommendation` | Issue 24h pharmaceutical or countermeasure recommendation | Medical Officer |
| `POST` | `/api/medical/report` | Generate and archive formal clinical consultation report | Medical Officer |
| `GET` | `/api/medical-communication/peers` | Get authorized calling peers (Astronaut <-> Doctor only) | Authenticated |
| `POST` | `/api/medical-communication/calls` | Log telemedicine call initiation / termination | Authenticated |

### Mission Control Operations (`/api/mission-control`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/mission-control/dashboard`| Fetch fleet health summary, crew status, and alerts | Mission Control |
| `POST` | `/api/mission-control/assign-doctor` | Assign astronaut to designated flight surgeon | Mission Control |
| `POST` | `/api/mission-control/assign-mission`| Assign crew member to mission | Mission Control |
| `POST` | `/api/mission-control/registration-gate` | Open or lock crew self-registration window | Mission Control |

---

## 🔬 Machine Learning & Edge Diagnostic Models

### 1. Multi-Variate Isolation Forest Anomaly Detection
- **Algorithm:** Unsupervised ensemble tree model (`scikit-learn.ensemble.IsolationForest`)
- **Telemetry Features Analyzed:**
  - Heart Rate ($\text{BPM}$)
  - Blood Oxygen Saturation ($\text{SpO}_2\%$)
  - Core Body Temperature ($^\circ\text{C}$)
  - Sleep Duration ($\text{Hours}$)
  - Activity / Exercise Intensity ($\%$)
  - Space Radiation Exposure ($\text{mSv}$)
- **Output:** Anomaly flag (`true`/`false`), Normalized Anomaly Score ($0-100$), Confidence Rating ($\%$), and feature contributor weights.

### 2. Acoustic Biomarker Voice Sentiment Engine
- **Algorithm:** Spectral & Cepstral Feature Extraction via `librosa`
- **Biomarkers Extracted:**
  - **Fundamental Frequency ($F_0$):** Measures vocal fold tension and emotional arousal.
  - **Spectral Centroid:** Represents vocal brightness and physical exertion fatigue.
  - **13-Coefficient MFCCs:** Captures vocal tract distortion reflecting cognitive overload.
- **Classification:** Automatically assigns a **Stress Perturbation Score** and categorizes mental wellness into **Nominal**, **Moderate Fatigue**, or **Elevated Isolation Stress**, recommending targeted interventions (e.g., Earth VR nature immersion).

### 3. Predictive Countermeasure Prescription
- **Formula:** Computes target cycle wattage and ARED resistance load based on bio-impedance ($\Omega$) and real-time fatigue indexes.
- **Output:** EVA (Extravehicular Activity) spacewalk clearance status and personalized restorative exercise protocols.

---

## 📡 Real-Time Communication & Telemedicine Protocol

### Strict Role Separation
To protect clinical confidentiality and mimic NASA flight protocols:
- **Audio/Video Calls & Clinical Chat:** Restricted strictly between **Astronauts** and their **assigned Flight Surgeons**.
- Mission Controllers receive telemetry alerts and mission directives, but private medical consultations remain strictly peer-to-peer between doctor and patient.

### WebSockets Signaling Flow (`socket.ts`)
```
Astronaut Client                        Socket.IO Server                    Doctor Client
       │                                       │                                  │
       ├──────── call:initiate (callId) ───────►                                  │
       │                                       ├──────── call:incoming ───────────►
       │                                       │                                  │
       │                                       ◄──────── call:accept ─────────────┤
       ◄─────── call:accepted ─────────────────┤                                  │
       │                                       │                                  │
       ├──────── webrtc:offer ─────────────────►                                  │
       │                                       ├──────── webrtc:offer ────────────►
       │                                       │                                  │
       │                                       ◄──────── webrtc:answer ───────────┤
       ◄─────── webrtc:answer ─────────────────┤                                  │
       │                                       │                                  │
       ├──────── webrtc:ice-candidate ─────────►──────── webrtc:ice-candidate ────►
       │                                       │                                  │
       ▲══════════════════════ Encrypted P2P Media Stream ════════════════════════▲
```

---

## 🛡️ Security, Privacy & Clinical Guardrails

1. **Authentication:**
   - Stateless JWT authentication with short-lived Access Tokens (15 min) and Refresh Tokens (7 days).
   - Stored exclusively in `HttpOnly`, `SameSite=None`, `Secure` cookies to defend against Cross-Site Scripting (XSS).
2. **Network Defenses:**
   - `Helmet` HTTP security headers.
   - Strict CORS origin whitelisting supporting local development and production Vercel/Render origins.
   - IP-based rate limiting (1000 requests per 15-minute window).
3. **Medical Safety Guardrails:**
   - Grounded AI assistant is explicitly constrained against issuing absolute medical diagnoses.
   - All AI insights are categorized as **Clinical Decision Support**.
   - If severe biometric anomalies are detected, the system advises standard recovery protocols and prompts consultation with the Flight Surgeon.

---

## 👥 Contributing & Team

Developed for the **NASA Space Apps Challenge** by the **AstroGuard Team**:
- **Repository:** [RaghuRam-25/AstroGuard](https://github.com/RaghuRam-25/AstroGuard)
- **Challenge Category:** Astronaut Health Monitoring & Deep Space Mission Autonomy

Pull requests, issues, and feature proposals are welcome. For major architectural changes, please open an issue first to discuss your proposed updates.

---

<p align="center">
  <b>AstroGuard</b> — Safeguarding the human pioneers of deep-space exploration. 🚀🌌
</p>
