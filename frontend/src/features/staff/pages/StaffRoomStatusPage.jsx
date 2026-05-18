import { useEffect, useState } from "react";
import ToastMessage from "../../../components/common/ToastMessage";
import RatingStars from "../../../components/common/RatingStars";
import { dashboardService } from "../../dashboard/dashboardService";

const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Còn trống", color: "#dcfce7", border: "#22c55e", icon: "✨" },
  { value: "OCCUPIED", label: "Đang có khách", color: "#dbeafe", border: "#3b82f6", icon: "🛏️", readOnly: true },
  { value: "HELD", label: "Tạm giữ", color: "#fef9c3", border: "#eab308", icon: "⏳" },
  { value: "MAINTENANCE", label: "Bảo trì/Dọn dẹp", color: "#fee2e2", border: "#ef4444", icon: "🔧" }
];

export default function StaffRoomStatusPage() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [updating, setUpdating] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);

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
      setSelectedRoom(null); // Close popup
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
      {/* Header Banner */}
      <div style={{
        padding: "20px 24px", borderRadius: 16,
        background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)",
        color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        boxShadow: "0 10px 25px rgba(13, 34, 56, 0.2)"
      }}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Quản lý phòng</div>
          <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em" }}>Sơ Đồ Tình Trạng Phòng</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>Cập nhật trạng thái dọn dẹp và sử dụng phòng theo thời gian thực</div>
        </div>
        <div>
          <button className="btn" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }} onClick={fetchData}>
            ↻ Làm mới
          </button>
        </div>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {stats.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setFilter(filter === s.value ? "ALL" : s.value)}
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              border: `2px solid ${filter === s.value ? s.border : "transparent"}`,
              background: "white",
              boxShadow: filter === s.value ? `0 4px 12px ${s.border}40` : "0 2px 8px rgba(0,0,0,0.05)",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              transition: "all 0.2s"
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{s.count}</div>
            </div>
            <div style={{ fontSize: 32, opacity: filter === s.value ? 1 : 0.4 }}>{s.icon}</div>
          </button>
        ))}
      </div>

      {/* Room Grid Map */}
      <div className="card" style={{ padding: "24px", background: "#f8fafc" }}>
        <h3 style={{ margin: "0 0 20px 0", color: "#0d2238", fontSize: 18 }}>Lưới Phòng</h3>
        
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
          {filtered.map((room) => {
            const statusOpt = STATUS_OPTIONS.find((o) => o.value === room.status) || STATUS_OPTIONS[0];
            const isVIP = room.roomTypeName?.toLowerCase().includes("vip") || room.roomTypeName?.toLowerCase().includes("suite");

            return (
              <button 
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                style={{
                  background: "white",
                  border: `2px solid ${statusOpt.border}`,
                  borderTopWidth: "6px",
                  borderRadius: 12,
                  padding: "16px 12px",
                  cursor: "pointer",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  transform: selectedRoom?.id === room.id ? "scale(1.05)" : "scale(1)",
                  position: "relative"
                }}
                onMouseOver={(e) => { e.currentTarget.style.boxShadow = "0 8px 15px rgba(0,0,0,0.1)"; }}
                onMouseOut={(e) => { e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)"; }}
              >
                {isVIP && (
                  <div style={{ position: "absolute", top: 4, right: 4, fontSize: 12, background: "#fef08a", color: "#a16207", padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>VIP</div>
                )}
                
                <div style={{ fontSize: 24 }}>{statusOpt.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>{room.roomNumber}</div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{room.roomTypeName || "Standard"}</div>
                
                <div style={{ background: statusOpt.color, color: statusOpt.border, padding: "4px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700, marginTop: "auto" }}>
                  {statusOpt.label}
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", gridColumn: "1 / -1", fontSize: 15 }}>
              Không có phòng nào với trạng thái đã chọn.
            </div>
          )}
        </div>
      </div>

      {/* Action Popup Modal */}
      {selectedRoom && (
        <div className="modal-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
          <div className="card modal-card" style={{ maxWidth: 400, width: "100%", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 20, color: "#0d2238" }}>Phòng {selectedRoom.roomNumber}</h3>
              <button 
                onClick={() => setSelectedRoom(null)}
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#94a3b8" }}
              >
                ×
              </button>
            </div>
            
            <div style={{ background: "#f8fafc", padding: 16, borderRadius: 12, marginBottom: 20, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b", fontSize: 13 }}>Loại phòng:</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>{selectedRoom.roomTypeName || "Standard"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b", fontSize: 13 }}>Trạng thái hiện tại:</span>
                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                  {STATUS_OPTIONS.find(o => o.value === selectedRoom.status)?.label || selectedRoom.status}
                </span>
              </div>
              {selectedRoom.averageRating != null && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#64748b", fontSize: 13 }}>Đánh giá:</span>
                  <RatingStars value={selectedRoom.averageRating} size={14} showValue count={selectedRoom.feedbackCount} />
                </div>
              )}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <label style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>Chuyển đổi trạng thái:</label>
              {selectedRoom.status === "OCCUPIED" && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#dbeafe", border: "1px solid #3b82f6", fontSize: 13, color: "#1e40af", fontWeight: 600 }}>
                  🛏️ Phòng đang có khách — trạng thái OCCUPIED được cập nhật tự động khi khách check-in/check-out.
                </div>
              )}
              <div style={{ display: "grid", gap: 8 }}>
                {STATUS_OPTIONS.filter((opt) => !opt.readOnly).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateStatus(selectedRoom.id, opt.value)}
                    disabled={updating === selectedRoom.id || selectedRoom.status === opt.value}
                    style={{
                      padding: "12px 16px",
                      borderRadius: 10,
                      border: `1px solid ${selectedRoom.status === opt.value ? opt.border : "#e2e8f0"}`,
                      background: selectedRoom.status === opt.value ? opt.color : "white",
                      color: selectedRoom.status === opt.value ? opt.border : "#0f172a",
                      cursor: updating === selectedRoom.id || selectedRoom.status === opt.value ? "not-allowed" : "pointer",
                      textAlign: "left",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      opacity: updating === selectedRoom.id && selectedRoom.status !== opt.value ? 0.6 : 1
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
                    {updating === selectedRoom.id && selectedRoom.status !== opt.value ? "Đang cập nhật..." : opt.label}
                    {selectedRoom.status === opt.value && <span style={{ marginLeft: "auto" }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
