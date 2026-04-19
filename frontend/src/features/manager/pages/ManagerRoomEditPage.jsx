import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import ToastMessage from "../../../components/common/ToastMessage";
import { PATHS } from "../../../routes/pathConstants";

export default function ManagerRoomEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ roomTypeId: "", roomNumber: "", maxOccupancy: 2, rate: 0, status: "AVAILABLE" });
  const [branchId, setBranchId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    branchService.getBranches().then((data) => {
      const first = data?.[0]?.id || "";
      setBranches(data || []);
      setBranchId(first);
    }).catch((err) => setError(err.message || "Khong the tai branch"));
  }, []);

  useEffect(() => {
    if (!branchId) return;
    dashboardService.getManagerRoomsByBranch(branchId).then((data) => {
      setRooms(data || []);
    }).catch((err) => setError(err.message || "Khong the tai room"));
  }, [branchId]);

  const room = useMemo(() => rooms.find((item) => item.id === id), [rooms, id]);

  useEffect(() => {
    if (!room) return;
    setForm({
      roomTypeId: room.roomTypeId || "",
      roomNumber: room.roomNumber || "",
      maxOccupancy: room.maxOccupancy || 2,
      rate: room.rate || 0,
      status: room.status || "AVAILABLE"
    });
  }, [room]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await dashboardService.updateManagerRoom(id, form);
      setMessage("Da cap nhat phong");
      setTimeout(() => navigate(PATHS.MANAGER_ROOMS), 700);
    } catch (err) {
      setError(err.message || "Khong the cap nhat phong");
    }
  };

  return (
    <section className="card" style={{ padding: 18, display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0 }}>Sua phong</h1>
      {!room && <div style={{ color: "#b91c1c" }}>Khong tim thay phong trong branch hien tai.</div>}
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <div className="field"><label>Room type ID</label><input value={form.roomTypeId} onChange={(event) => setForm((prev) => ({ ...prev, roomTypeId: event.target.value }))} /></div>
        <div className="field"><label>So phong</label><input value={form.roomNumber} onChange={(event) => setForm((prev) => ({ ...prev, roomNumber: event.target.value }))} /></div>
        <div className="field"><label>Suc chua</label><input type="number" min={1} value={form.maxOccupancy} onChange={(event) => setForm((prev) => ({ ...prev, maxOccupancy: Number(event.target.value || 1) }))} /></div>
        <div className="field"><label>Gia</label><input type="number" min={0} value={form.rate} onChange={(event) => setForm((prev) => ({ ...prev, rate: Number(event.target.value || 0) }))} /></div>
        <div className="field"><label>Trang thai</label>
          <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="HELD">HELD</option>
            <option value="OCCUPIED">OCCUPIED</option>
            <option value="MAINTENANCE">MAINTENANCE</option>
          </select>
        </div>
        <button className="btn btn-primary" disabled={!room}>Cap nhat</button>
      </form>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
    </section>
  );
}
