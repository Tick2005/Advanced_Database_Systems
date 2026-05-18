/**
 * ManagerPricingRequestsPage.jsx
 * - Load room types thực từ DB của branch (không hardcode)
 * - Bỏ "Chất lượng dịch vụ" — không có trong schema
 * - Services load đúng branch từ token
 */

import { useEffect, useState, useCallback } from "react";
import { dashboardStyles } from "../../../styles/dashboardStyles";
import { dashboardService } from "../../dashboard/dashboardService";
import StatusBadge from "../../../components/common/StatusBadge";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { trackEvent } from "../../../services/tracking";

const INITIAL_FORM = {
  name: "",
  startsOn: "",
  endsOn: "",
  roomTypeIds: [],   // UUID[] — loại phòng thực từ DB
  discountPercent: 0,
  sellOff: false,
  sellOffPercent: 50,
  minNights: 1,
  reason: "",
  notes: "",
};

export default function ManagerPricingRequestsPage() {
  const [rows, setRows] = useState([]);
  const [branch, setBranch] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);  // loại phòng thực của branch
  const [form, setForm] = useState(INITIAL_FORM);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { can } = usePermissions();

  useEffect(() => {
    const init = async () => {
      try {
        // Lấy branch từ token
        const branchData = await dashboardService.getManagerBranchInfo();
        setBranch(branchData || null);

        // Load room types của branch này
        if (branchData?.id) {
          const rt = await dashboardService.getRoomTypesByBranch(branchData.id);
          setRoomTypes(rt || []);
        }
      } catch (err) {
        console.error("Error loading branch/room types:", err);
      }
    };
    init();
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const reqs = await dashboardService.getManagerPricingRequests();
      setRows(reqs || []);
    } catch (err) {
      console.error("Error fetching pricing requests:", err);
    }
  }, []);

  const setField = useCallback((key, val) => setForm((prev) => ({ ...prev, [key]: val })), []);

  const toggleRoomType = useCallback((rtId) => {
    setForm((prev) => ({
      ...prev,
      roomTypeIds: prev.roomTypeIds.includes(rtId)
        ? prev.roomTypeIds.filter((id) => id !== rtId)
        : [...prev.roomTypeIds, rtId],
    }));
  }, []);

  const submit = useCallback(async () => {
    if (!can(ACTIONS.PRICING_REQUEST_CREATE)) { setError("Bạn không có quyền gửi pricing request"); return; }
    if (!form.name.trim() || !form.startsOn || !form.endsOn) { setError("Vui lòng điền đầy đủ tên và thời gian"); return; }
    if (!form.reason.trim()) { setError("Vui lòng nhập lý do để owner có thể xét duyệt"); return; }
    if (!branch?.id) { setError("Không xác định được chi nhánh. Vui lòng thử lại."); return; }
    if (new Date(form.endsOn) < new Date(form.startsOn)) { setError("Ngày kết thúc phải sau ngày bắt đầu"); return; }

    setSubmitting(true);
    setError("");
    try {
      // Gộp thông tin bổ sung vào notes
      const selectedRoomTypeNames = roomTypes
        .filter((rt) => form.roomTypeIds.includes(rt.id))
        .map((rt) => rt.name);

      const extraNotes = [
        selectedRoomTypeNames.length > 0 ? `Loại phòng: ${selectedRoomTypeNames.join(", ")}` : null,
        form.sellOff ? `Sell-off: ${form.sellOffPercent}%` : null,
        form.minNights > 1 ? `Tối thiểu ${form.minNights} đêm` : null,
        form.notes?.trim() || null,
      ].filter(Boolean).join(" · ");

      const payload = {
        branchId: branch.id,
        name: form.name.trim(),
        startsOn: form.startsOn,
        endsOn: form.endsOn,
        discountPercent: Number(form.discountPercent ?? 0),
        reason: form.reason.trim(),
        notes: extraNotes || null,
      };

      await dashboardService.createManagerPricingRequest(payload);
      setMessage("Đã tạo pricing request thành công");
      trackEvent("pricing_request_created", { branchId: branch.id, name: form.name });
      fetchData();
      setForm(INITIAL_FORM);
      setShowModal(false);
    } catch (err) {
      setError(err.message || "Không thể tạo pricing request");
    } finally {
      setSubmitting(false);
    }
  }, [can, form, branch, roomTypes, fetchData]);

  return (
    <section style={dashboardStyles.gridSection}>
      <PageHeader branch={branch} onCreate={() => setShowModal(true)} canCreate={can(ACTIONS.PRICING_REQUEST_CREATE)} />
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
      <RequestList rows={rows} />
      {showModal && (
        <CreatePricingRequestModal
          form={form}
          setField={setField}
          branch={branch}
          roomTypes={roomTypes}
          submitting={submitting}
          onSubmit={submit}
          onClose={() => setShowModal(false)}
          toggleRoomType={toggleRoomType}
        />
      )}
    </section>
  );
}

function PageHeader({ branch, onCreate, canCreate }) {
  return (
    <div style={{ ...dashboardStyles.headerGradient, display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div style={{ flex: "1 1 220px", minWidth: 0 }}>
        <div style={dashboardStyles.headerSubtitle}>Định giá & yêu cầu</div>
        <div style={dashboardStyles.headerTitle}>Pricing Requests</div>
        {branch && <div style={dashboardStyles.headerDescription}>{branch.name}</div>}
      </div>
      <button
        className="btn btn-primary"
        type="button"
        style={{ padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700, flexShrink: 0 }}
        onClick={onCreate}
        disabled={!canCreate}
      >
        ➕ Tạo yêu cầu mới
      </button>
    </div>
  );
}

function RequestList({ rows }) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rows.length === 0 && (
        <div style={{ ...dashboardStyles.summaryCard, padding: 24, textAlign: "center", color: "#94a3b8" }}>
          Chưa có pricing request nào.
        </div>
      )}
      {rows.map((row) => <RequestCard key={row.id} row={row} />)}
    </div>
  );
}

function RequestCard({ row }) {
  const pct = Number(row.discountPercent ?? 0);
  return (
    <article style={dashboardStyles.summaryCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "grid", gap: 4, flex: 1 }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{row.name}</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>📅 {row.startsOn} → {row.endsOn}</span>
          {row.reason && (
            <span style={{ fontSize: 12, color: "#475569" }}>💬 {row.reason}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {pct !== 0 && (
            <span style={{
              padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: pct > 0 ? "#fef9c3" : "#fee2e2",
              color: pct > 0 ? "#854d0e" : "#b91c1c",
            }}>
              {pct > 0 ? `Giảm ${pct}%` : `Tăng ${Math.abs(pct)}%`}
            </span>
          )}
          <StatusBadge value={row.status} />
        </div>
      </div>
      {row.notes && (
        <div style={{ fontSize: 13, color: "#64748b", paddingTop: 4, borderTop: "1px solid #f1f5f9" }}>
          📝 {row.notes}
        </div>
      )}
    </article>
  );
}

function CreatePricingRequestModal({ form, setField, branch, roomTypes, submitting, onSubmit, onClose, toggleRoomType }) {
  return (
    <div style={dashboardStyles.modalOverlay}>
      <div style={{ ...dashboardStyles.modalCard, display: "grid", gap: 16, maxWidth: 580, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>+ Tạo Pricing Request Mới</h3>
          <button style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }} onClick={onClose}>×</button>
        </div>

        {branch && (
          <div style={{ padding: "8px 12px", borderRadius: 8, background: "#f0f9ff", border: "1px solid #bae6fd", fontSize: 13 }}>
            🏢 Chi nhánh: <strong>{branch.name}</strong> — {branch.city}
          </div>
        )}

        <div style={{ display: "grid", gap: 12 }}>
          <Field label="Tên chương trình *">
            <input
              placeholder="VD: Kích cầu mùa mưa 2025"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              style={dashboardStyles.formInput}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Ngày bắt đầu *">
              <input type="date" value={form.startsOn} onChange={(e) => setField("startsOn", e.target.value)} style={dashboardStyles.formInput} />
            </Field>
            <Field label="Ngày kết thúc *">
              <input type="date" value={form.endsOn} onChange={(e) => setField("endsOn", e.target.value)} style={dashboardStyles.formInput} />
            </Field>
          </div>

          {/* Loại phòng áp dụng — load từ DB của branch */}
          <Field label="Loại phòng áp dụng (để trống = tất cả)">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {roomTypes.length === 0 && (
                <span style={{ fontSize: 12, color: "#94a3b8" }}>Đang tải loại phòng...</span>
              )}
              {roomTypes.map((rt) => (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => toggleRoomType(rt.id)}
                  style={{
                    padding: "5px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer",
                    border: `1px solid ${form.roomTypeIds.includes(rt.id) ? "#0d2238" : "#e2e8f0"}`,
                    background: form.roomTypeIds.includes(rt.id) ? "#0d2238" : "white",
                    color: form.roomTypeIds.includes(rt.id) ? "white" : "#475569",
                    fontWeight: form.roomTypeIds.includes(rt.id) ? 700 : 400,
                  }}
                >
                  {rt.name}
                </button>
              ))}
            </div>
          </Field>

          {/* Điều chỉnh giá */}
          <Field label="Điều chỉnh giá (%)">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 60 }}>Tăng 100%</span>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  step={5}
                  value={form.discountPercent}
                  onChange={(e) => setField("discountPercent", Number(e.target.value))}
                  style={{ flex: 1, accentColor: form.discountPercent >= 0 ? "#16a34a" : "#b91c1c" }}
                />
                <span style={{ fontSize: 11, color: "#94a3b8", minWidth: 60, textAlign: "right" }}>Giảm 100%</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="number"
                    min={-100}
                    max={100}
                    step={1}
                    value={form.discountPercent}
                    onChange={(e) => {
                      const v = Math.max(-100, Math.min(100, Number(e.target.value)));
                      setField("discountPercent", v);
                    }}
                    style={{ width: 72, padding: "6px 8px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, textAlign: "center" }}
                  />
                  <span style={{ fontSize: 13, color: "#64748b" }}>%</span>
                </div>
                <span style={{
                  padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                  background: form.discountPercent > 0 ? "#dcfce7" : form.discountPercent < 0 ? "#fee2e2" : "#f1f5f9",
                  color: form.discountPercent > 0 ? "#16a34a" : form.discountPercent < 0 ? "#b91c1c" : "#64748b",
                }}>
                  {form.discountPercent > 0
                    ? `Giảm ${form.discountPercent}%`
                    : form.discountPercent < 0
                      ? `Tăng ${Math.abs(form.discountPercent)}%`
                      : "Không thay đổi"}
                </span>
              </div>
            </div>
          </Field>

          {/* Sell-off toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 8, background: "#fef9c3", border: "1px solid #fde68a" }}>
            <input type="checkbox" id="selloff" checked={form.sellOff} onChange={(e) => setField("sellOff", e.target.checked)} />
            <label htmlFor="selloff" style={{ fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              🔥 Kích hoạt Sell-off (giảm giá đặc biệt cuối kỳ)
            </label>
            {form.sellOff && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                <input
                  type="number" min={0} max={90}
                  value={form.sellOffPercent}
                  onChange={(e) => setField("sellOffPercent", Number(e.target.value))}
                  style={{ width: 70, padding: "6px 8px", borderRadius: 8, border: "1px solid #fde68a", fontSize: 14 }}
                />
                <span style={{ fontWeight: 700 }}>%</span>
              </div>
            )}
          </div>

          <Field label="Số đêm tối thiểu">
            <input
              type="number" min={1} max={30}
              value={form.minNights}
              onChange={(e) => setField("minNights", Number(e.target.value))}
              style={dashboardStyles.formInput}
            />
          </Field>

          {/* Lý do — bắt buộc để owner duyệt */}
          <Field label="Lý do đề xuất * (owner cần biết để duyệt)">
            <textarea
              placeholder="VD: Tỷ lệ lấp đầy tháng 9-11 chỉ đạt 38%, đề xuất giảm 15% để kích cầu..."
              value={form.reason}
              onChange={(e) => setField("reason", e.target.value)}
              rows={3}
              style={{ ...dashboardStyles.formInput, resize: "vertical" }}
            />
          </Field>

          <Field label="Ghi chú thêm">
            <textarea
              placeholder="Thông tin bổ sung..."
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              rows={2}
              style={{ ...dashboardStyles.formInput, resize: "vertical" }}
            />
          </Field>
        </div>

        {/* Summary */}
        {(form.discountPercent !== 0 || form.sellOff) && (
          <div style={{
            padding: "10px 14px", borderRadius: 8, fontSize: 13,
            background: form.discountPercent >= 0 ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${form.discountPercent >= 0 ? "#bbf7d0" : "#fecaca"}`,
          }}>
            <strong>Tóm tắt:</strong>{" "}
            {form.discountPercent > 0
              ? `Giảm ${form.discountPercent}%`
              : form.discountPercent < 0
                ? `Tăng ${Math.abs(form.discountPercent)}%`
                : "Không thay đổi giá"}
            {form.sellOff ? ` + Sell-off ${form.sellOffPercent}%` : ""}
            {form.roomTypeIds.length > 0
              ? ` · ${roomTypes.filter((rt) => form.roomTypeIds.includes(rt.id)).map((rt) => rt.name).join(", ")}`
              : " · Tất cả loại phòng"}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={onClose}>Huỷ</button>
          <button className="btn btn-gold" onClick={onSubmit} disabled={submitting}>
            {submitting ? "Đang gửi..." : "Gửi request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
