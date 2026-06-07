// speak-buddi/src/features/admin/services/adminContentService.js
// ─── Admin Content API service (S9.1) ─────────────────────────────────────────
// Pattern: bám quizService.js — import apiClient, export async functions.

import apiClient from "../../../shared/api/client";

const API_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:8000";

/** PATCH helper — BE trả 200/204 (S9.5 re-enable). */
async function apiPatch(endpoint) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "PATCH",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.message || "Something went wrong");
  }
  if (res.status === 204) return null;
  return res.json();
}

/** DELETE helper — BE trả 204 No Content (S9.2 soft delete). */
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

// ── Levels ───────────────────────────────────────────────────────────────────

export async function listLevels() {
  return apiClient("/api/admin/levels");
}

// ── Topics ───────────────────────────────────────────────────────────────────

export async function listTopics({ search, levelId, includeInactive = false } = {}) {
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (levelId) qs.set("level_id", levelId);
  if (includeInactive) qs.set("include_inactive", "true");
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiClient(`/api/admin/topics${query}`);
}

export async function getTopic(id) {
  return apiClient(`/api/admin/topics/${id}`);
}

export async function createTopic(body) {
  return apiClient("/api/admin/topics", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateTopic(id, body) {
  return apiClient(`/api/admin/topics/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function disableTopic(id) {
  return apiDelete(`/api/admin/topics/${id}`);
}

export async function enableTopic(id) {
  return apiPatch(`/api/admin/topics/${id}/enable`);
}

// ── Words ────────────────────────────────────────────────────────────────────

export async function listWords({
  search,
  topicId,
  levelId,
  includeInactive = false,
  limit = 20,
  offset = 0,
} = {}) {
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (topicId) qs.set("topic_id", topicId);
  if (levelId) qs.set("level_id", levelId);
  if (includeInactive) qs.set("include_inactive", "true");
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));
  return apiClient(`/api/admin/words?${qs.toString()}`);
}

export async function getWord(id) {
  return apiClient(`/api/admin/words/${id}`);
}

export async function createWord(body) {
  return apiClient("/api/admin/words", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateWord(id, body) {
  return apiClient(`/api/admin/words/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function disableWord(id) {
  return apiDelete(`/api/admin/words/${id}`);
}

export async function enableWord(id) {
  return apiPatch(`/api/admin/words/${id}/enable`);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

export async function listTests({ search, topicId, levelId, includeInactive = true } = {}) {
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (topicId) qs.set("topic_id", topicId);
  if (levelId) qs.set("level_id", levelId);
  if (!includeInactive) qs.set("include_inactive", "false");
  const query = qs.toString() ? `?${qs.toString()}` : "";
  return apiClient(`/api/admin/tests${query}`);
}

export async function getTestEditor(id) {
  return apiClient(`/api/admin/tests/${id}`);
}

export async function createTest(body) {
  return apiClient("/api/admin/tests", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateTest(id, body) {
  return apiClient(`/api/admin/tests/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function disableTest(id) {
  return apiDelete(`/api/admin/tests/${id}`);
}

export async function enableTest(id) {
  return apiPatch(`/api/admin/tests/${id}/enable`);
}
