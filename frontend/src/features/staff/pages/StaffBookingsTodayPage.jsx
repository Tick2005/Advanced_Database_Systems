import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";
import ToastMessage from "../../../components/common/ToastMessage";
import StatusBadge from "../../../components/common/StatusBadge";
import { PATHS } from "../../../routes/pathConstants";

export default function StaffBookingsTodayPage() {
  const [rows, setRows] = useState([]);
  const [openWalkInModal, setOpenWalkInModal] = useState(false);
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [walkIn, setWalkIn] = useState({
    customerId: "44444444-4444-4444-4444-444444444444",
    roomId: "",
    branchId: "",
    checkInDate: "",
    checkOutDate: "",
    adults: 2,
    children: 0,
    totalPrice: 0
  });
  const [service, setService] = useState({ bookingId: "", serviceCode: "BF-SET", quantity: 1, actualPrice: 120000 });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = () => {
    dashboardService.getStaffTodayBookings().then((data) => {
      setRows(data || []);
    }).catch((err) => setError(err.message || "Khong the tai booking hom nay"));
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
      setError(err.message || "Khong the cap nhat booking");
    }
  };

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div style={{
        padding: "16px 20px", borderRadius: 14,
        background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)",
        color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Ca hôm nay</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Booking hôm nay</div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>Danh sách xử lý trong ca hiện tại</div>
        </div>
      </div>
      {false && (
          <div>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Ca hôm nay</div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>Booking hôm nay</div>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>Danh sách xử lý trong ca hiện tại</div>
          </div>
        )}
      <div>
        {false && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn"
              style={{ border: "1px solid #cbd5e1", background: "white" }}
              onClick={() => setOpenWalkInModal(true)}
            >
              + Tạo walk-in
            </button>
            <button
              className="btn btn-gold"
              onClick={() => setOpenServiceModal(true)}
            >
              + Thêm dịch vụ vào booking
            </button>
          </div>
        )}
      </div>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
      <DataTable
        rows={rows}
        columns={[
          { key: "id", label: "Booking" },
          { key: "branchId", label: "Chi nhánh" },
          { key: "roomId", label: "Room" },
          { key: "period", label: "Luu tru", render: (row) => `${row.checkInDate} -> ${row.checkOutDate}` },
          { key: "status", label: "Trang thai", render: (row) => <StatusBadge value={row.status} /> },
          { key: "totalPrice", label: "Tong tien", render: (row) => <span className="mono">{row.totalPrice}</span> }
        ]}
        renderActions={(row) => (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 10px" }} to={PATHS.STAFF_CHECKIN.replace(":id", row.id)}>Check-in</Link>
            <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 10px" }} to={PATHS.STAFF_CHECKOUT.replace(":id", row.id)}>Check-out</Link>
            <button className="btn btn-primary" style={{ padding: "6px 10px" }} onClick={() => runAction(() => dashboardService.checkInBooking(row.id), "Check-in thanh cong")}>Nhanh CI</button>
            <button className="btn btn-gold" style={{ padding: "6px 10px" }} onClick={() => runAction(() => dashboardService.checkOutBooking(row.id), "Check-out thanh cong")}>Nhanh CO</button>
          </div>
        )}
      />

      {openWalkInModal && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ maxWidth: 980 }}>
            <h3 style={{ margin: 0 }}>Tạo walk-in booking</h3>
            <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
              <input placeholder="Customer ID" value={walkIn.customerId} onChange={(event) => setWalkIn((prev) => ({ ...prev, customerId: event.target.value }))} />
              <input placeholder="Room ID" value={walkIn.roomId} onChange={(event) => setWalkIn((prev) => ({ ...prev, roomId: event.target.value }))} />
              <input placeholder="Branch ID" value={walkIn.branchId} onChange={(event) => setWalkIn((prev) => ({ ...prev, branchId: event.target.value }))} />
              <input type="date" value={walkIn.checkInDate} onChange={(event) => setWalkIn((prev) => ({ ...prev, checkInDate: event.target.value }))} />
              <input type="date" value={walkIn.checkOutDate} onChange={(event) => setWalkIn((prev) => ({ ...prev, checkOutDate: event.target.value }))} />
              <input type="number" min={1} value={walkIn.adults} onChange={(event) => setWalkIn((prev) => ({ ...prev, adults: Number(event.target.value || 1) }))} />
              <input type="number" min={0} value={walkIn.children} onChange={(event) => setWalkIn((prev) => ({ ...prev, children: Number(event.target.value || 0) }))} />
              <input type="number" min={0} value={walkIn.totalPrice} onChange={(event) => setWalkIn((prev) => ({ ...prev, totalPrice: Number(event.target.value || 0) }))} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={() => setOpenWalkInModal(false)}>Đóng</button>
              <button
                className="btn btn-primary"
                onClick={() => runAction(() => dashboardService.createWalkInBooking(walkIn), "Tao walk-in thanh cong")}
              >
                Tạo booking
              </button>
            </div>
          </div>
        </div>
      )}

      {openServiceModal && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ maxWidth: 760 }}>
            <h3 style={{ margin: 0 }}>Thêm / cập nhật dịch vụ booking</h3>
            <div className="form-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
              <input placeholder="Booking ID" value={service.bookingId} onChange={(event) => setService((prev) => ({ ...prev, bookingId: event.target.value }))} />
              <input placeholder="Service code" value={service.serviceCode} onChange={(event) => setService((prev) => ({ ...prev, serviceCode: event.target.value }))} />
              <input type="number" min={1} value={service.quantity} onChange={(event) => setService((prev) => ({ ...prev, quantity: Number(event.target.value || 1) }))} />
              <input type="number" min={0} value={service.actualPrice} onChange={(event) => setService((prev) => ({ ...prev, actualPrice: Number(event.target.value || 0) }))} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={() => setOpenServiceModal(false)}>Đóng</button>
              <button
                className="btn btn-gold"
                disabled={!service.bookingId}
                onClick={() => runAction(() => dashboardService.updateBookingServices(service.bookingId, {
                  serviceCode: service.serviceCode,
                  quantity: service.quantity,
                  actualPrice: service.actualPrice
                }), "Cap nhat dich vu thanh cong")}
              >
                Cập nhật dịch vụ
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
