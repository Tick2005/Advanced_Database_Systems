import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import ToastMessage from "../../../components/common/ToastMessage";
import { PATHS } from "../../../routes/pathConstants";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { validateRoomForm } from "../../dashboard/domainValidators";
import { useTracking } from "../../../hooks/useTracking";

export default function ManagerRoomCreatePage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const track = useTracking("manager-room-create");
  const [branches, setBranches] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ branchId: "", roomTypeId: "", roomNumber: "", maxOccupancy: 2, rate: 1000000 });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    branchService.getBranches().then((data) => {
      setBranches(data || []);
      setForm((prev) => ({ ...prev, branchId: data?.[0]?.id || "" }));
    });
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!can(ACTIONS.ROOM_CREATE)) {
      setError("Ban khong co quyen tao phong");
      return;
    }

    const nextErrors = validateRoomForm(form, { isCreate: true });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setMessage("");
    setError("");
    setSaving(true);
    try {
      await dashboardService.createManagerRoom(form);
      setMessage("Da tao phong moi");
      track("room_created", { branchId: form.branchId, roomNumber: form.roomNumber });
      setTimeout(() => navigate(PATHS.MANAGER_ROOMS), 700);
    } catch (err) {
      setError(err.message || "Khong the tao phong");
      track("room_create_failed", { branchId: form.branchId, reason: err.message || "unknown" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card" style={{ padding: 18, display: "grid", gap: 10 }}>
      <h1 style={{ margin: 0 }}>Tao phong moi</h1>
      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <div className="field">
          <label>Chi nhanh</label>
          <select value={form.branchId} onChange={(event) => setForm((prev) => ({ ...prev, branchId: event.target.value }))}>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
            ))}
          </select>
        </div>
        <div className="field"><label>Room type ID</label><input value={form.roomTypeId} onChange={(event) => setForm((prev) => ({ ...prev, roomTypeId: event.target.value }))} /></div>
        {fieldErrors.roomTypeId && <small style={{ color: "#b91c1c" }}>{fieldErrors.roomTypeId}</small>}
        <div className="field"><label>So phong</label><input value={form.roomNumber} onChange={(event) => setForm((prev) => ({ ...prev, roomNumber: event.target.value }))} /></div>
        {fieldErrors.roomNumber && <small style={{ color: "#b91c1c" }}>{fieldErrors.roomNumber}</small>}
        <div className="field"><label>Suc chua</label><input type="number" min={1} value={form.maxOccupancy} onChange={(event) => setForm((prev) => ({ ...prev, maxOccupancy: Number(event.target.value || 1) }))} /></div>
        {fieldErrors.maxOccupancy && <small style={{ color: "#b91c1c" }}>{fieldErrors.maxOccupancy}</small>}
        <div className="field"><label>Gia</label><input type="number" min={0} value={form.rate} onChange={(event) => setForm((prev) => ({ ...prev, rate: Number(event.target.value || 0) }))} /></div>
        {fieldErrors.rate && <small style={{ color: "#b91c1c" }}>{fieldErrors.rate}</small>}
        <button className="btn btn-primary" disabled={!can(ACTIONS.ROOM_CREATE) || saving}>Tao phong</button>
      </form>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
    </section>
  );
}
