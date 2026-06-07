// speak-buddi/src/features/admin/services/adminCrawlerService.js
// ─── Admin Crawler API service (S9.3 + S9.4) ────────────────────────────────

import { apiClient } from "../../../shared/api/client";

export function getSyncStatus() {
  return apiClient("/api/admin/crawler/sync-status");
}

export function getCrawlerConfig() {
  return apiClient("/api/admin/crawler/config");
}

export function updateCrawlerConfig(payload) {
  return apiClient("/api/admin/crawler/config", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listCrawlJobs({ limit = 20, offset = 0 } = {}) {
  const qs = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return apiClient(`/api/admin/crawler/jobs?${qs.toString()}`);
}

export function getCrawlJob(id) {
  return apiClient(`/api/admin/crawler/jobs/${id}`);
}

export function getJobLogs(id) {
  return apiClient(`/api/admin/crawler/jobs/${id}/logs`);
}

export function retryJob(id) {
  return apiClient(`/api/admin/crawler/jobs/${id}/retry`, {
    method: "POST",
  });
}

export function runCrawl({
  dryRun = false,
  levelCode = null,
  useFixture = null,
  simulateFail = false,
} = {}) {
  return apiClient("/api/admin/crawler/jobs/run", {
    method: "POST",
    body: JSON.stringify({
      dry_run: dryRun,
      level_code: levelCode || null,
      use_fixture: useFixture,
      simulate_fail: simulateFail,
    }),
  });
}
