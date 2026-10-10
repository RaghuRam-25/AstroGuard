# 🚀 AstroGuard Frontend

The modern, responsive web application for **AstroGuard** — built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **DaisyUI**, and **Framer Motion**.

> For the complete system architecture, backend APIs, and ML engine details, refer to the root [README.md](../README.md).

---

## 🌟 Key Modules & Portals

1. **Astronaut Portal (`/astronaut`)**:
   - `/astronaut/dashboard`: Live physiological telemetry monitoring (Heart Rate, $\text{SpO}_2$, Temperature, Blood Pressure).
   - `/astronaut/ai-analysis`: Context-grounded Conversational AI Assistant with voice recording and speech synthesis playback.
   - `/astronaut/diagnostic-suite`: Lab-on-a-Chip sample diagnostics & RFID nutritional food packet intake scanner.
   - `/astronaut/medical-consult`: Encrypted 1-on-1 audio/video telemedicine calling with assigned Flight Surgeon.

2. **Medical Officer Portal (`/medical`)**:
   - `/medical/dashboard`: Multi-crew clinical triage matrix, rapid health indexes, and risk categorization.
   - `/medical/ai-analysis`: Personal baseline vs. Mission cohort deviation analytics.
   - `/medical/medical-consult`: Direct telemedicine hub with incoming call modal and real-time WebRTC signaling.
   - `/medical/reports`: Formal clinical consultation reports and 24-hour pharmaceutical prescription issuance.

3. **Mission Control Portal (`/mission-control`)**:
   - `/mission-control/dashboard`: Fleet-wide readiness status, doctor/astronaut flight assignments, and dynamic registration window gate.

4. **Edge Cockpit (`/edge-cockpit`)**:
   - Autonomous offline cockpit interface featuring acoustic vocal biomarker stress scoring and exercise countermeasure prescriptions.

5. **Public Exploration Pages**:
   - `/`: Interactive landing page with dynamic Solar System canvas and Space Launch countdown simulator.
   - `/about`, `/mission`, `/sensors` (IoT hardware specs), `/astrocrew`, `/contact`.

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the `frontend` root:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Tech Stack
- **Framework:** Next.js 16.3.5
- **UI & State:** React 19.2.8
- **Styling:** Tailwind CSS v4, DaisyUI 5
- **Animations:** Framer Motion 13
- **Data Visualization:** Recharts 3.10
- **Real-Time Communications:** Socket.IO Client 4.8.3, WebRTC
- **Icons:** Lucide React
