import { useEffect, useState } from "react";
import StatusBadge from "../../../components/common/StatusBadge";
import ToastMessage from "../../../components/common/ToastMessage";
import { dashboardService } from "../../dashboard/dashboardService";

const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "✅ Còn trống", color: "#dcfce7" },
  { value: "HELD", label: "⏳ Tạm giữ", color: "#fef9c3" },
  { value: "OCCUPIED", label: "🛏️ Đang có khách", color: "#dbeafe" },
  { value: "MAINTENANCE", label: "🔧 Bảo trì", color: "#fee2e2" }
];

export default function StaffRoomStatusPage() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [updating, setUpdating] = useState("");

  const fetchData = () => {
    dashboardService.getStaffRoomStatus().then((data) => {
      setRows(data || []);
    }).catch((err) => setError(err.message || "Không thể tải room status"));
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (roomId, status) => {
    setMessage("");
    setError("");
    setUpdating(roomId);
    try {
      await dashboardService.updateRoomStatus(roomId, status);
      setMessage("Đã cập nhật trạng thái phòng");
      fetchData();
    } catch (err) {
      setError(err.message || "Không thể cập nhật trạng thái phòng");
    } finally {
      setUpdating("");
    }
  };

  const filtered = filter === "ALL" ? rows : rows.filter((r) => r.status === filter);

  // Stats
  const stats = STATUS_OPTIONS.map((opt) => ({
    ...opt,
    count: rows.filter((r) => r.status === opt.value).length
  }));

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0 }}>🏨 Trạng thái phòng</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Cập nhật tình trạng phòng theo thời gian thực</p>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Summary cards */}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))" }}>
        {stats.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setFilter(filter === s.value ? "ALL" : s.value)}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: `2px solid ${filter === s.value ? "#0d2238" : "#e2e8f0"}`,
              background: filter === s.value ? "#0d2238" : s.color,
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <div style={{ fontSize: 11, color: filter === s.value ? "rgba(255,255,255,0.7)" : "#64748b", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: filter === s.value ? "white" : "#0f172a" }}>{s.count}</div>
          </button>
        ))}
      </div>

      {/* Room grid */}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))" }}>
        {filtered.map((room) => {
          const statusOpt = STATUS_OPTIONS.find((o) => o.value === room.status) || STATUS_OPTIONS[0];
          return (
            <article key={room.id} className="card" style={{
              padding: 16, display: "grid", gap: 10,
              borderLeft: `4px solid ${statusOpt.color === "#dcfce7" ? "#22c55e" : statusOpt.color === "#dbeafe" ? "#3b82f6" : statusOpt.color === "#fef9c3" ? "#eab308" : "#ef4444"}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Phòng {room.roomNumber}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{room.roomTypeName}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{room.branchCity}</div>
                </div>
                <StatusBadge value={room.status} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#64748b", display: "block", marginBottom: 4 }}>Cập nhật trạng thái</label>
                <select
                  value={room.status}
                  disabled={updating === room.id}
                  onChange={(e) => updateStatus(room.id, e.target.value)}
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8,
                    border: "1px solid #e2e8f0", background: "#f8fafc",
                    cursor: "pointer", fontSize: 13
                  }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {updating === room.id && (
                <div style={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>Đang cập nhật...</div>
              )}
            </article>
          );
        })}
        {filtered.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: "center", color: "#94a3b8", gridColumn: "1 / -1" }}>
            Không có phòng nào với trạng thái đã chọn.
          </div>
        )}
      </div>
    </section>
  );
}
