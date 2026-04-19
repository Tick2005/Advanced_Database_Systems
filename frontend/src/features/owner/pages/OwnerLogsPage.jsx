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

  useEffect(() => {
    dashboardService.getOwnerLogs().then((data) => {
      setRows(data || []);
    }).catch((err) => {
      setError(err.message || "Khong the tai logs");
    });
  }, []);

  const sources = useMemo(() => Array.from(new Set(rows.map((item) => item.source).filter(Boolean))), [rows]);
  const actors = useMemo(() => Array.from(new Set(rows.map((item) => item.actor).filter(Boolean))), [rows]);

  const filtered = rows.filter((item) => {
    const q = query.trim().toLowerCase();
    const matchQuery = !q
      || item.action?.toLowerCase().includes(q)
      || item.details?.toLowerCase().includes(q)
      || item.actor?.toLowerCase().includes(q)
      || item.source?.toLowerCase().includes(q);
    const matchSource = sourceFilter === "ALL" || item.source === sourceFilter;
    const matchActor = actorFilter === "ALL" || item.actor === actorFilter;
    return matchQuery && matchSource && matchActor;
  });

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>System logs</h1>

      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      <div className="table-toolbar">
        <input placeholder="Tim theo action / details / actor / source" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
          <option value="ALL">Tat ca source</option>
          {sources.map((source) => <option key={source} value={source}>{source}</option>)}
        </select>
        <select value={actorFilter} onChange={(event) => setActorFilter(event.target.value)}>
          <option value="ALL">Tat ca actor</option>
          {actors.map((actor) => <option key={actor} value={actor}>{actor}</option>)}
        </select>
      </div>

      {filtered.length === 0 && <EmptyState title="Khong co log" description="Khong co ban ghi phu hop bo loc hien tai." />}

      <DataTable
        rows={filtered}
        columns={[
          { key: "time", label: "Thoi gian", render: (row) => row.time ? new Date(row.time).toLocaleString() : "-" },
          { key: "actor", label: "Nguoi dung" },
          { key: "action", label: "Hanh dong" },
          { key: "source", label: "Nguon" },
          { key: "details", label: "Chi tiet" }
        ]}
      />
    </section>
  );
}
