/**
 * OwnerLogsPage.jsx
 * Commit: fix(owner): OwnerLogsPage – dịch toàn bộ UI sang tiếng Việt, chuẩn hoá toolbar, hiển thị rõ số bản ghi
 */

import { useEffect, useMemo, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";
import ToastMessage from "../../../components/common/ToastMessage";
import EmptyState from "../../../components/common/EmptyState";

export default function OwnerLogsPage() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [actorFilter, setActorFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardService.getOwnerLogs()
      .then((data) => { setRows(data || []); setError(""); })
      .catch((err) => setError(err.message || "Không thể tải nhật ký hệ thống."))
      .finally(() => setLoading(false));
  }, []);

  const sources = useMemo(() => Array.from(new Set(rows.map((r) => r.source).filter(Boolean))), [rows]);
  const actors  = useMemo(() => Array.from(new Set(rows.map((r) => r.actor).filter(Boolean))),  [rows]);

  const filtered = useMemo(() => rows.filter((item) => {
    const q = query.trim().toLowerCase();
    const matchQuery = !q
      || item.action?.toLowerCase().includes(q)
      || item.details?.toLowerCase().includes(q)
      || item.actor?.toLowerCase().includes(q)
      || item.source?.toLowerCase().includes(q);
    return matchQuery
      && (sourceFilter === "ALL" || item.source === sourceFilter)
      && (actorFilter  === "ALL" || item.actor  === actorFilter);
  }), [rows, query, sourceFilter, actorFilter]);

  return (
    <section style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderRadius: 14, background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)", color: "white" }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Hệ thống</div>
        <div style={{ fontWeight: 800, fontSize: 20 }}>🧾 Nhật ký hoạt động</div>
        <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>Theo dõi toàn bộ thao tác trong hệ thống</div>
      </div>

      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Toolbar */}
      <div className="card" style={{ padding: 14, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="🔍 Tìm action / chi tiết / người dùng / nguồn"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="ALL">Tất cả nguồn</option>
            {sources.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={actorFilter} onChange={(e) => setActorFilter(e.target.value)}>
            <option value="ALL">Tất cả người dùng</option>
            {actors.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          {loading ? "Đang tải..." : <>Hiển thị <strong>{filtered.length}</strong> / {rows.length} bản ghi</>}
        </div>
      </div>

      {!loading && filtered.length === 0 && (
        <EmptyState title="Không có nhật ký" description="Không tìm thấy bản ghi phù hợp với bộ lọc hiện tại." />
      )}

      <DataTable
        rows={filtered}
        columns={[
          { key: "time",    label: "Thời gian", render: (row) => row.time ? new Date(row.time).toLocaleString("vi-VN") : "—" },
          { key: "actor",   label: "Người dùng" },
          { key: "action",  label: "Hành động" },
          { key: "source",  label: "Nguồn" },
          { key: "details", label: "Chi tiết" },
        ]}
      />
    </section>
  );
}
