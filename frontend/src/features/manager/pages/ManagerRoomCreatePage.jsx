import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
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
    <section className="container page-shell" style={{ display: "grid", gap: 14, maxWidth: 600 }}>
      <div className="page-heading" style={{ marginBottom: 0 }}>
        <div>
          <h1>Tạo phòng mới</h1>
          <p>Thêm phòng mới vào chi nhánh. Vui lòng điền đầy đủ thông tin cần thiết.</p>
        </div>
      </div>
      <article className="card" style={{ padding: 18, display: "grid", gap: 14 }}>
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Chi nhánh *</label>
            <select value={form.branchId} onChange={(event) => setForm((prev) => ({ ...prev, branchId: event.target.value }))} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
              ))}
            </select>
            {fieldErrors.branchId && <small style={{ color: "#b91c1c", marginTop: 4, display: "block" }}>❌ {fieldErrors.branchId}</small>}
          </div>
          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Loại phòng ID *</label>
            <input placeholder="VD: room-type-001" value={form.roomTypeId} onChange={(event) => setForm((prev) => ({ ...prev, roomTypeId: event.target.value }))} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
            {fieldErrors.roomTypeId && <small style={{ color: "#b91c1c", marginTop: 4, display: "block" }}>❌ {fieldErrors.roomTypeId}</small>}
          </div>
          <div className="field">
            <label style={{ fontWeight: 700, fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Số phòng *</label>
            <input placeholder="VD: 101, 102, etc." value={form.roomNumber} onChange={(event) => setForm((prev) => ({ ...prev, roomNumber: event.target.value }))} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
            {fieldErrors.roomNumber && <small style={{ color: "#b91c1c", marginTop: 4, display: "block" }}>❌ {fieldErrors.roomNumber}</small>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sức chứa *</label>
              <input type="number" min={1} value={form.maxOccupancy} onChange={(event) => setForm((prev) => ({ ...prev, maxOccupancy: Number(event.target.value || 1) }))} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
              {fieldErrors.maxOccupancy && <small style={{ color: "#b91c1c", marginTop: 4, display: "block" }}>❌ {fieldErrors.maxOccupancy}</small>}
            </div>
            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Giá (đồng) *</label>
              <input type="number" min={0} value={form.rate} onChange={(event) => setForm((prev) => ({ ...prev, rate: Number(event.target.value || 0) }))} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
              {fieldErrors.rate && <small style={{ color: "#b91c1c", marginTop: 4, display: "block" }}>❌ {fieldErrors.rate}</small>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
            <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.MANAGER_ROOMS}>Quay lại</Link>
            <button type="submit" className="btn btn-primary" disabled={!can(ACTIONS.ROOM_CREATE) || saving}>
              {saving ? "Đang tạo..." : "✓ Tạo phòng"}
            </button>
          </div>
        </form>
      </article>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
    </section>
  );
}
