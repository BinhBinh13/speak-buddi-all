// speak-buddi/src/features/admin/payment-plans/services/paymentPlanService.js
// ─── Admin Payment Plan API (S10.1) ─────────────────────────────────────────

import apiClient from "../../../../shared/api/client";
import { authenticatedFetch } from "../../../../shared/api/authMiddleware";

async function apiDelete(endpoint) {
  const res = await authenticatedFetch(endpoint, { method: "DELETE" });
  if (!res) return;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Something went wrong");
  }
}

export async function listPlans({
  includeInactive = true,
  status,
  limit = 20,
  offset = 0,
} = {}) {
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  else if (!includeInactive) qs.set("include_inactive", "false");
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));
  return apiClient(`/api/admin/payment-plans?${qs.toString()}`);
}

/** Lấy toàn bộ gói cho dropdown (báo cáo, filter). BE giới hạn limit ≤ 100/request. */
export async function listPlansAll({ includeInactive = true } = {}) {
  const PAGE = 100;
  const status = includeInactive ? "all" : "active";
  const items = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const res = await listPlans({ includeInactive, status, limit: PAGE, offset });
    const batch = res.items ?? [];
    items.push(...batch);
    total = res.total ?? items.length;
    if (batch.length < PAGE) break;
    offset += PAGE;
  }

  return items;
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
