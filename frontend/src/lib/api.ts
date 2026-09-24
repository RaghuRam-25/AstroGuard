const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

// A production build must never silently send browser requests to localhost.
export const API_BASE_URL =
  configuredApiUrl || (process.env.NODE_ENV === "development" ? "http://localhost:5000" : "");

// ─────────────────────────────────────────────────────────
//  Token storage helpers (supports cross-site Vercel to Render auth)
// ─────────────────────────────────────────────────────────
const ACCESS_TOKEN_KEY = "astroguard_access_token";
const REFRESH_TOKEN_KEY = "astroguard_refresh_token";

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredTokens(accessToken?: string, refreshToken?: string) {
  if (typeof window === "undefined") return;
  try {
    if (accessToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  } catch {}
}

export function clearStoredTokens() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {}
}

// ─────────────────────────────────────────────────────────
//  Token refresh coordination
//
//  Multiple components fire protected requests at the same
//  time. Each 401 would otherwise trigger its own refresh,
//  flooding /api/auth/refresh. We single-flight concurrent
//  refreshes and add a short cooldown after a *failed* refresh
//  so the endpoint is not hammered repeatedly (the exact
//  "POST /api/auth/refresh -> 401" storm seen in production).
// ─────────────────────────────────────────────────────────
let refreshInFlight: Promise<boolean> | null = null;
let lastRefreshFailedAt = 0;
const REFRESH_COOLDOWN_MS = 10_000;

export async function refreshAccessToken(): Promise<boolean> {
  if (Date.now() - lastRefreshFailedAt < REFRESH_COOLDOWN_MS) {
    return false;
  }
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const storedRefresh = getStoredRefreshToken();
    const res = await apiRequest<{ user?: unknown; accessToken?: string; refreshToken?: string }>(
      "/api/auth/refresh",
      {
        method: "POST",
        body: JSON.stringify({ refreshToken: storedRefresh }),
        headers: storedRefresh ? { "x-refresh-token": storedRefresh } : {},
      },
      false
    );

    const ok = res.success && Boolean(res.data?.accessToken);
    if (ok && res.data?.accessToken) {
      setStoredTokens(res.data.accessToken, res.data.refreshToken);
      lastRefreshFailedAt = 0;
    } else {
      lastRefreshFailedAt = Date.now();
    }
    return ok;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/** Call after a successful login (or logout) so a fresh session can refresh again. */
export function resetRefreshGate() {
  lastRefreshFailedAt = 0;
  refreshInFlight = null;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
  status?: number;
}

// ─────────────────────────────────────────────────────────
//  Core request helper
// ─────────────────────────────────────────────────────────

export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  retryOnAuthFailure = true
): Promise<ApiResponse<T>> {
  if (!API_BASE_URL && endpoint.startsWith("/")) {
    return {
      success: false,
      status: 0,
      message: "API configuration is missing. Set NEXT_PUBLIC_API_URL in the deployment environment.",
    };
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const token = getStoredAccessToken();
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...authHeader,
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: "include", // Required for HTTP-only cookies
    });

    const data: ApiResponse<T> = await res.json();

    if (
      res.status === 401 &&
      retryOnAuthFailure &&
      endpoint !== "/api/auth/login" &&
      endpoint !== "/api/auth/refresh" &&
      endpoint !== "/api/auth/logout"
    ) {
      if (await refreshAccessToken()) {
        return apiRequest<T>(endpoint, options, false);
      }
    }

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        message:
          data.message ||
          (res.status === 401
            ? "Authentication required. Please log in."
            : res.status === 403
            ? "Access denied. Insufficient permissions."
            : res.status === 404
            ? "Resource not found."
            : `Request failed with status ${res.status}`),
        errors: data.errors,
      };
    }

    return { ...data, status: res.status };
  } catch (error: unknown) {
    return {
      success: false,
      status: 0,
      message:
        error instanceof Error && error.message
          ? error.message
          : "Network connection error. Is the backend server running?",
    };
  }
}

// ─────────────────────────────────────────────────────────
//  Auth
// ─────────────────────────────────────────────────────────

export const login = async (loginId: string, password: string) => {
  const res = await apiRequest<{ user: unknown; accessToken?: string; refreshToken?: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: loginId, password }),
  });
  if (res.success && res.data?.accessToken) {
    setStoredTokens(res.data.accessToken, res.data.refreshToken);
    resetRefreshGate();
  }
  return res;
};

export const registerAstronaut = async (data: {
  name: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  country: string;
  gender?: "female" | "male" | "non_binary" | "prefer_not_to_say";
  astronautId?: string;
  nasaBadgeId?: string;
  profileImage?: string;
  agreeToTerms: boolean;
}) => {
  const res = await apiRequest<{ user: unknown; accessToken?: string; refreshToken?: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (res.success && res.data?.accessToken) {
    setStoredTokens(res.data.accessToken, res.data.refreshToken);
    resetRefreshGate();
  }
  return res;
};

export const logout = async () => {
  clearStoredTokens();
  resetRefreshGate();
  return apiRequest("/api/auth/logout", { method: "POST" });
};

export const getCurrentUser = () =>
  apiRequest("/api/auth/me");

export const refreshToken = () =>
  refreshAccessToken();

// ─────────────────────────────────────────────────────────
//  Astronaut — Personal (own data only)
// ─────────────────────────────────────────────────────────

export const getAstronautDashboard = (astronautId: string) =>
  apiRequest(`/api/astronauts/${astronautId}`);

export const getMyHealth = (astronautId: string, params?: { limit?: number; page?: number }) => {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.page) q.set("page", String(params.page));
  return apiRequest(`/api/health/${astronautId}?${q}`);
};

export const getMyLatestHealth = (astronautId: string) =>
  apiRequest(`/api/health/${astronautId}/latest`);

export const getMyAnalysis = (astronautId: string) =>
  apiRequest(`/api/analysis/${astronautId}/latest`);

export const getMyAnalysisHistory = (astronautId: string) =>
  apiRequest(`/api/analysis/${astronautId}/history`);

export const getAlerts = () => apiRequest("/api/alerts");

export const resolveAlert = (id: number | string) =>
  apiRequest(`/api/alerts/${id}/resolve`, { method: "POST" });

export const submitHealthData = (data: {
  heartRate: number;
  spo2: number;
  sleep: number;
  activity: number;
  source?: string;
  ecg?: { rhythm?: string; arrhythmiaDetected?: boolean; qtIntervalMs?: number };
  bloodPressure?: { systolic?: number; diastolic?: number };
  coreTemperatureC?: number;
  respirationRate?: number;
  microgravityStressIndex?: number;
}) =>
  apiRequest("/api/health", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getDiagnosticOrders = (astronautId?: string) => apiRequest(`/api/clinical-operations/orders${astronautId ? `?astronautId=${encodeURIComponent(astronautId)}` : ""}`);
export const createDiagnosticOrder = (data: Record<string, unknown>) => apiRequest("/api/clinical-operations/orders", { method: "POST", body: JSON.stringify(data) });
export const updateDiagnosticOrder = (id: string, data: Record<string, unknown>) => apiRequest(`/api/clinical-operations/orders/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) });
export const getCountermeasures = (astronautId?: string) => apiRequest(`/api/clinical-operations/countermeasures${astronautId ? `?astronautId=${encodeURIComponent(astronautId)}` : ""}`);
export const createCountermeasure = (data: Record<string, unknown>) => apiRequest("/api/clinical-operations/countermeasures", { method: "POST", body: JSON.stringify(data) });
export const updateCountermeasure = (id: string, data: Record<string, unknown>) => apiRequest(`/api/clinical-operations/countermeasures/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) });

// ─────────────────────────────────────────────────────────
//  Medical Officer — Crew management
// ─────────────────────────────────────────────────────────

export const getMedicalCrew = (scope: "assigned" | "all" = "assigned") =>
  apiRequest(`/api/medical/crew?scope=${scope}`);

export const getMedicalCrewMember = (astronautId: string) =>
  apiRequest(`/api/medical/crew/${astronautId}`);

export const getAstronautHealth = (
  astronautId: string,
  params?: { limit?: number; page?: number }
) => {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.page) q.set("page", String(params.page));
  return apiRequest(`/api/medical/crew/${astronautId}/health?${q}`);
};

export const getAstronautAnalysis = (astronautId: string) =>
  apiRequest(`/api/medical/crew/${astronautId}/analysis`);

export const getAstronautAlerts = (astronautId: string) =>
  apiRequest(`/api/medical/crew/${astronautId}/alerts`);

export const getClinicalReviews = (astronautId: string) =>
  apiRequest(`/api/medical/crew/${astronautId}/reviews`);

export const submitClinicalReview = (astronautId: string, data: {
  riskLevel: "LOW" | "WATCH" | "WARNING" | "CRITICAL";
  clinicalDiagnosis: string;
  countermeasure: string;
  forwardedToAuthority: boolean;
  forwardReason?: string;
  recommendedAuthorityAction?: string;
}) => apiRequest(`/api/medical/crew/${astronautId}/reviews`, {
  method: "POST",
  body: JSON.stringify(data),
});

export const getAllMedicalAlerts = (scope: "assigned" | "all" = "assigned") =>
  apiRequest(`/api/medical/alerts?scope=${scope}`);

export const getMedicalConsultationReports = (doctorId: string) =>
  apiRequest(`/api/medical/reports/${encodeURIComponent(doctorId)}`);

export const updateMedicalConsultationReport = (reportId: string, data: { status?: "Unreviewed" | "Reviewed"; doctorNotes?: string; doctorDecision?: "Approved" | "Overridden" }) =>
  apiRequest(`/api/medical/reports/${encodeURIComponent(reportId)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const generateConsultationSummary = () =>
  apiRequest("/api/ai/generate-summary", { method: "POST" });

export const getMyNutritionPlan = () => apiRequest("/api/nutrition/me");
export const getMedicalNutritionPlans = (astronautId: string) => apiRequest(`/api/medical/prescriptions/${encodeURIComponent(astronautId)}`);
export const updateMedicalNutritionPlan = (planId: string, data: Record<string, unknown>) => apiRequest(`/api/medical/prescriptions/${encodeURIComponent(planId)}`, { method: "PATCH", body: JSON.stringify(data) });

export const getMedicalCommunicationPeers = () => apiRequest("/api/medical-communication/peers");
export const getMedicalCommunicationMessages = (peerId: string) => apiRequest(`/api/medical-communication/messages?peerId=${encodeURIComponent(peerId)}`);
export const sendMedicalCommunicationMessage = (data: Record<string, unknown>) => apiRequest("/api/medical-communication/messages", { method: "POST", body: JSON.stringify(data) });
export const markMedicalCommunicationRead = (peerId: string) => apiRequest("/api/medical-communication/messages/read", { method: "PATCH", body: JSON.stringify({ peerId }) });
export const getMedicalCommunicationCalls = (peerId: string) => apiRequest(`/api/medical-communication/calls?peerId=${encodeURIComponent(peerId)}`);
export const createMedicalCommunicationCall = (data: Record<string, unknown>) => apiRequest("/api/medical-communication/calls", { method: "POST", body: JSON.stringify(data) });

export const getMyAssignedAstronauts = () =>
  apiRequest("/api/medical/my-astronauts");

export const getAstronautRecommendations = (astronautId: string) =>
  apiRequest(`/api/medical/crew/${encodeURIComponent(astronautId)}/recommendations`);

export const sendMedicalRecommendation = (data: {
  astronautId: string;
  message: string;
  source?: "AI" | "Doctor";
  tone?: "calm" | "preventive" | "urgent";
  approvedByDoctor?: string;
}) =>
  apiRequest("/api/medical/recommendations", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getMyRecommendations = () =>
  apiRequest("/api/astronauts/me/recommendations");

export const markMyRecommendationRead = (id: string) =>
  apiRequest(`/api/astronauts/me/recommendations/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
  });

// ─────────────────────────────────────────────────────────
//  Mission Control
// ─────────────────────────────────────────────────────────

export const getAssignedMissions = () =>
  apiRequest("/api/mission-control/missions");

export const getMissionOverview = (missionId: string) =>
  apiRequest(`/api/mission-control/${encodeURIComponent(missionId)}/overview`);

export const getMissionCrew = (missionId: string) =>
  apiRequest(`/api/mission-control/${encodeURIComponent(missionId)}/crew`);

export const getMissionAlerts = (missionId: string) =>
  apiRequest(`/api/mission-control/${encodeURIComponent(missionId)}/alerts`);

export const getMissionControlDashboard = () =>
  apiRequest("/api/v1/mission-control/dashboard");

export const assignMissionControlDoctor = (astronautId: string, doctorId: string) =>
  apiRequest("/api/v1/mission-control/assign-doctor", {
    method: "POST",
    body: JSON.stringify({ astronautId, doctorId }),
  });

export const createMission = (data: {
  name: string;
  missionId?: string;
  status?: "Active" | "Completed" | "Planned" | "Aborted";
  missionDay?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  astronautIds?: string[];
  medicalOfficerIds?: string[];
}) =>
  apiRequest("/api/v1/missions", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const assignMissionControlMission = (astronautId: string, missionId: string) =>
  apiRequest("/api/v1/mission-control/assign-mission", {
    method: "POST",
    body: JSON.stringify({ astronautId, missionId }),
  });

export const getAuthorityDirectives = () => apiRequest("/api/mission-control/directives");
export const issueAuthorityDirective = (data: { astronautId: string; directiveType: string; orders: string }) => apiRequest("/api/mission-control/directives", { method: "POST", body: JSON.stringify(data) });
export const updateAuthorityDirective = (id: string, status: string) => apiRequest(`/api/mission-control/directives/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });

// ─────────────────────────────────────────────────────────
//  Mission Control — Crew Directory & System Governance
// ─────────────────────────────────────────────────────────

export interface CrewMember {
  userId: string;
  crewId: string;
  name: string;
  email: string;
  role: "astronaut" | "medical_officer";
  avatar: string;
  assigned: string;
  accountStatus: "Active" | "Banned";
  online: boolean;
  status: string;
  missionIds: string[];
  assignedAstronautIds: string[];
  createdAt?: string;
}

export interface RegistrationStatus {
  isRegistrationOpen: boolean;
  registrationExpiresAt: number | null;
  expiresInMs?: number;
  durationMinutes?: number;
}

/** Public registration gate — read by Navbar / register page. */
export const getRegistrationStatus = () => apiRequest<RegistrationStatus>("/api/v1/public/registration-status");

/** Mission Control: current registration window state. */
export const getMissionControlRegistration = () =>
  apiRequest<RegistrationStatus>("/api/v1/mission-control/registration");

/** Mission Control: open a time-limited registration window (minutes 1..1440). */
export const startRegistrationWindow = (durationMinutes: number) =>
  apiRequest<RegistrationStatus>("/api/v1/mission-control/registration/start", {
    method: "POST",
    body: JSON.stringify({ durationMinutes }),
  });

/** Mission Control: immediately close the registration window. */
export const closeRegistrationWindow = () =>
  apiRequest<RegistrationStatus>("/api/v1/mission-control/registration/close", { method: "POST" });

/** Mission Control: persist the public registration gate (isOpen + durationMinutes). */
export const toggleMissionControlRegistration = (isOpen: boolean, durationMinutes: number) =>
  apiRequest<RegistrationStatus>("/api/v1/mission-control/registration-toggle", {
    method: "POST",
    body: JSON.stringify({ isOpen, durationMinutes }),
  });

/** Mission Control: unified astronauts + medical officers directory. */
export const getMissionControlCrew = () =>
  apiRequest<{ crew: CrewMember[]; total: number }>("/api/v1/mission-control/crew");

/** Mission Control: revoke access / delete a crew account. */
export const deleteMissionControlUser = (userId: string) =>
  apiRequest(`/api/v1/users/${encodeURIComponent(userId)}`, { method: "DELETE" });

export const toggleRegistrationWindow = (isRegistrationOpen: boolean, durationMinutes?: number) =>
  apiRequest<RegistrationStatus>("/api/v1/admin/registration-toggle", {
    method: "POST",
    body: JSON.stringify({ isRegistrationOpen, durationMinutes }),
  });

// ─────────────────────────────────────────────────────────
//  Nutrition — Zero-Manual-Entry HUD & AI Prescriptions
// ─────────────────────────────────────────────────────────

export const getNutritionIntake = () => apiRequest("/api/nutrition/intake");

export const scanMealPack = (packId: string) =>
  apiRequest("/api/nutrition/scan-meal", {
    method: "POST",
    body: JSON.stringify({ packId }),
  });

export const getNutritionPrescription = (astronautId?: string) =>
  apiRequest(astronautId ? `/api/nutrition/prescription/${encodeURIComponent(astronautId)}` : "/api/nutrition/prescription");

// ─────────────────────────────────────────────────────────
//  IoT Live Telemetry
// ─────────────────────────────────────────────────────────

export const ingestTelemetry = (payload: Record<string, unknown>) =>
  apiRequest("/api/telemetry/ingest", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getLatestTelemetry = (astronautId?: string) =>
  apiRequest(astronautId ? `/api/telemetry/latest/${encodeURIComponent(astronautId)}` : "/api/telemetry/latest");

// ─────────────────────────────────────────────────────────
//  AI Analysis & Health Queries
// ─────────────────────────────────────────────────────────

export const postAnalysis = (payload: Record<string, unknown>) =>
  apiRequest("/api/analysis", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const postAnalysisChat = (payload: Record<string, unknown>) =>
  apiRequest("/api/analysis/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getAnalysisChatHistory = (limit = 80) =>
  apiRequest(`/api/analysis/chat/history?limit=${limit}`);

export async function postAnalysisVoice(payload: FormData): Promise<ApiResponse<unknown>> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/analysis/voice`, {
      method: "POST",
      body: payload,
      credentials: "include",
    });
    const data = (await res.json()) as ApiResponse<unknown>;
    return { ...data, status: res.status };
  } catch (error: unknown) {
    return {
      success: false,
      status: 0,
      message:
        error instanceof Error && error.message
          ? error.message
          : "Network connection error. Is the backend server running?",
    };
  }
}

export const getLatestAnalysis = (astronautId: string) =>
  apiRequest(`/api/analysis/${encodeURIComponent(astronautId)}/latest`);

export const getLatestHealth = (astronautId: string) =>
  apiRequest(`/api/health/${encodeURIComponent(astronautId)}/latest`);

export const getAnalysisHistory = (astronautId: string) =>
  apiRequest(`/api/analysis/${encodeURIComponent(astronautId)}/history`);

// Emergency SOS + astronaut bio-sample workflows
export const sendEmergencySOS = (reason: "Extreme Dizziness" | "Acute Pain" | "Breathing Issue" | "Disorientation") =>
  apiRequest("/api/alerts/emergency", { method: "POST", body: JSON.stringify({ reason }) });

export const submitBioSample = (data: Record<string, unknown>) =>
  apiRequest("/api/astronauts/me/bio-samples", { method: "POST", body: JSON.stringify(data) });

export const getLatestBioSample = () => apiRequest("/api/astronauts/me/bio-samples/latest");
export const getBioSampleHistory = () => apiRequest("/api/astronauts/me/bio-samples");

export const getMedicalAllocations = (missionId?: string) =>
  apiRequest(`/api/mission-control/medical-allocations${missionId ? `?missionId=${encodeURIComponent(missionId)}` : ""}`);

export const updateMedicalAllocation = (medicalOfficerId: string, data: { missionId?: string; astronautIds: string[] }) =>
  apiRequest(`/api/mission-control/medical-allocations/${medicalOfficerId}`, { method: "PUT", body: JSON.stringify(data) });


