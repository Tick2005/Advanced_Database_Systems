import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import ToastMessage from "../../../components/common/ToastMessage";
import StatusBadge from "../../../components/common/StatusBadge";
import { formatCurrencyVnd } from "../../../services/presenters";

export default function StaffServiceUsagePage() {
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState("");
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

  const openAddServiceModal = (service) => {
    setSelectedService(service);
    setSelectedBookingId(bookings.length === 1 ? bookings[0].id : "");
    setQty(1);
  };

  const addService = async () => {
    if (!selectedBookingId || !selectedService) return;
    setAdding(true);
    setError("");
    try {
      await dashboardService.addServiceToBooking(selectedBookingId, selectedService.id, qty);
      setMessage(`Đã thêm ${qty} ${selectedService.name} vào booking #${selectedBookingId.split("-")[0]}`);
      setSelectedService(null);
    } catch (err) {
      setError(err.message || "Không thể thêm dịch vụ");
    } finally {
      setAdding(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: 20 }}>
      {/* Header Banner */}
      <div style={{
        padding: "20px 24px", borderRadius: 16,
        background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)",
        color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        boxShadow: "0 10px 25px rgba(13, 34, 56, 0.2)"
      }}>
        <div>
          <div style={{ fontSize: 13, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Upsell & Tiện ích</div>
          <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em" }}>Dịch vụ khách sạn</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>Giới thiệu và đăng ký dịch vụ nhanh chóng cho khách lưu trú</div>
        </div>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Đang tải dữ liệu...</div>
      ) : (
        <>
          {/* Services List - Upsell Display */}
          <div>
            <h3 style={{ margin: "0 0 16px 0", color: "#0d2238", fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
              ✨ Dịch vụ nổi bật
            </h3>
            
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {services.map((s) => (
                <article key={s.id} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, transition: "transform 0.2s, box-shadow 0.2s" }} onMouseOver={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 20px rgba(0,0,0,0.08)"; }} onMouseOut={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "var(--shadow-card)"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: 16, color: "#0f172a", fontWeight: 800 }}>{s.name}</h4>
                      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700, marginTop: 4 }}>{s.serviceMode || s.code}</div>
                    </div>
                    <div style={{ background: "#fef7e7", color: "#9a7d24", padding: "6px 10px", borderRadius: 8, fontWeight: 800, fontSize: 14 }}>
                      {formatCurrencyVnd(s.price || 0)}
                    </div>
                  </div>
                  
                  <p style={{ margin: 0, fontSize: 13, color: "#475569", lineHeight: 1.5, flex: 1 }}>
                    {s.description || "Chưa có mô tả chi tiết cho dịch vụ này. Vui lòng liên hệ lễ tân để biết thêm thông tin."}
                  </p>
                  
                  <button 
                    className="btn btn-gold" 
                    style={{ width: "100%", padding: "10px", marginTop: "auto", display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}
                    onClick={() => openAddServiceModal(s)}
                  >
                    <span>➕</span> Thêm cho khách
                  </button>
                </article>
              ))}
              
              {services.length === 0 && (
                <div className="card" style={{ padding: 40, textAlign: "center", color: "#94a3b8", gridColumn: "1 / -1" }}>
                  Chưa có dịch vụ nào được cấu hình trong hệ thống.
                </div>
              )}
            </div>
          </div>

          {/* Active Bookings Summary */}
          <div className="card" style={{ padding: 20, marginTop: 10 }}>
            <h3 style={{ margin: "0 0 16px 0", color: "#0d2238", fontSize: 16 }}>Khách đang lưu trú (Có thể thêm dịch vụ)</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {bookings.length === 0 ? (
                 <div style={{ color: "#94a3b8", fontSize: 13 }}>Không có booking nào đang active (CONFIRMED hoặc CHECKED_IN).</div>
              ) : (
                bookings.map(b => (
                  <div key={b.id} style={{ padding: "8px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>Phòng {b.roomNumber || "?"}</span>
                    <span style={{ color: "#64748b" }}>|</span>
                    <span style={{ color: "#475569" }}>{b.customerName || b.guestName || "Khách"}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Service Modal */}
      {selectedService && (
        <div className="modal-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, background: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)" }}>
          <div className="card modal-card" style={{ maxWidth: 480, width: "100%", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 20, color: "#0d2238" }}>Đăng ký dịch vụ</h3>
                <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Thêm dịch vụ vào hóa đơn của khách</div>
              </div>
              <button 
                onClick={() => setSelectedService(null)}
                style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#94a3b8" }}
              >
                ×
              </button>
            </div>
            
            <div style={{ background: "#fef7e7", padding: 16, borderRadius: 12, marginBottom: 20, border: "1px solid #fde68a" }}>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#9a7d24" }}>{selectedService.name}</div>
              <div style={{ fontSize: 14, color: "#b45309", marginTop: 4, fontWeight: 700 }}>Đơn giá: {formatCurrencyVnd(selectedService.price || 0)}</div>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: "#475569", fontWeight: 700, display: "block", marginBottom: 8 }}>
                  1. Chọn phòng / Booking khách hàng
                </label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14, background: "white" }}
                >
                  <option value="">-- Vui lòng chọn khách hàng --</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      Phòng {b.roomNumber || "?"} — {b.customerName || b.guestName || "Khách"}
                    </option>
                  ))}
                </select>
                {bookings.length === 0 && (
                  <div style={{ fontSize: 12, color: "#ef4444", marginTop: 6 }}>* Hiện không có khách nào đang lưu trú để thêm dịch vụ.</div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 13, color: "#475569", fontWeight: 700, display: "block", marginBottom: 8 }}>
                  2. Số lượng
                </label>
                <input
                  type="number" min={1} max={20} value={qty}
                  onChange={(e) => setQty(Number(e.target.value) || 1)}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid #cbd5e1", fontSize: 14 }}
                />
              </div>

              <div style={{ padding: "16px 0", borderTop: "1px dashed #e2e8f0", marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>Tổng tiền:</span>
                <span style={{ fontSize: 20, color: "#0d2238", fontWeight: 800 }}>
                  {formatCurrencyVnd((selectedService.price || 0) * qty)}
                </span>
              </div>

              <button
                className="btn btn-gold"
                onClick={addService}
                disabled={!selectedBookingId || adding}
                style={{ width: "100%", padding: "12px", fontSize: 15 }}
              >
                {adding ? "Đang xử lý..." : "Xác nhận thêm dịch vụ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
