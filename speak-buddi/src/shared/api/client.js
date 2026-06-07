import { authenticatedFetch } from "./authMiddleware";

/**
 * apiClient — JSON REST helper; 401/refresh do authMiddleware xử lý.
 * @param {string} endpoint
 * @param {RequestInit} [options]
 */
const apiClient = async (endpoint, options = {}) => {
  const res = await authenticatedFetch(endpoint, options);
  if (!res) return;

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const error = new Error(body.detail || body.message || "Something went wrong");
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;

  return res.json();
};

export default apiClient;
