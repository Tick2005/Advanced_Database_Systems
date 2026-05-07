import { useEffect, useState, useCallback } from "react";
import { dashboardStyles } from "../../../styles/dashboardStyles";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import StatusBadge from "../../../components/common/StatusBadge";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { useTracking } from "../../../hooks/useTracking";

const ROOM_TYPES = ["Standard", "Superior", "Deluxe", "Suite", "Family", "Executive"];
const QUALITIES = ["Economy", "Business", "Premium", "Luxury"];
const INITIAL_FORM = { name: "", startsOn: "", endsOn: "", roomTypes: [], quality: "", discountPercent: 0, sellOff: false, sellOffPercent: 50, minNights: 1, maxOccupancy: "", flatAmount: 0, notes: "" };

export default function ManagerPricingRequestsPage() {
  const [rows, setRows] = useState([]);
  const [branch, setBranch] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { can } = usePermissions();
  const { track } = useTracking();

  useEffect(() => {
    const loadBranch = async () => {
      try {
        const branches = await branchService.getForManager();
        setBranch(branches?.[0]);
      } catch (err) { console.error("Error loading branch:", err); }
    };
    loadBranch();
    fetchData();
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const reqs = await dashboardService.getManagerPricingRequests();
      setRows(reqs || []);
    } catch (err) { console.error("Error fetching pricing requests:", err); }
  }, []);

  const setField = useCallback((key, val) => setForm((prev) => ({ ...prev, [key]: val })), []);
  const toggleRoomType = useCallback((rt) => setField("roomTypes", form.roomTypes.includes(rt) ? form.roomTypes.filter((r) => r !== rt) : [...form.roomTypes, rt]), [form.roomTypes, setField]);

  const submit = useCallback(async () => {
    if (!can(ACTIONS.PRICING_REQUEST_CREATE)) { setError("Bạn không có quyền gửi pricing request"); return; }
    if (!form.name.trim() || !form.startsOn || !form.endsOn) { setError("Vui lòng điền đầy đủ tên và thời gian"); return; }
    setSubmitting(true);
    try {
      await dashboardService.createManagerPricingRequest({ ...form, branchId: branch?.id || "", discountPercent: Number(form.discountPercent || 0), flatAmount: Number(form.flatAmount || 0) });
      setMessage("Đã tạo pricing request thành công");
      track("pricing_request_created", { branchId: branch?.id, name: form.name });
      fetchData();
      setForm(INITIAL_FORM);
      setShowModal(false);
    } catch (err) {
      setError(err.message || "Không thể tạo pricing request");
    } finally {
      setSubmitting(false);
    }
  }, [can, form, branch, track, fetchData]);

  return (
    <section style={dashboardStyles.gridSection}>
      <PageHeader branch={branch} />
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
      <RequestList rows={rows} />
      {showModal && <CreatePricingRequestModal form={form} setField={setField} branch={branch} submitting={submitting} onSubmit={submit} onClose={() => setShowModal(false)} toggleRoomType={toggleRoomType} />}
    </section>
  );
}

function PageHeader({ branch }) {
  return (
    <div style={dashboardStyles.headerGradient}>
      <div>
        <div style={dashboardStyles.headerSubtitle}>Định giá & yêu cầu</div>
        <div style={dashboardStyles.headerTitle}>Pricing Requests</div>
        {branch && <div style={dashboardStyles.headerDescription}>{branch.name}</div>}
      </div>
    </div>
  );
}

function RequestList({ rows }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rows.length === 0 && (<div style={{ ...dashboardStyles.summaryCard, padding: 24, textAlign: "center", color: "#94a3b8" }}>Chưa có pricing request nào.</div>)}
      {rows.map((row) => (<RequestCard key={row.id} row={row} />))}
    </div>
  );
}

function RequestCard({ row }) {
  return (
    <article style={dashboardStyles.summaryCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "grid", gap: 4, flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{row.name}</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>📅 {row.startsOn} → {row.endsOn}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {row.discountPercent > 0 && (<span style={{ background: "#fef9c3", color: "#854d0e", padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>-{row.discountPercent}%</span>)}
          <StatusBadge value={row.status} />
        </div>
      </div>
      {row.notes && <div style={{ fontSize: 13, color: "#64748b", paddingTop: 4, borderTop: "1px solid #f1f5f9" }}>📝 {row.notes}</div>}
    </article>
  );
}

function CreatePricingRequestModal({ form, setField, branch, submitting, onSubmit, onClose, toggleRoomType }) {
  return (
    <div style={dashboardStyles.modalOverlay}>
      <div style={{ ...dashboardStyles.modalCard, display: "grid", gap: 16, maxWidth: 580, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>+ Tạo Pricing Request Mới</h3>
          <button style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }} onClick={onClose}>×</button>
        </div>
        {branch && (<div style={{ padding: "8px 12px", borderRadius: 8, background: "#f0f9ff", border: "1px solid #bae6fd", fontSize: 13 }}>🏢 Chi nhánh: <strong>{branch.name}</strong> — {branch.city}</div>)}
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Tên chương trình *">
            <input placeholder="VD: Khuyến mãi hè 2025" value={form.name} onChange={(e) => setField("name", e.target.value)} style={dashboardStyles.formInput} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Ngày bắt đầu *">
              <input type="date" value={form.startsOn} onChange={(e) => setField("startsOn", e.target.value)} style={dashboardStyles.formInput} />
            </Field>
            <Field label="Ngày kết thúc *">
              <input type="date" value={form.endsOn} onChange={(e) => setField("endsOn", e.target.value)} style={dashboardStyles.formInput} />
            </Field>
          </div>
          <RoomTypeSelector form={form} toggleRoomType={toggleRoomType} />
          <QualitySelector form={form} setField={setField} />
          <Field label="Giảm giá (%)">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="range" min={0} max={80} step={5} value={form.discountPercent} onChange={(e) => setField("discountPercent", Number(e.target.value))} style={{ flex: 1 }} />
              <span style={{ fontWeight: 800, fontSize: 18, color: "#b45309", minWidth: 50 }}>{form.discountPercent}%</span>
            </div>
          </Field>
          <SelloffToggle form={form} setField={setField} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Số đêm tối thiểu">
              <input type="number" min={1} max={30} value={form.minNights} onChange={(e) => setField("minNights", Number(e.target.value))} style={dashboardStyles.formInput} />
            </Field>
            <Field label="Sức chứa tối đa">
              <input type="number" min={1} max={20} value={form.maxOccupancy} onChange={(e) => setField("maxOccupancy", e.target.value)} style={dashboardStyles.formInput} />
            </Field>
          </div>
          <Field label="Ghi chú">
            <textarea placeholder="Mô tả thêm về chương trình pricing..." value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={3} style={{ ...dashboardStyles.formInput, resize: "vertical" }} />
          </Field>
        </div>
        <PricingSummary form={form} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={onClose}>Huỷ</button>
          <button className="btn btn-gold" onClick={onSubmit} disabled={submitting}>{submitting ? "Đang gửi..." : "Gửi request"}</button>
        </div>
      </div>
    </div>
  );
}

function RoomTypeSelector({ form, toggleRoomType }) {
  return (
    <Field label="Loại phòng áp dụng">
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {ROOM_TYPES.map((rt) => (
          <button key={rt} type="button" onClick={() => toggleRoomType(rt)} style={{ padding: "5px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer", border: `1px solid ${form.roomTypes.includes(rt) ? "#0d2238" : "#e2e8f0"}`, background: form.roomTypes.includes(rt) ? "#0d2238" : "white", color: form.roomTypes.includes(rt) ? "white" : "#475569", fontWeight: form.roomTypes.includes(rt) ? 700 : 400 }}>
            {rt}
          </button>
        ))}
      </div>
    </Field>
  );
}

function QualitySelector({ form, setField }) {
  return (
    <Field label="Chất lượng dịch vụ">
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {QUALITIES.map((q) => (
          <button key={q} type="button" onClick={() => setField("quality", form.quality === q ? "" : q)} style={{ padding: "5px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer", border: `1px solid ${form.quality === q ? "#9a7d24" : "#e2e8f0"}`, background: form.quality === q ? "#fffbeb" : "white", color: form.quality === q ? "#9a7d24" : "#475569", fontWeight: form.quality === q ? 700 : 400 }}>
            {q}
          </button>
        ))}
      </div>
    </Field>
  );
}

function SelloffToggle({ form, setField }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: "#fef9c3", border: "1px solid #fde68a" }}>
      <input type="checkbox" id="selloff" checked={form.sellOff} onChange={(e) => setField("sellOff", e.target.checked)} />
      <label htmlFor="selloff" style={{ fontWeight: 700, fontSize: 14, cursor: "pointer" }}>🔥 Kích hoạt Sell-off (giảm giá đặc biệt cuối kỳ)</label>
      {form.sellOff && (<div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}><input type="number" min={0} max={90} value={form.sellOffPercent} onChange={(e) => setField("sellOffPercent", Number(e.target.value))} style={{ width: 70, padding: "6px 8px", borderRadius: 8, border: "1px solid #fde68a", fontSize: 14 }} /><span style={{ fontWeight: 700 }}>%</span></div>)}
    </div>
  );
}

function PricingSummary({ form }) {
  if (!(form.discountPercent > 0 || form.sellOff)) return null;
  return (
    <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 13 }}>
      <strong>Tóm tắt:</strong> Giảm {form.discountPercent}%
      {form.sellOff ? ` + Sell-off ${form.sellOffPercent}%` : ""}
      {form.roomTypes.length > 0 ? ` · ${form.roomTypes.join(", ")}` : " · Tất cả loại phòng"}
      {form.quality ? ` · ${form.quality}` : ""}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}
