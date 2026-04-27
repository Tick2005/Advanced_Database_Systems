import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import StatusBadge from "../../../components/common/StatusBadge";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { useTracking } from "../../../hooks/useTracking";
import { formatCurrencyVnd } from "../../../services/presenters";

const ROOM_TYPES = ["Standard", "Superior", "Deluxe", "Suite", "Family", "Executive"];
const QUALITIES = ["Economy", "Business", "Premium", "Luxury"];

const INITIAL_FORM = {
  name: "", startsOn: "", endsOn: "", notes: "",
  discountPercent: 0, isFlat: false, flatAmount: 0,
  roomTypes: [], minNights: 1, maxOccupancy: "",
  sellOff: false, sellOffPercent: 0, quality: ""
};

export default function ManagerPricingRequestsPage() {
  const { can } = usePermissions();
  const track = useTracking("manager-pricing-requests");
  const [rows, setRows] = useState([]);
  const [branch, setBranch] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = () => {
    dashboardService.getManagerPricingRequests().then((data) => {
      setRows(data || []);
    }).catch((err) => setError(err.message || "Không thể tải pricing request"));
  };

  useEffect(() => {
    fetchData();
    branchService.getBranches().then((data) => {
      setBranch(data?.[0] || null);
    });
  }, []);

  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));
  const toggleRoomType = (rt) => setField("roomTypes", form.roomTypes.includes(rt)
    ? form.roomTypes.filter((r) => r !== rt)
    : [...form.roomTypes, rt]);

  const submit = async () => {
    if (!can(ACTIONS.PRICING_REQUEST_CREATE)) { setError("Bạn không có quyền gửi pricing request"); return; }
    if (!form.name.trim() || !form.startsOn || !form.endsOn) { setError("Vui lòng điền đầy đủ tên và thời gian"); return; }
    setSubmitting(true);
    try {
      await dashboardService.createManagerPricingRequest({
        ...form,
        branchId: branch?.id || "",
        discountPercent: Number(form.discountPercent || 0),
        flatAmount: Number(form.flatAmount || 0)
      });
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
  };

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 style={{ margin: 0 }}>💰 Pricing Requests</h1>
          {branch && <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Chi nhánh: <strong>{branch.name}</strong></p>}
        </div>
        <button
          className="btn btn-gold"
          onClick={() => setShowModal(true)}
          disabled={!can(ACTIONS.PRICING_REQUEST_CREATE)}
        >
          + Tạo request mới
        </button>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Request list */}
      <div style={{ display: "grid", gap: 10 }}>
        {rows.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Chưa có pricing request nào.</div>
        )}
        {rows.map((row) => (
          <article key={row.id} className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{row.name}</span>
                <span style={{ marginLeft: 10, fontSize: 12, color: "#64748b" }}>{row.startsOn} → {row.endsOn}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {row.discountPercent > 0 && (
                  <span style={{ background: "#fef9c3", color: "#854d0e", padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                    -{row.discountPercent}%
                  </span>
                )}
                <StatusBadge value={row.status} />
              </div>
            </div>
            {row.notes && <div style={{ fontSize: 13, color: "#64748b" }}>📝 {row.notes}</div>}
          </article>
        ))}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ display: "grid", gap: 16, maxWidth: 580, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>+ Tạo Pricing Request Mới</h3>
              <button style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }} onClick={() => setShowModal(false)}>×</button>
            </div>

            {branch && (
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "#f0f9ff", border: "1px solid #bae6fd", fontSize: 13 }}>
                🏢 Chi nhánh: <strong>{branch.name}</strong> — {branch.city}
              </div>
            )}

            <div style={{ display: "grid", gap: 12 }}>
              <Field label="Tên chương trình *">
                <input placeholder="VD: Khuyến mãi hè 2025" value={form.name} onChange={(e) => setField("name", e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }} />
              </Field>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Ngày bắt đầu *">
                  <input type="date" value={form.startsOn} onChange={(e) => setField("startsOn", e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }} />
                </Field>
                <Field label="Ngày kết thúc *">
                  <input type="date" value={form.endsOn} onChange={(e) => setField("endsOn", e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }} />
                </Field>
              </div>

              {/* Loại phòng */}
              <Field label="Loại phòng áp dụng">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {ROOM_TYPES.map((rt) => (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => toggleRoomType(rt)}
                      style={{
                        padding: "5px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer",
                        border: `1px solid ${form.roomTypes.includes(rt) ? "#0d2238" : "#e2e8f0"}`,
                        background: form.roomTypes.includes(rt) ? "#0d2238" : "white",
                        color: form.roomTypes.includes(rt) ? "white" : "#475569",
                        fontWeight: form.roomTypes.includes(rt) ? 700 : 400
                      }}
                    >
                      {rt}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Chất lượng */}
              <Field label="Chất lượng dịch vụ">
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {QUALITIES.map((q) => (
                    <button key={q} type="button" onClick={() => setField("quality", form.quality === q ? "" : q)}
                      style={{
                        padding: "5px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer",
                        border: `1px solid ${form.quality === q ? "#9a7d24" : "#e2e8f0"}`,
                        background: form.quality === q ? "#fffbeb" : "white",
                        color: form.quality === q ? "#9a7d24" : "#475569",
                        fontWeight: form.quality === q ? 700 : 400
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Giảm giá % */}
              <Field label="Giảm giá (%)">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input type="range" min={0} max={80} step={5} value={form.discountPercent}
                    onChange={(e) => setField("discountPercent", Number(e.target.value))}
                    style={{ flex: 1 }} />
                  <span style={{ fontWeight: 800, fontSize: 18, color: "#b45309", minWidth: 50 }}>
                    {form.discountPercent}%
                  </span>
                </div>
              </Field>

              {/* Sell-off */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: "#fef9c3", border: "1px solid #fde68a" }}>
                <input type="checkbox" id="selloff" checked={form.sellOff} onChange={(e) => setField("sellOff", e.target.checked)} />
                <label htmlFor="selloff" style={{ fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  🔥 Kích hoạt Sell-off (giảm giá đặc biệt cuối kỳ)
                </label>
                {form.sellOff && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                    <input type="number" min={0} max={90} value={form.sellOffPercent}
                      onChange={(e) => setField("sellOffPercent", Number(e.target.value))}
                      style={{ width: 70, padding: "6px 8px", borderRadius: 8, border: "1px solid #fde68a", fontSize: 14 }} />
                    <span style={{ fontWeight: 700 }}>%</span>
                  </div>
                )}
              </div>

              {/* Số đêm tối thiểu */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Số đêm tối thiểu">
                  <input type="number" min={1} max={30} value={form.minNights}
                    onChange={(e) => setField("minNights", Number(e.target.value))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }} />
                </Field>
                <Field label="Sức chứa tối đa">
                  <input type="number" min={1} max={20} value={form.maxOccupancy}
                    onChange={(e) => setField("maxOccupancy", e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }} />
                </Field>
              </div>

              {/* Ghi chú */}
              <Field label="Ghi chú">
                <textarea
                  placeholder="Mô tả thêm về chương trình pricing..."
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  rows={3}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, resize: "vertical", boxSizing: "border-box" }}
                />
              </Field>
            </div>

            {/* Preview */}
            {(form.discountPercent > 0 || form.sellOff) && (
              <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 13 }}>
                <strong>Tóm tắt:</strong> Giảm {form.discountPercent}%
                {form.sellOff ? ` + Sell-off ${form.sellOffPercent}%` : ""}
                {form.roomTypes.length > 0 ? ` · ${form.roomTypes.join(", ")}` : " · Tất cả loại phòng"}
                {form.quality ? ` · ${form.quality}` : ""}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={() => setShowModal(false)}>Huỷ</button>
              <button className="btn btn-gold" onClick={submit} disabled={submitting}>
                {submitting ? "Đang gửi..." : "Gửi request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
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
