import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";
import ToastMessage from "../../../components/common/ToastMessage";
import StatusBadge from "../../../components/common/StatusBadge";
import { PATHS } from "../../../routes/pathConstants";

export default function StaffBookingsTodayPage() {
  const [rows, setRows] = useState([]);
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
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Booking hom nay</h1>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
      <DataTable
        rows={rows}
        columns={[
          { key: "id", label: "Booking" },
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
    </section>
  );
}
