import axios from "axios";

const envApiBase = (import.meta.env.VITE_API_BASE_URL || "").trim();
const FALLBACK_BASE = "https://housekeeping-backend.sagartmt.com/api";

// Resolve API base; prefer env, else fallback to production HTTPS backend.
const resolveApiBase = () => {
  const isBrowser = typeof window !== "undefined";
  const isHttpsPage = isBrowser && window.location?.protocol === "https:";

  let base = envApiBase || FALLBACK_BASE;
  base = base.replace(/\/+$/, "");

  // Auto-upgrade to https if somehow an http URL is provided while on https page.
  if (isHttpsPage && base.startsWith("http://")) {
    base = base.replace(/^http:\/\//, "https://");
  }

  return base;
};

export const API_BASE_URL = resolveApiBase();
const REQUEST_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT_MS || 120000);

const getStoredToken = () => {
  return (
    sessionStorage.getItem("token") ||
    localStorage.getItem("token") ||
    (import.meta.env.VITE_API_BEARER_TOKEN || "").trim()
  );
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: REQUEST_TIMEOUT
});

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export default api;
