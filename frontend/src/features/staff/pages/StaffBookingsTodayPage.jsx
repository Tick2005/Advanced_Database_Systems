import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import ToastMessage from "../../../components/common/ToastMessage";
import StatusBadge from "../../../components/common/StatusBadge";
import { PATHS } from "../../../routes/pathConstants";
import { formatCurrencyVnd } from "../../../services/presenters";

export default function StaffBookingsTodayPage() {
  const [rows, setRows] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [serviceBookingId, setServiceBookingId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [serviceQty, setServiceQty] = useState(1);

  const fetchData = () => {
    setLoading(true);
    Promise.all([dashboardService.getStaffTodayBookings(), dashboardService.getStaffServices()])
      .then(([bookings, staffServices]) => {
        setRows(bookings || []);
        setServices(staffServices || []);
      })
      .catch((err) => setError(err.message || "Không thể tải booking hôm nay"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const runAction = async (cb, success) => {
    setMessage("");
    setError("");
    try {
      await cb();
      setMessage(success);
      fetchData();
    } catch (err) {
      setError(err.message || "Không thể cập nhật booking");
    }
  };

  const exportReport = () => {
    // Xuất báo cáo CSV cơ bản
    const headers = ["Booking ID", "Chi nhanh", "Phong", "Loai phong", "Check-in", "Check-out", "Tong tien", "Trang thai"];
    const csvContent = [
      headers.join(","),
      ...rows.map(r => `${r.id},${r.branchName || r.branchId},${r.roomNumber || r.roomId},${r.roomTypeName || ""},${r.checkInDate},${r.checkOutDate},${r.totalPrice},${r.status}`)
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `booking_hom_nay_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const filteredRows = rows.filter(r => {
    const matchStatus = filterStatus === "ALL" || r.status === filterStatus;
    const searchTarget = `${r.id} ${r.roomNumber} ${r.branchName}`.toLowerCase();
    const matchSearch = searchQuery === "" || searchTarget.includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleAddService = async () => {
    if (!serviceBookingId || !serviceId) return;
    await runAction(
      () => dashboardService.addServiceToBooking(serviceBookingId, serviceId, Number(serviceQty || 1)),
      "Thêm dịch vụ vào booking thành công"
    );
  };

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
          <div style={{ fontSize: 13, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Quản lý ca trực</div>
          <div style={{ fontWeight: 800, fontSize: 24, letterSpacing: "-0.02em" }}>Booking Hôm Nay</div>
          <div style={{ fontSize: 14, opacity: 0.8, marginTop: 4 }}>Theo dõi và xử lý nhanh các đặt phòng trong ngày</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }} onClick={fetchData}>
            ↻ Làm mới
          </button>
          <button className="btn btn-gold" onClick={exportReport}>
            📥 Xuất báo cáo (CSV)
          </button>
        </div>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Filter Bar */}
      <div className="card" style={{ padding: "16px 20px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div className="field" style={{ margin: 0, minWidth: 200 }}>
            <input 
              type="text" 
              placeholder="🔍 Tìm mã booking, số phòng..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}
            />
          </div>
          <div className="field" style={{ margin: 0 }}>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xác nhận (PENDING)</option>
              <option value="CONFIRMED">Đã xác nhận (CONFIRMED)</option>
              <option value="CHECKED_IN">Đang lưu trú (CHECKED_IN)</option>
              <option value="CHECKED_OUT">Đã trả phòng (CHECKED_OUT)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>
        </div>
        <div style={{ fontSize: 14, color: "#64748b", fontWeight: 600 }}>
          Tổng số: <span style={{ color: "#0d2238", fontWeight: 800 }}>{filteredRows.length}</span> booking
        </div>
      </div>

      {/* Data List */}
      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Đang tải dữ liệu...</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filteredRows.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              Không tìm thấy booking nào phù hợp.
            </div>
          ) : (
            filteredRows.map((row) => (
              <article key={row.id} className="card" style={{ padding: "18px 24px", display: "grid", gap: 16, transition: "transform 0.2s", cursor: "default" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}>
                  
                  {/* Info Section */}
                  <div style={{ display: "flex", gap: 20, flexWrap: "wrap", flex: 1 }}>
                    <div style={{ minWidth: 100 }}>
                      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>Mã Booking</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#0d2238" }}>#{row.id.split("-")[0]}</div>
                    </div>
                    
                    <div style={{ minWidth: 150 }}>
                      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>Phòng & Chi nhánh</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#0d2238" }}>Phòng {row.roomNumber || row.roomId}</div>
                      <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{row.roomTypeName || "Standard"} · {row.branchName || row.branchId}</div>
                    </div>

                    <div style={{ minWidth: 180 }}>
                      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>Thời gian lưu trú</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#334155" }}>
                        {new Date(row.checkInDate).toLocaleDateString("vi-VN")} → {new Date(row.checkOutDate).toLocaleDateString("vi-VN")}
                      </div>
                    </div>

                    <div style={{ minWidth: 140 }}>
                      <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>Tài chính</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "#9a7d24" }}>{formatCurrencyVnd(row.totalPrice)}</div>
                      <div style={{ fontSize: 12, color: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(row.status) ? "#16a34a" : "#ca8a04", fontWeight: 600, marginTop: 2 }}>
                        {["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"].includes(row.status) ? "✓ Đã thanh toán" : "⏳ Chưa thanh toán"}
                      </div>
                    </div>
                  </div>

                  {/* Action Section */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
                    <StatusBadge value={row.status} />
                    
                    <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                      {row.status === "CONFIRMED" && (
                         <button 
                          className="btn btn-primary" 
                          style={{ padding: "6px 14px", fontSize: 13, background: "#0d2238", color: "white", borderRadius: 8 }}
                          onClick={() => runAction(() => dashboardService.checkInBooking(row.id), "Check-in thành công")}
                        >
                          Nhanh Check-in
                        </button>
                      )}
                      
                      {row.status === "CHECKED_IN" && (
                         <button 
                          className="btn btn-gold" 
                          style={{ padding: "6px 14px", fontSize: 13, borderRadius: 8 }}
                          onClick={() => runAction(() => dashboardService.checkOutBooking(row.id), "Check-out thành công")}
                        >
                          Nhanh Check-out
                        </button>
                      )}
                      
                      <Link 
                        className="btn" 
                        style={{ padding: "6px 14px", fontSize: 13, border: "1px solid #cbd5e1", background: "#f8fafc", borderRadius: 8 }} 
                        to={PATHS.STAFF_CHECKIN.replace(":id", row.id)}
                      >
                        Chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      <div className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: 0 }}>Dịch vụ booking</h3>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Gắn dịch vụ trực tiếp vào booking hôm nay mà không cần sang trang riêng.</p>
          </div>
          <div style={{ fontSize: 13, color: "#64748b", alignSelf: "center" }}>{services.length} dịch vụ khả dụng</div>
        </div>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          <select value={serviceBookingId} onChange={(event) => setServiceBookingId(event.target.value)}>
            <option value="">Chọn booking</option>
            {filteredRows.map((row) => (
              <option key={row.id} value={row.id}>#{row.id.split("-")[0]} - Phòng {row.roomNumber || row.roomId}</option>
            ))}
          </select>
          <select value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
            <option value="">Chọn dịch vụ</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>{service.name} - {formatCurrencyVnd(service.price || 0)}</option>
            ))}
          </select>
          <input type="number" min={1} value={serviceQty} onChange={(event) => setServiceQty(Number(event.target.value || 1))} />
          <button className="btn btn-gold" onClick={handleAddService} disabled={!serviceBookingId || !serviceId}>Thêm dịch vụ</button>
        </div>
      </div>
    </section>
  );
}
