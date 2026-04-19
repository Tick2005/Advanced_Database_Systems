import { useEffect, useState } from "react";
import DataTable from "../../../components/common/DataTable";
import StatusBadge from "../../../components/common/StatusBadge";
import ToastMessage from "../../../components/common/ToastMessage";
import { dashboardService } from "../../dashboard/dashboardService";

export default function StaffRoomStatusPage() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = () => {
    dashboardService.getStaffRoomStatus().then((data) => {
      setRows(data || []);
    }).catch((err) => setError(err.message || "Khong the tai room status"));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (roomId, status) => {
    setMessage("");
    setError("");
    try {
      await dashboardService.updateRoomStatus(roomId, status);
      setMessage("Da cap nhat trang thai phong");
      fetchData();
    } catch (err) {
      setError(err.message || "Khong the cap nhat trang thai phong");
    }
  };

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Trang thai phong</h1>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
      <DataTable
        rows={rows}
        columns={[
          { key: "roomNumber", label: "Phong" },
          { key: "roomTypeName", label: "Loai phong" },
          { key: "branchCity", label: "Chi nhanh" },
          { key: "status", label: "Trang thai", render: (row) => <StatusBadge value={row.status} /> }
        ]}
        renderActions={(row) => (
          <select value={row.status} onChange={(event) => updateStatus(row.id, event.target.value)}>
            <option value="AVAILABLE">Con phong</option>
            <option value="HELD">Tam giu</option>
            <option value="OCCUPIED">Dang co khach</option>
            <option value="MAINTENANCE">Bao tri</option>
          </select>
        )}
      />
    </section>
  );
}
