// speak-buddi/src/features/admin/payment-plans/services/paymentPlanService.js
// ─── Admin Payment Plan API (S10.1) ─────────────────────────────────────────

import apiClient from "../../../../shared/api/client";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

async function apiDelete(endpoint) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "DELETE",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Something went wrong");
  }
}

export async function listPlans(includeInactive = true) {
  const q = includeInactive ? "" : "?include_inactive=false";
  return apiClient(`/api/admin/payment-plans${q}`);
}

export async function getPlan(id) {
  return apiClient(`/api/admin/payment-plans/${id}`);
}

export async function createPlan(data) {
  return apiClient("/api/admin/payment-plans", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updatePlan(id, data) {
  return apiClient(`/api/admin/payment-plans/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** Soft-delete gói (S10.2 — AC-14-03). */
export async function disablePlan(id) {
  return apiDelete(`/api/admin/payment-plans/${id}`);
}
