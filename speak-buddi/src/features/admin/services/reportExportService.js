// speak-buddi/src/features/admin/services/reportExportService.js
// ─── Service export báo cáo admin (S11.3 — AC-12-03) ────────────────────────

import apiClient from "../../../shared/api/client";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

/**
 * POST export — trả blob file (không dùng apiClient JSON).
 * @param {{
 *   report_type: "revenue"|"users"|"learning"|"ai_usage",
 *   export_format: "xlsx"|"pdf",
 *   from: string,
 *   to: string,
 *   plan_id?: string,
 *   granularity?: string,
 * }} payload
 */
export async function exportReport(payload) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/api/admin/analytics/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : "Không thể xuất báo cáo."
    );
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";\n]+)"?/);
  const fileName = match ? match[1] : `speakbuddi-export.${payload.export_format}`;
  return { blob, fileName };
}

/**
 * @param {{ limit?: number, offset?: number }} [params]
 */
export async function listExportHistory(params = {}) {
  const qs = new URLSearchParams();
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.offset != null) qs.set("offset", String(params.offset));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return apiClient(`/api/admin/analytics/exports${suffix}`);
}

/** Trigger download blob trong trình duyệt. */
export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
