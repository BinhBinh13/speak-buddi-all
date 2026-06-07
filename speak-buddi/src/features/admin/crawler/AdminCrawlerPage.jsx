// speak-buddi/src/features/admin/crawler/AdminCrawlerPage.jsx
// ─── Langeek Crawler Admin (S9.3) ────────────────────────────────────────────
// Mockup: speak-buddi-docs/ui/langeek_crawler_admin/code.html
// SRS: auto-publish — không có nút Commit/Discard

import { useCallback, useEffect, useState } from "react";
import { Button, Form, Modal, Spinner } from "react-bootstrap";
import { LuPlay, LuRefreshCw } from "react-icons/lu";
import AdminToast from "../components/AdminToast";
import {
  getCrawlJob,
  getSyncStatus,
  listCrawlJobs,
  retryJob,
  runCrawl,
} from "../services/adminCrawlerService";
import { COLORS, FONTS } from "../../../shared/constants/theme";

const LEVELS = [
  { value: "", label: "Tất cả level (A1–C2)" },
  { value: "A1", label: "A1 — Beginner" },
  { value: "A2", label: "A2 — Elementary" },
  { value: "B1", label: "B1 — Intermediate" },
  { value: "B2", label: "B2 — Upper Intermediate" },
  { value: "C1", label: "C1 — Advanced" },
  { value: "C2", label: "C2 — Proficiency" },
];

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN");
  } catch {
    return iso;
  }
}

function RetryBadge({ status, count, nextAt }) {
  if (!status || status === "none") return null;
  const labels = {
    scheduled: "Đã lên lịch retry",
    pending: "Đang retry",
    exhausted: "Hết lượt retry",
  };
  const bg = status === "exhausted" ? "#ffdad6" : "#fff8e1";
  const color = status === "exhausted" ? "#93000a" : "#7a5900";
  return (
    <span style={{ ...badgeStyle, background: bg, color }}>
      {labels[status] || status}
      {count > 0 ? ` (${count})` : ""}
      {nextAt && status === "scheduled" ? ` — ${formatDate(nextAt)}` : ""}
    </span>
  );
}

function StatusBadge({ status }) {
  const isSuccess = status === "success";
  const isFailed = status === "failed";
  const bg = isSuccess ? COLORS.emeraldBg : isFailed ? "#ffdad6" : COLORS.primaryBgLight;
  const color = isSuccess ? COLORS.emeraldDark : isFailed ? "#93000a" : COLORS.primary;
  const label = isSuccess ? "Thành công" : isFailed ? "Thất bại" : status || "—";
  return (
    <span style={{ ...badgeStyle, background: bg, color }}>
      {label}
    </span>
  );
}

export default function AdminCrawlerPage() {
  const [syncStatus, setSyncStatus] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [preview, setPreview] = useState(null);
  const [levelCode, setLevelCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  const showFailureBanner =
    syncStatus?.last_job_status === "failed" ||
    syncStatus?.retry_status === "scheduled" ||
    syncStatus?.retry_status === "exhausted";

  const failedJobId =
    syncStatus?.last_job_status === "failed" ? syncStatus?.last_job_id : null;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [status, jobList] = await Promise.all([
        getSyncStatus(),
        listCrawlJobs({ limit: 10 }),
      ]);
      setSyncStatus(status);
      setJobs(jobList.items || []);
      if (status?.last_job_id) {
        try {
          const detail = await getCrawlJob(status.last_job_id);
          setPreview(detail.preview_json || null);
        } catch {
          setPreview(null);
        }
      }
    } catch (err) {
      setToast({ type: "error", message: err.message || "Không tải được dữ liệu crawler." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(t);
  }, [loadData]);

  const handleRun = async () => {
    setShowConfirm(false);
    setRunning(true);
    try {
      const result = await runCrawl({
        levelCode: levelCode || null,
        useFixture: null,
      });
      setToast({
        type: result.status === "success" ? "success" : "error",
        message:
          result.status === "success"
            ? `Crawl hoàn tất — ${result.stats?.words_upserted ?? 0} từ đã publish.`
            : result.error_message || "Crawl thất bại.",
      });
      await loadData();
      if (result.id) {
        const detail = await getCrawlJob(result.id);
        setPreview(detail.preview_json || null);
      }
    } catch (err) {
      setToast({ type: "error", message: err.message || "Không chạy được crawler." });
    } finally {
      setRunning(false);
    }
  };

  const handleRetry = async (jobId) => {
    setRetryingId(jobId);
    try {
      const result = await retryJob(jobId);
      setToast({
        type: result.status === "success" ? "success" : "error",
        message:
          result.status === "success"
            ? "Retry thành công — nội dung đã được cập nhật."
            : result.error_message || "Retry vẫn thất bại.",
      });
      await loadData();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Không retry được job." });
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <>
      <style>{PAGE_CSS}</style>
      {toast && (
        <AdminToast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="crawler-page">
        <header className="crawler-header">
          <div>
            <h1 className="crawler-title">Công cụ Crawler nội dung</h1>
            <p className="crawler-subtitle">
              Thu thập và ánh xạ từ vựng Langeek vào cơ sở dữ liệu — tự động publish khi thành công.
            </p>
          </div>
          <Button
            variant="outline-primary"
            className="crawler-refresh-btn"
            onClick={loadData}
            disabled={loading || running}
          >
            <LuRefreshCw size={16} /> Làm mới
          </Button>
        </header>

        {showFailureBanner && (
          <div className="crawler-alert-banner" role="alert">
            <div className="crawler-alert-title">Crawler Langeek gặp sự cố</div>
            <p className="crawler-alert-body">
              {syncStatus?.last_failure_reason ||
                "Lần crawl gần nhất thất bại. Nội dung học viên vẫn dùng cache đang active."}
            </p>
            <div className="crawler-alert-meta">
              <span>
                Cache active:{" "}
                <strong>{syncStatus?.cache_active ? "Có" : "Không"}</strong>
                {syncStatus?.active_word_count != null
                  ? ` (${syncStatus.active_word_count} từ)`
                  : ""}
              </span>
              <span>Lần sync OK cuối: {formatDate(syncStatus?.last_success_at)}</span>
              <RetryBadge
                status={syncStatus?.retry_status}
                count={syncStatus?.retry_count}
                nextAt={syncStatus?.next_retry_at}
              />
            </div>
            {failedJobId && syncStatus?.retry_status !== "exhausted" && (
              <Button
                variant="outline-danger"
                size="sm"
                className="crawler-retry-btn"
                disabled={!!syncStatus?.running_job_id || retryingId === failedJobId}
                onClick={() => handleRetry(failedJobId)}
              >
                {retryingId === failedJobId ? (
                  <>
                    <Spinner animation="border" size="sm" /> Đang thử lại…
                  </>
                ) : (
                  "Thử lại ngay"
                )}
              </Button>
            )}
          </div>
        )}

        {loading && !syncStatus ? (
          <div className="crawler-loading">
            <Spinner animation="border" size="sm" /> Đang tải…
          </div>
        ) : (
          <div className="crawler-grid">
            <div className="crawler-col-left">
              <div className="crawler-card">
                <div className="crawler-card-head">
                  <span className="crawler-card-icon">🌐</span>
                  <h2>Chạy crawl mới</h2>
                </div>
                <p className="crawler-card-desc">
                  Nội dung crawl thành công sẽ được <strong>tự động publish</strong> (không cần duyệt).
                </p>
                <Form.Group className="mb-3">
                  <Form.Label className="crawler-label">Nguồn</Form.Label>
                  <Form.Control
                    readOnly
                    value="https://langeek.co/en-VI/vocab/level-based"
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label className="crawler-label">Lọc level</Form.Label>
                  <Form.Select
                    value={levelCode}
                    onChange={(e) => setLevelCode(e.target.value)}
                    disabled={running}
                  >
                    {LEVELS.map((l) => (
                      <option key={l.value || "all"} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Button
                  className="crawler-run-btn"
                  disabled={running || !!syncStatus?.running_job_id}
                  onClick={() => setShowConfirm(true)}
                >
                  {running ? (
                    <>
                      <Spinner animation="border" size="sm" /> Đang crawl…
                    </>
                  ) : (
                    <>
                      <LuPlay size={18} /> Bắt đầu crawler
                    </>
                  )}
                </Button>
                {syncStatus?.running_job_id && (
                  <p className="crawler-hint">Đang có job crawl chạy — vui lòng đợi.</p>
                )}
              </div>

              <div className="crawler-stats-card">
                <div className="crawler-stats-label">Tuần này đã nhập</div>
                <div className="crawler-stats-value">
                  {syncStatus?.words_upserted_this_week ?? 0}
                </div>
                <div className="crawler-stats-sub">từ vựng mới/cập nhật</div>
              </div>
            </div>

            <div className="crawler-col-right">
              <div className="crawler-preview-card">
                <div className="crawler-preview-head">
                  <span>Xem trước job gần nhất</span>
                  <StatusBadge status={syncStatus?.last_job_status} />
                </div>
                <pre className="crawler-preview-body">
                  {preview
                    ? JSON.stringify(preview, null, 2)
                    : "// Chưa có kết quả crawl — chạy crawler để xem preview."}
                </pre>
              </div>

              <div className="crawler-card">
                <h2 className="crawler-logs-title">Nhật ký crawl gần đây</h2>
                <div className="crawler-table-wrap">
                  <table className="crawler-table">
                    <thead>
                      <tr>
                        <th>Job / Trigger</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                        <th>Số từ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="crawler-empty">
                            Chưa có job nào.
                          </td>
                        </tr>
                      ) : (
                        jobs.map((job) => (
                          <tr key={job.id}>
                            <td>
                              <div className="crawler-job-name">
                                {job.trigger_type === "scheduled"
                                  ? "Lịch tuần"
                                  : job.trigger_type === "retry"
                                    ? "Retry tự động"
                                    : "Thủ công"}
                              </div>
                              <div className="crawler-job-id">{job.id.slice(0, 8)}…</div>
                            </td>
                            <td>{formatDate(job.started_at)}</td>
                            <td>
                              <StatusBadge status={job.status} />
                              {job.status === "failed" && job.retry_status !== "none" && (
                                <div className="crawler-retry-inline">
                                  <RetryBadge
                                    status={job.retry_status}
                                    count={job.retry_count}
                                    nextAt={job.next_retry_at}
                                  />
                                </div>
                              )}
                            </td>
                            <td>{job.stats?.words_upserted ?? "—"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận chạy crawler</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Crawl sẽ lấy dữ liệu từ Langeek và <strong>tự động publish</strong> vào hệ thống.
          Tiếp tục?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleRun}>
            Bắt đầu
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

const PAGE_CSS = `
  .crawler-page { font-family: ${FONTS.body}; color: ${COLORS.onSurface}; }
  .crawler-header {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 16px; margin-bottom: 24px;
  }
  .crawler-title { font-size: 32px; font-weight: 700; margin: 0 0 8px; }
  .crawler-subtitle { margin: 0; color: ${COLORS.onSurfaceVariant}; font-size: 18px; }
  .crawler-alert-banner {
    background: #ffdad6; border: 1px solid #ffb4ab; border-radius: 12px;
    padding: 16px 20px; margin-bottom: 20px;
  }
  .crawler-alert-title { font-weight: 700; color: #93000a; margin-bottom: 8px; }
  .crawler-alert-body { margin: 0 0 12px; color: #5c0008; font-size: 14px; }
  .crawler-alert-meta {
    display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center;
    font-size: 13px; color: #5c0008; margin-bottom: 12px;
  }
  .crawler-retry-btn { min-height: 36px; }
  .crawler-retry-inline { margin-top: 6px; }
  .crawler-refresh-btn { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; }
  .crawler-loading { padding: 48px; text-align: center; color: ${COLORS.onSurfaceVariant}; }
  .crawler-grid {
    display: grid; grid-template-columns: 1fr; gap: 16px;
  }
  @media (min-width: 992px) {
    .crawler-grid { grid-template-columns: 1fr 2fr; }
  }
  .crawler-col-left, .crawler-col-right { display: flex; flex-direction: column; gap: 16px; }
  .crawler-card, .crawler-preview-card {
    background: ${COLORS.surface};
    border: 1px solid ${COLORS.outlineVariant};
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(77, 68, 227, 0.04);
  }
  .crawler-card-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .crawler-card-head h2 { font-size: 20px; font-weight: 600; margin: 0; color: ${COLORS.primary}; }
  .crawler-card-desc { color: ${COLORS.onSurfaceVariant}; margin-bottom: 16px; }
  .crawler-label {
    font-size: 12px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.05em; color: ${COLORS.onSurfaceVariant};
  }
  .crawler-run-btn {
    width: 100%; min-height: 48px; border-radius: 999px;
    background: ${COLORS.primary}; border: none;
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    font-weight: 600;
  }
  .crawler-hint { font-size: 13px; color: ${COLORS.amber}; margin-top: 12px; margin-bottom: 0; }
  .crawler-stats-card {
    background: ${COLORS.primaryContainer}; color: ${COLORS.onPrimary};
    border-radius: 12px; padding: 20px; position: relative; overflow: hidden;
  }
  .crawler-stats-label { font-size: 14px; opacity: 0.85; }
  .crawler-stats-value { font-size: 48px; font-weight: 700; line-height: 1.1; }
  .crawler-stats-sub { font-size: 12px; opacity: 0.8; margin-top: 4px; }
  .crawler-preview-card { display: flex; flex-direction: column; min-height: 320px; }
  .crawler-preview-head {
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 12px; border-bottom: 1px solid ${COLORS.outlineVariant}; margin-bottom: 0;
    font-weight: 600;
  }
  .crawler-preview-body {
    flex: 1; margin: 0; padding: 16px; overflow: auto;
    background: ${COLORS.surfaceLow}; font-size: 13px; line-height: 1.5;
    border-radius: 0 0 12px 12px; max-height: 420px;
  }
  .crawler-logs-title { font-size: 20px; font-weight: 600; margin-bottom: 16px; }
  .crawler-table-wrap { overflow-x: auto; }
  .crawler-table { width: 100%; border-collapse: collapse; font-size: 14px; }
  .crawler-table th {
    text-align: left; padding: 8px 4px; font-size: 12px; text-transform: uppercase;
    color: ${COLORS.onSurfaceVariant}; border-bottom: 1px solid ${COLORS.outlineVariant};
  }
  .crawler-table td { padding: 12px 4px; border-bottom: 1px solid ${COLORS.surfaceContainer}; vertical-align: middle; }
  .crawler-job-name { font-weight: 500; }
  .crawler-job-id { font-size: 12px; color: ${COLORS.onSurfaceVariant}; }
  .crawler-empty { text-align: center; color: ${COLORS.onSurfaceVariant}; padding: 24px; }
`;
