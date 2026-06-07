// speak-buddi/src/features/admin/reports/AdminReportsPage.jsx
// ─── Trang báo cáo & xuất file admin (S11.3) ─────────────────────────────────
// UI: speak-buddi-docs/ui/bao_cao_xuat_file_admin/ + DESIGN.md

import { useCallback, useEffect, useState } from "react";
import { COLORS, FONTS } from "../../../shared/constants/theme";
import AdminToast from "../components/AdminToast";
import ExportFormPanel from "./components/ExportFormPanel";
import ExportHistoryTable from "./components/ExportHistoryTable";
import {
  downloadBlob,
  exportReport,
  listExportHistory,
} from "../services/reportExportService";

export default function AdminReportsPage() {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [toast, setToast] = useState({ message: "", type: "success" });

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await listExportHistory({ limit: 20, offset: 0 });
      setHistory(data.items || []);
    } catch (err) {
      setToast({
        message: err.message || "Không tải được lịch sử xuất báo cáo.",
        type: "error",
      });
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setHistoryLoading(true);
      try {
        const data = await listExportHistory({ limit: 20, offset: 0 });
        if (active) setHistory(data.items || []);
      } catch (err) {
        if (active) {
          setToast({
            message: err.message || "Không tải được lịch sử xuất báo cáo.",
            type: "error",
          });
        }
      } finally {
        if (active) setHistoryLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleExport(payload) {
    setExporting(true);
    setExportError("");
    try {
      const { blob, fileName } = await exportReport(payload);
      downloadBlob(blob, fileName);
      setToast({ message: "Xuất báo cáo thành công.", type: "success" });
      await loadHistory();
    } catch (err) {
      setExportError(err.message || "Không thể xuất báo cáo.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="admin-reports-page">
        <header className="admin-reports-header">
          <h1 className="admin-reports-title">Báo cáo hệ thống</h1>
          <p className="admin-reports-subtitle">
            Phân tích hiệu suất và xuất dữ liệu phục vụ kiểm toán nội bộ.
          </p>
        </header>

        <ExportFormPanel
          onExport={handleExport}
          loading={exporting}
          error={exportError}
        />

        <ExportHistoryTable items={history} loading={historyLoading} />
      </div>

      <AdminToast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "success" })}
      />
    </>
  );
}

const PAGE_CSS = `
  .admin-reports-page {
    display: flex;
    flex-direction: column;
    gap: 24px;
    max-width: 1280px;
  }
  .admin-reports-header {
    margin-bottom: 4px;
  }
  .admin-reports-title {
    font-family: ${FONTS.display};
    font-size: 32px;
    font-weight: 700;
    color: ${COLORS.onBackground};
    margin: 0 0 8px;
    line-height: 1.25;
  }
  .admin-reports-subtitle {
    font-family: ${FONTS.body};
    font-size: 18px;
    color: ${COLORS.outline};
    margin: 0;
  }
  @media (max-width: 768px) {
    .admin-reports-title {
      font-size: 28px;
    }
    .admin-reports-subtitle {
      font-size: 16px;
    }
  }
`;
