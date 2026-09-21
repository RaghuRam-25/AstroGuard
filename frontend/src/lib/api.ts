export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
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
      const refreshRes = await apiRequest("/api/auth/refresh", { method: "POST" }, false);
      if (refreshRes.success) {
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

export const login = (loginId: string, password: string) =>
  apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: loginId, password }),
  });

export const registerAstronaut = (data: {
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
  profileImage?: string;
  agreeToTerms: boolean;
}) =>
  apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const logout = () =>
  apiRequest("/api/auth/logout", { method: "POST" });

export const getCurrentUser = () =>
  apiRequest("/api/auth/me");

export const refreshToken = () =>
  apiRequest("/api/auth/refresh", { method: "POST" });

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

export const getMyAlerts = (astronautId: string) =>
  apiRequest(`/api/alerts/${astronautId}`);

export const getAlerts = () => apiRequest("/api/alerts");

export const markAlertRead = (id: number | string) =>
  apiRequest(`/api/alerts/${id}/read`, { method: "PATCH" });

export const resolveAlert = (id: number | string) =>
  apiRequest(`/api/alerts/${id}/resolve`, { method: "POST" });

export const submitHealthData = (data: {
  heartRate: number;
  spo2: number;
  sleep: number;
  activity: number;
  source?: string;
}) =>
  apiRequest("/api/health", {
    method: "POST",
    body: JSON.stringify(data),
  });

// ─────────────────────────────────────────────────────────
//  Medical Officer — Crew management
// ─────────────────────────────────────────────────────────

export const getMedicalCrew = () =>
  apiRequest("/api/medical/crew");

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

export const getAllMedicalAlerts = () =>
  apiRequest("/api/medical/alerts");

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

export const getMissionAnalytics = (missionId: string) =>
  apiRequest(`/api/mission-control/${encodeURIComponent(missionId)}/analytics`);

// ─────────────────────────────────────────────────────────
//  Admin
// ─────────────────────────────────────────────────────────

export const getAdminUsers = (params?: {
  role?: string;
  isActive?: boolean;
  search?: string;
}) => {
  const q = new URLSearchParams();
  if (params?.role) q.set("role", params.role);
  if (params?.isActive !== undefined) q.set("isActive", String(params.isActive));
  if (params?.search) q.set("search", params.search);
  return apiRequest(`/api/admin/users?${q}`);
};

export const createAdminUser = (data: {
  name: string;
  email: string;
  password: string;
  role: string;
  astronautId?: string;
  assignedAstronautIds?: string[];
  missionIds?: string[];
}) =>
  apiRequest("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateAdminUser = (id: string, data: Record<string, unknown>) =>
  apiRequest(`/api/admin/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const updateUserStatus = (id: string, isActive: boolean) =>
  apiRequest(`/api/admin/users/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });

export const updateUserRole = (id: string, role: string) =>
  apiRequest(`/api/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });

export const getAdminMissions = () =>
  apiRequest("/api/admin/missions");

export const createAdminMission = (data: Record<string, unknown>) =>
  apiRequest("/api/admin/missions", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateAdminMission = (id: string, data: Record<string, unknown>) =>
  apiRequest(`/api/admin/missions/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const assignAstronautToMission = (missionId: string, astronautId: string) =>
  apiRequest(`/api/admin/missions/${missionId}/assign-astronaut`, {
    method: "POST",
    body: JSON.stringify({ astronautId }),
  });

export const getAuditLogs = (params?: { limit?: number; page?: number; action?: string }) => {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.page) q.set("page", String(params.page));
  if (params?.action) q.set("action", params.action);
  return apiRequest(`/api/admin/audit-logs?${q}`);
};

export const getSystemStatus = () =>
  apiRequest("/api/admin/system-status");

// ─────────────────────────────────────────────────────────
//  AI Analysis — astronaut assistant
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

export const getAnalysisHistory = (astronautId: string) =>
  apiRequest(`/api/analysis/${encodeURIComponent(astronautId)}/history`);
