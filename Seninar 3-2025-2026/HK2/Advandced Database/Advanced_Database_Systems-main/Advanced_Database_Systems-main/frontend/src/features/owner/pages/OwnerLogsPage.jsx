// commit: fix(owner-logs): encode đúng tiếng Việt, thêm export CSV, refresh button, loading skeleton
import { useCallback, useEffect, useMemo, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import ToastMessage from "../../../components/common/ToastMessage";
import EmptyState from "../../../components/common/EmptyState";
import SkeletonBlock from "../../../components/common/SkeletonBlock";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("vi-VN");
  } catch {
    return String(value);
  }
}

function exportCsv(rows) {
  const headers = ["Thời gian", "Người dùng", "Hành động", "Nguồn", "Chi tiết"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        formatDate(r.time || r.timestamp),
        r.actor || "—",
        r.action || "—",
        r.source || "—",
        String(r.details || "").replace(/,/g, ";"),
      ]
        .map((v) => `"${v}"`)
        .join(",")
    ),
  ];
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `system-logs-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── LogRow ──────────────────────────────────────────────────────────────────

function ActionBadge({ action }) {
  const colors = {
    APPROVE_PRICING: { bg: "#dcfce7", color: "#166534" },
    REJECT_PRICING: { bg: "#fee2e2", color: "#b91c1c" },
    CHECKOUT: { bg: "#dbeafe", color: "#1e40af" },
    BOOK: { bg: "#fef9c3", color: "#854d0e" },
    REVIEW_SUBMIT: { bg: "#f3e8ff", color: "#7e22ce" },
  };
  const style = colors[action] || { bg: "#f1f5f9", color: "#475569" };
  return (
    <span
      style={{
        padding: "3px 10px",
        borderRadius: 999,
        background: style.bg,
        color: style.color,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {action || "—"}
    </span>
  );
}

function LogRow({ row }) {
  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
      <td style={{ padding: "10px 12px", fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}>
        {formatDate(row.time || row.timestamp)}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>
        {row.actor || "—"}
      </td>
      <td style={{ padding: "10px 12px" }}>
        <ActionBadge action={row.action} />
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: "#94a3b8" }}>
        {row.source || "—"}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13, color: "#475569", maxWidth: 280 }}>
        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {typeof row.details === "object"
            ? JSON.stringify(row.details)
            : row.details || "—"}
        </div>
      </td>
    </tr>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OwnerLogsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [actorFilter, setActorFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [error, setError] = useState("");

  const fetchLogs = useCallback(() => {
    setLoading(true);
    setError("");
    dashboardService
      .getOwnerLogs()
      .then((data) => setRows(data || []))
      .catch((err) => setError(err?.message || "Không thể tải system logs."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const sources  = useMemo(() => Array.from(new Set(rows.map((r) => r.source).filter(Boolean))), [rows]);
  const actors   = useMemo(() => Array.from(new Set(rows.map((r) => r.actor).filter(Boolean))), [rows]);
  const actions  = useMemo(() => Array.from(new Set(rows.map((r) => r.action).filter(Boolean))), [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchQ = !q
        || String(row.action || "").toLowerCase().includes(q)
        || String(row.actor || "").toLowerCase().includes(q)
        || String(row.source || "").toLowerCase().includes(q)
        || String(row.details || "").toLowerCase().includes(q);
      const matchSource = sourceFilter === "ALL" || row.source === sourceFilter;
      const matchActor  = actorFilter === "ALL"  || row.actor === actorFilter;
      const matchAction = actionFilter === "ALL" || row.action === actionFilter;
      return matchQ && matchSource && matchActor && matchAction;
    });
  }, [rows, query, sourceFilter, actorFilter, actionFilter]);

  return (
    <section className="container page-shell" style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div className="page-heading" style={{ marginBottom: 0 }}>
        <div>
          <h1>System Logs</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0" }}>
            Theo dõi toàn bộ hoạt động hệ thống — lọc theo người dùng, hành động và nguồn.
          </p>
        </div>
      </div>

      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Filters */}
      <div className="card" style={{ padding: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="Tìm theo action / actor / source / chi tiết…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 220, padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
          >
            <option value="ALL">Tất cả hành động</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
          >
            <option value="ALL">Tất cả nguồn</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
          >
            <option value="ALL">Tất cả người dùng</option>
            {actors.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button
            className="btn"
            style={{ border: "1px solid #cbd5e1", background: "white" }}
            onClick={fetchLogs}
            title="Làm mới"
          >
            🔄 Làm mới
          </button>
          <button
            className="btn btn-gold"
            onClick={() => exportCsv(filtered)}
            disabled={!filtered.length}
            title="Xuất CSV"
          >
            ⬇ Export CSV
          </button>
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>
          Hiển thị <strong>{filtered.length}</strong> / <strong>{rows.length}</strong> bản ghi
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonBlock rows={8} />
      ) : filtered.length === 0 ? (
        <EmptyState title="Không có log" description="Không có bản ghi phù hợp bộ lọc hiện tại." />
      ) : (
        <div className="card" style={{ padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                {["Thời gian", "Người dùng", "Hành động", "Nguồn", "Chi tiết"].map((h) => (
                  <th
                    key={h}
                    style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <LogRow key={row._id || row.id || idx} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
