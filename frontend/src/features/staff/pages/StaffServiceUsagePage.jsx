import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import ToastMessage from "../../../components/common/ToastMessage";
import StatusBadge from "../../../components/common/StatusBadge";
import EmptyState from "../../../components/common/EmptyState";
import { formatCurrencyVnd } from "../../../services/presenters";

export default function StaffServiceUsagePage() {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dashboardService.getStaffTodayBookings(),
      dashboardService.getStaffServices().catch(() => [])
    ]).then(([bData, sData]) => {
      setBookings((bData || []).filter((b) => ["CONFIRMED", "CHECKED_IN"].includes(b.status)));
      setServices(sData || []);
    }).catch((err) => setError(err.message || "Không thể tải dữ liệu"))
      .finally(() => setLoading(false));
  }, []);

  const addService = async () => {
    if (!selectedBooking || !selectedServiceId) return;
    setAdding(true);
    setError("");
    try {
      await dashboardService.addServiceToBooking(selectedBooking.id, selectedServiceId, qty);
      setMessage(`Đã thêm dịch vụ vào booking ${selectedBooking.id?.slice(0, 8)}`);
      setSelectedServiceId("");
      setQty(1);
    } catch (err) {
      setError(err.message || "Không thể thêm dịch vụ");
    } finally {
      setAdding(false);
    }
  };

  const selectedService = services.find((s) => s.id === selectedServiceId);

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ margin: 0 }}>🍽️ Dịch vụ Booking & Walk-in</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Thêm dịch vụ cho các booking đang active hôm nay</p>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Đang tải dữ liệu...</div>
      ) : (
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit,minmax(340px,1fr))" }}>
          {/* Chọn booking */}
          <div style={{ display: "grid", gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 14, color: "#475569" }}>1. Chọn booking đang active</h3>
            {bookings.length === 0 ? (
              <EmptyState title="Không có booking active" description="Chỉ hiển thị booking CONFIRMED hoặc CHECKED_IN" />
            ) : (
              bookings.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBooking(b)}
                  style={{
                    padding: 14, borderRadius: 12, textAlign: "left", cursor: "pointer",
                    border: `2px solid ${selectedBooking?.id === b.id ? "#0d2238" : "#e2e8f0"}`,
                    background: selectedBooking?.id === b.id ? "#0d2238" : "white"
                  }}
                >
                  <div style={{ fontWeight: 700, color: selectedBooking?.id === b.id ? "white" : "#0f172a", fontSize: 14 }}>
                    {b.customerName || b.guestName || "Khách"} — Phòng {b.roomNumber || "?"}
                  </div>
                  <div style={{ fontSize: 12, color: selectedBooking?.id === b.id ? "rgba(255,255,255,0.7)" : "#64748b", marginTop: 4 }}>
                    {b.checkInDate} → {b.checkOutDate} · <StatusBadge value={b.status} />
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Thêm dịch vụ */}
          <article className="card" style={{ padding: 18, display: "grid", gap: 14, alignContent: "start" }}>
            <h3 style={{ margin: 0, fontSize: 14, color: "#475569" }}>2. Thêm dịch vụ</h3>

            {!selectedBooking && (
              <div style={{ padding: 16, textAlign: "center", color: "#94a3b8", background: "#f8fafc", borderRadius: 10 }}>
                ← Chọn booking để thêm dịch vụ
              </div>
            )}

            {selectedBooking && (
              <>
                <div style={{ padding: 12, borderRadius: 10, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Booking đã chọn:</div>
                  <div style={{ fontSize: 13, color: "#0284c7", marginTop: 2 }}>
                    {selectedBooking.customerName || "Khách"} — Phòng {selectedBooking.roomNumber}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 13, color: "#475569", display: "block", marginBottom: 6 }}>Chọn dịch vụ</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
                  >
                    <option value="">-- Chọn dịch vụ --</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {formatCurrencyVnd(s.price || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedService && (
                  <div style={{ padding: 12, borderRadius: 10, background: "#fefce8", border: "1px solid #fde68a", fontSize: 13 }}>
                    <strong>{selectedService.name}</strong>
                    <div style={{ color: "#64748b", marginTop: 2 }}>{selectedService.description}</div>
                    <div style={{ fontWeight: 700, color: "#d97706", marginTop: 4 }}>{formatCurrencyVnd(selectedService.price || 0)} / lần</div>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 13, color: "#475569", display: "block", marginBottom: 6 }}>Số lượng</label>
                  <input
                    type="number" min={1} max={20} value={qty}
                    onChange={(e) => setQty(Number(e.target.value) || 1)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
                  />
                </div>

                {selectedService && qty > 0 && (
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0d2238" }}>
                    Tổng: {formatCurrencyVnd((selectedService.price || 0) * qty)}
                  </div>
                )}

                <button
                  className="btn btn-gold"
                  onClick={addService}
                  disabled={!selectedServiceId || adding}
                  style={{ width: "100%" }}
                >
                  {adding ? "Đang thêm..." : "➕ Thêm dịch vụ vào booking"}
                </button>
              </>
            )}
          </article>
        </div>
      )}

      {/* Danh sách dịch vụ */}
      <article className="card" style={{ padding: 16 }}>
        <h3 style={{ margin: "0 0 12px" }}>📋 Danh sách dịch vụ có sẵn</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))" }}>
          {services.map((s) => (
            <div key={s.id} style={{ padding: 12, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{s.serviceMode || s.code}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#9a7d24", marginTop: 6 }}>{formatCurrencyVnd(s.price || 0)}</div>
            </div>
          ))}
          {services.length === 0 && (
            <div style={{ color: "#94a3b8", fontSize: 13, gridColumn: "1 / -1" }}>Chưa có dịch vụ nào được cấu hình.</div>
          )}
        </div>
      </article>
    </section>
  );
}
