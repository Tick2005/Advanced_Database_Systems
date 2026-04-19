import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/pathConstants";
import ServiceSelector from "../ServiceSelector";

export default function ReviewBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  const payload = location.state?.payload;
  const room = location.state?.room;
  const [agreed, setAgreed] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);
  const bookingBranchId = booking?.branchId || payload?.branchId || room?.branchId;

  const servicesTotal = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const finalTotal = (Number(booking?.totalPrice || 0) + servicesTotal);

  if (!booking) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <h1>Không có booking để review</h1>
        <button className="btn btn-primary" onClick={() => navigate(PATHS.CUSTOMER_BOOKING_CREATE)}>
          Quay lại tạo booking
        </button>
      </section>
    );
  }

  return (
    <section className="container" style={{ padding: "28px 24px", maxWidth: 640 }}>
      <div style={{ display: "grid", gap: 12, marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Xác nhận đặt phòng</h1>
        <p style={{ margin: 0, color: "#64748b" }}>Kiểm tra thông tin và chọn dịch vụ bổ sung</p>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {/* Booking Summary */}
        <div className="card-elevated" style={{ padding: 18, display: "grid", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>THÔNG TIN BOOKING</div>
          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Booking ID:</span>
              <span className="mono" style={{ fontWeight: 600 }}>{booking.id?.slice(0, 12)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Phòng:</span>
              <span style={{ fontWeight: 500 }}>{room ? `${room.roomTypeName} - ${room.roomNumber}` : booking.roomId}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Chi nhánh:</span>
              <span style={{ fontWeight: 500 }}>{booking.branchId}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Thời gian lưu:</span>
              <span style={{ fontWeight: 500 }}>{payload?.checkInDate} → {payload?.checkOutDate}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748b" }}>Khách:</span>
              <span style={{ fontWeight: 500 }}>{payload?.adults || 0} người lớn, {payload?.children || 0} trẻ em</span>
            </div>
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 8, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600 }}>Giá phòng:</span>
              <span className="mono" style={{ fontWeight: 700, color: "#9a7d24" }}>{(booking.totalPrice / 1000000).toFixed(1)}M ₫</span>
            </div>
          </div>
        </div>

        {/* Service Selector */}
        <ServiceSelector branchId={bookingBranchId} onServicesChange={setSelectedServices} />

        {/* Total */}
        <div className="card-elevated" style={{ padding: 18, background: "#f0f4ff", display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
            <span>Giá phòng</span>
            <span>{(booking.totalPrice / 1000000).toFixed(1)}M ₫</span>
          </div>
          {servicesTotal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b" }}>
              <span>Dịch vụ thêm ({selectedServices.length})</span>
              <span>+{(servicesTotal / 1000000).toFixed(1)}M ₫</span>
            </div>
          )}
          <div style={{ borderTop: "1px solid #c9a84c", paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700, color: "#9a7d24" }}>
            <span>Tổng cộng</span>
            <span>{(finalTotal / 1000000).toFixed(1)}M ₫</span>
          </div>
        </div>

        {/* Agreement & Actions */}
        <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", background: "#f8fafc", borderRadius: 12 }}>
          <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} style={{ marginTop: 4, accentColor: "#9a7d24" }} />
          <span style={{ fontSize: 13, color: "#475569" }}>Tôi đồng ý với chính sách hủy phòng. Nếu hủy trước 24h được hoàn 100%, sau 24h mất 20%.</span>
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn pill pill-soft" onClick={() => navigate(PATHS.CUSTOMER_BOOKING_CREATE, { state: payload })}>Quay lại</button>
          <button
            className="btn btn-gold"
            disabled={!agreed}
            onClick={() => navigate(PATHS.CUSTOMER_BOOKING_PAYMENT, { state: { booking, services: selectedServices, totalPrice: finalTotal } })}
            style={{ opacity: agreed ? 1 : 0.5 }}
          >
            Thanh toán VNPay ({(finalTotal / 1000000).toFixed(1)}M ₫)
          </button>
        </div>
      </div>
    </section>
  );
}
