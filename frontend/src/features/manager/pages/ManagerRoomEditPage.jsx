import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import ToastMessage from "../../../components/common/ToastMessage";
import { PATHS } from "../../../routes/pathConstants";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { validateRoomForm } from "../../dashboard/domainValidators";
import { useTracking } from "../../../hooks/useTracking";

export default function ManagerRoomEditPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const track = useTracking("manager-room-edit");
  const { id } = useParams();
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ roomTypeId: "", roomNumber: "", maxOccupancy: 2, rate: 0, status: "AVAILABLE" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
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
    if (!can(ACTIONS.ROOM_EDIT)) {
      setError("Ban khong co quyen cap nhat phong");
      return;
    }

    const nextErrors = validateRoomForm(form, { isCreate: false });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      await dashboardService.updateManagerRoom(id, form);
      setMessage("Da cap nhat phong");
      track("room_updated", { roomId: id, status: form.status });
      setTimeout(() => navigate(PATHS.MANAGER_ROOMS), 700);
    } catch (err) {
      setError(err.message || "Khong the cap nhat phong");
      track("room_update_failed", { roomId: id, reason: err.message || "unknown" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="container page-shell" style={{ display: "grid", gap: 14, maxWidth: 600 }}>
      <div className="page-heading" style={{ marginBottom: 0 }}>
        <div>
          <h1>✏️ Chỉnh sửa phòng</h1>
          <p>Cập nhật thông tin phòng, giá, sức chứa hoặc trạng thái hoạt động.</p>
        </div>
      </div>
      {!room && (
        <div className="card" style={{ padding: 18, display: "grid", gap: 10, background: "#fee2e2", border: "1px solid #fecaca" }}>
          <div style={{ color: "#b91c1c", fontWeight: 700 }}>❌ Không tìm thấy phòng</div>
          <p style={{ margin: 0, fontSize: 13, color: "#991b1b" }}>Phòng không tồn tại trong chi nhánh hiện tại hoặc đã bị xóa.</p>
        </div>
      )}
      {room && (
        <article className="card" style={{ padding: 18, display: "grid", gap: 14 }}>
          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            <div className="field">
              <label style={{ fontWeight: 700, fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Loại phòng ID *</label>
              <input value={form.roomTypeId} onChange={(event) => setForm((prev) => ({ ...prev, roomTypeId: event.target.value }))} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
              {fieldErrors.roomTypeId && <small style={{ color: "#b91c1c", marginTop: 4, display: "block" }}>❌ {fieldErrors.roomTypeId}</small>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Số phòng *</label>
                <input value={form.roomNumber} onChange={(event) => setForm((prev) => ({ ...prev, roomNumber: event.target.value }))} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
              </div>
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sức chứa *</label>
                <input type="number" min={1} value={form.maxOccupancy} onChange={(event) => setForm((prev) => ({ ...prev, maxOccupancy: Number(event.target.value || 1) }))} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
                {fieldErrors.maxOccupancy && <small style={{ color: "#b91c1c", marginTop: 4, display: "block" }}>❌ {fieldErrors.maxOccupancy}</small>}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Giá (đồng) *</label>
                <input type="number" min={0} value={form.rate} onChange={(event) => setForm((prev) => ({ ...prev, rate: Number(event.target.value || 0) }))} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" }} />
                {fieldErrors.rate && <small style={{ color: "#b91c1c", marginTop: 4, display: "block" }}>❌ {fieldErrors.rate}</small>}
              </div>
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: 13, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trạng thái *</label>
                <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))} style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}>
                  <option value="AVAILABLE">✅ Còn trống</option>
                  <option value="HELD">⏳ Tạm giữ</option>
                  <option value="OCCUPIED">🛏️ Đang có khách</option>
                  <option value="MAINTENANCE">🔧 Bảo trì</option>
                </select>
                {fieldErrors.status && <small style={{ color: "#b91c1c", marginTop: 4, display: "block" }}>❌ {fieldErrors.status}</small>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8 }}>
              <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.MANAGER_ROOMS}>Quay lại</Link>
              <button type="submit" className="btn btn-primary" disabled={!room || !can(ACTIONS.ROOM_EDIT) || saving}>
                {saving ? "Đang cập nhật..." : "✓ Cập nhật"}
              </button>
            </div>
          </form>
        </article>
      )}
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
    </section>
  );
}
