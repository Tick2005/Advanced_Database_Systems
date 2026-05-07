import { useEffect, useState } from "react";
import StatusBadge from "../../../components/common/StatusBadge";
import ToastMessage from "../../../components/common/ToastMessage";
import RatingStars from "../../../components/common/RatingStars";
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
      <div style={{
        padding: "16px 20px", borderRadius: 14,
        background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)",
        color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Tình trạng phòng</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Room Status</div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>Cập nhật trạng thái phòng theo thời gian thực</div>
        </div>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {stats.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setFilter(filter === s.value ? "ALL" : s.value)}
            style={{
              padding: "14px 16px",
              borderRadius: 10,
              border: `2px solid ${filter === s.value ? "#0d2238" : "#e2e8f0"}`,
              background: filter === s.value ? "#0d2238" : s.color,
              cursor: "pointer",
              textAlign: "left",
              display: "grid",
              gap: 6
            }}
          >
            <div style={{ fontSize: 12, color: filter === s.value ? "rgba(255,255,255,0.7)" : "#64748b", fontWeight: 600 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: filter === s.value ? "white" : "#0f172a" }}>{s.count}</div>
          </button>
        ))}
      </div>

      {/* Room grid */}
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {filtered.map((room) => {
          const statusOpt = STATUS_OPTIONS.find((o) => o.value === room.status) || STATUS_OPTIONS[0];
          const colorMap = { "#dcfce7": "#22c55e", "#dbeafe": "#3b82f6", "#fef9c3": "#eab308", "#fee2e2": "#ef4444" };
          return (
            <article key={room.id} className="card" style={{
              padding: "14px 16px", display: "grid", gap: 12,
              borderLeft: `4px solid ${colorMap[statusOpt.color] || "#9ca3af"}`
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ display: "grid", gap: 2 }}>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Phòng {room.roomNumber}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{room.roomTypeName}</div>
                  {room.averageRating != null && (
                    <div style={{ marginTop: 4 }}>
                      <RatingStars value={room.averageRating} size={13} showValue count={room.feedbackCount} />
                    </div>
                  )}
                </div>
                <StatusBadge value={room.status} />
              </div>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Cập nhật trạng thái</label>
                <select
                  value={room.status}
                  disabled={updating === room.id}
                  onChange={(e) => updateStatus(room.id, e.target.value)}
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8,
                    border: "1px solid #e2e8f0", background: "white",
                    cursor: updating === room.id ? "not-allowed" : "pointer", fontSize: 13,
                    opacity: updating === room.id ? 0.6 : 1
                  }}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {updating === room.id && (
                <div style={{ fontSize: 12, color: "#0d2238", textAlign: "center", fontWeight: 700 }}>⏳ Đang cập nhật...</div>
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
