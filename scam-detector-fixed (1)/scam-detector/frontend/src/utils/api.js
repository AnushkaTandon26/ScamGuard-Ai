// Centralized API layer for all backend calls
import axios from "axios";

// In local development, let CRA proxy `/api/*` requests to the backend.
// If REACT_APP_API_URL is set, we still honor it for deployed environments.
const BASE_URL = process.env.REACT_APP_API_URL || "";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally → redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register:       (data) => api.post("/api/auth/register", data),
  login:          (data) => api.post("/api/auth/login", data),
  getProfile:     ()     => api.get("/api/auth/me"),
  updateProfile:  (data) => api.put("/api/auth/me", data),
  changePassword: (data) => api.post("/api/auth/change-password", data),
};

// ─── Detection ────────────────────────────────────────────────────────────────
export const detectionAPI = {
  uploadFile: (formData, onProgress) =>
    api.post("/api/detection/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded * 100) / e.total)),
    }),
  sendLiveChunk: (formData) =>
    api.post("/api/detection/live", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getDetection: (id) => api.get(`/api/detection/${id}`),
};

// ─── History ──────────────────────────────────────────────────────────────────
export const historyAPI = {
  getHistory:   (page = 1, limit = 10, filter = "all") =>
    api.get(`/api/history/?page=${page}&limit=${limit}&filter=${filter}`),
  getAnalytics: () => api.get("/api/history/analytics"),
  deleteOne:    (id) => api.delete(`/api/history/${id}`),
  clearAll:     () => api.delete("/api/history/"),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsAPI = {
  downloadPDF: async (detectionId) => {
    const res = await api.get(`/api/reports/pdf/${detectionId}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a   = document.createElement("a");
    a.href    = url;
    a.download = `scam_report_${detectionId.slice(0, 8)}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats:      () => api.get("/api/admin/stats"),
  getUsers:      (page = 1) => api.get(`/api/admin/users?page=${page}`),
  deleteUser:    (id) => api.delete(`/api/admin/users/${id}`),
  changeRole:    (id, role) => api.put(`/api/admin/users/${id}/role`, { role }),
  getDetections: (page = 1) => api.get(`/api/admin/detections?page=${page}`),
};

// ─── WebSocket helper ─────────────────────────────────────────────────────────
export const getWsUrl = () => {
  const token = localStorage.getItem("token");
  // Always point directly at the backend port (8000), not the React dev server (3000).
  // CRA proxy does NOT forward WebSocket connections.
  const backendHost = process.env.REACT_APP_API_URL || "http://localhost:8000";
  // http → ws,  https → wss  (single clean replacement)
  const wsBase = backendHost.replace(/^http/, "ws");
  return `${wsBase}/ws/live/${token}`;
};

export default api;
