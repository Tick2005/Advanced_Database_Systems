import { useEffect, useState, useMemo } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { validatePricingForm } from "../../dashboard/domainValidators";
import { useTracking } from "../../../hooks/useTracking";
import { formatCurrencyVnd } from "../../../services/presenters";

const INITIAL_FORM = { name: "", startsOn: "", endsOn: "", discountPercent: 0, roomTypes: [], notes: "" };

export default function OwnerPricingPage() {
  const { can } = usePermissions();
  const track = useTracking("owner-pricing");
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [roomTypes, setRoomTypes] = useState([]);
  const [rows, setRows] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchPricing = (branchId) => {
    if (!branchId) return;
    dashboardService.getOwnerPricingByBranch(branchId)
      .then((data) => setRows(data || []))
      .catch((err) => setError(err.message || "Không thể tải pricing"));
  };

  const fetchRoomTypes = (branchId) => {
    if (!branchId) return;
    dashboardService.getRoomTypesByBranch(branchId)
      .then((data) => setRoomTypes(data || []))
      .catch(() => setRoomTypes([]));
  };

  useEffect(() => {
    branchService.getBranches().then((data) => {
      setBranches(data || []);
      const firstId = data?.[0]?.id || "";
      setSelectedBranchId(firstId);
      fetchPricing(firstId);
      fetchRoomTypes(firstId);
    }).catch((err) => setError(err.message || "Không thể tải chi nhánh"));
  }, []);

  const handleBranchChange = (id) => {
    setSelectedBranchId(id);
    fetchPricing(id);
    fetchRoomTypes(id);
  };

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const toggleRoomType = (id) => setField("roomTypes", form.roomTypes.includes(id) ? form.roomTypes.filter((r) => r !== id) : [...form.roomTypes, id]);

  const openCreate = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setOpenModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({ name: item.name || "", startsOn: item.startsOn || "", endsOn: item.endsOn || "", discountPercent: item.discountPercent || 0, roomTypes: item.roomTypes || [], notes: item.notes || "" });
    setFieldErrors({});
    setOpenModal(true);
  };

  const save = async () => {
    if (!can(editingId ? ACTIONS.PRICING_UPDATE : ACTIONS.PRICING_CREATE)) {
      setError("Bạn không có quyền thực hiện hành động này"); return;
    }
    const nextErrors = validatePricingForm({ ...form, branchId: selectedBranchId });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const payload = { ...form, branchId: selectedBranchId, discountPercent: Number(form.discountPercent || 0) };
      if (editingId) {
        await dashboardService.updateOwnerPricing(editingId, payload);
        setMessage("Đã cập nhật pricing");
        track("pricing_updated", { id: editingId });
      } else {
        await dashboardService.createOwnerPricing(payload);
        setMessage("Đã tạo pricing mới");
        track("pricing_created", { branchId: selectedBranchId, name: form.name });
      }
      setOpenModal(false);
      fetchPricing(selectedBranchId);
    } catch (err) {
      setError(err.message || "Không thể lưu pricing");
      track("pricing_save_failed", { reason: err.message || "unknown" });
    } finally {
      setSaving(false);
    }
  };

  const currentBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div style={{
        padding: "16px 20px", borderRadius: 14,
        background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)",
        color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Quản lý giá</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Pricing Strategy</div>
          {currentBranch && <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>{currentBranch.name} · {currentBranch.city}</div>}
        </div>
      </div>
      {false && <button className="btn btn-gold" onClick={openCreate} disabled={!can(ACTIONS.PRICING_CREATE) || !selectedBranchId}>
          ➕ Tạo pricing mới
        </button>}

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Branch selector */}
      <div className="card" style={{ padding: 14, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {branches.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => handleBranchChange(b.id)}
            style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
              border: `1px solid ${selectedBranchId === b.id ? "#0d2238" : "#e2e8f0"}`,
              background: selectedBranchId === b.id ? "#0d2238" : "white",
              color: selectedBranchId === b.id ? "white" : "#475569",
              fontWeight: selectedBranchId === b.id ? 700 : 400
            }}
          >
            🏢 {b.name}
          </button>
        ))}
        </div>
      </div>

      {/* Pricing list grouped by room type */}
      {roomTypes.length > 0 && (
        <div style={{ display: "grid", gap: 14 }}>
          {roomTypes.map((rt) => {
            const rtPricings = rows.filter((r) => (r.roomTypes || []).includes(rt.id) || r.roomTypeId === rt.id);
            return (
              <article key={rt.id} className="card" style={{ padding: "14px 16px", display: "grid", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>🛏️ {rt.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Giá cơ bản: <strong>{formatCurrencyVnd(rt.basePrice || rt.rate || 0)}</strong>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, background: "#f1f5f9", color: "#64748b", padding: "4px 10px", borderRadius: 6, fontWeight: 700 }}>{rtPricings.length} chương trình</span>
                </div>
                {rtPricings.length > 0 ? (
                  <div style={{ display: "grid", gap: 8, paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
                    {rtPricings.map((p) => (
                      <div key={p.id} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0",
                        flexWrap: "wrap"
                      }}>
                        <div style={{ display: "grid", gap: 3, flex: 1 }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</span>
                          <span style={{ fontSize: 12, color: "#64748b" }}>{p.startsOn} → {p.endsOn}</span>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          {p.discountPercent > 0 && (
                            <span style={{ background: "#dcfce7", color: "#16a34a", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                              -{p.discountPercent}%
                            </span>
                          )}
                          <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white", padding: "6px 10px", fontSize: 12 }} onClick={() => openEdit(p)}>✏️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "#94a3b8", fontStyle: "italic", paddingTop: 6 }}>Chưa có chương trình pricing cho loại phòng này.</div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Fallback: all pricings without room type grouping */}
      {roomTypes.length === 0 && rows.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          {rows.map((p) => (
            <article key={p.id} className="card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{p.startsOn} → {p.endsOn} · -{p.discountPercent}%</div>
              </div>
              <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white", padding: "6px 12px", fontSize: 13 }} onClick={() => openEdit(p)}>✏️ Sửa</button>
            </article>
          ))}
        </div>
      )}

      {rows.length === 0 && selectedBranchId && (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
          Chi nhánh này chưa có chương trình pricing nào.
        </div>
      )}

      {/* Modal */}
      {openModal && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ display: "grid", gap: 14, maxWidth: 540, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{editingId ? "✏️ Chỉnh sửa pricing" : "➕ Tạo pricing mới"}</h3>
              <button style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }} onClick={() => setOpenModal(false)}>×</button>
            </div>

            {currentBranch && (
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "#f0f9ff", border: "1px solid #bae6fd", fontSize: 13 }}>
                🏢 <strong>{currentBranch.name}</strong> — {currentBranch.city}
              </div>
            )}

            <div style={{ display: "grid", gap: 12 }}>
              <F label="Tên chương trình *">
                <input placeholder="VD: Hè rực rỡ 2025" value={form.name} onChange={(e) => setField("name", e.target.value)}
                  style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${fieldErrors.name ? "#fca5a5" : "#e2e8f0"}`, fontSize: 14 }} />
                {fieldErrors.name && <small style={{ color: "#b91c1c" }}>{fieldErrors.name}</small>}
              </F>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <F label="Ngày bắt đầu *">
                  <input type="date" value={form.startsOn} onChange={(e) => setField("startsOn", e.target.value)}
                    style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${fieldErrors.dateRange ? "#fca5a5" : "#e2e8f0"}`, fontSize: 14 }} />
                </F>
                <F label="Ngày kết thúc *">
                  <input type="date" value={form.endsOn} onChange={(e) => setField("endsOn", e.target.value)}
                    style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${fieldErrors.dateRange ? "#fca5a5" : "#e2e8f0"}`, fontSize: 14 }} />
                </F>
              </div>
              {fieldErrors.dateRange && <small style={{ color: "#b91c1c" }}>{fieldErrors.dateRange}</small>}

              {/* Loại phòng */}
              {roomTypes.length > 0 && (
                <F label="Loại phòng áp dụng">
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {roomTypes.map((rt) => (
                      <button key={rt.id} type="button" onClick={() => toggleRoomType(rt.id)}
                        style={{
                          padding: "5px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer",
                          border: `1px solid ${form.roomTypes.includes(rt.id) ? "#0d2238" : "#e2e8f0"}`,
                          background: form.roomTypes.includes(rt.id) ? "#0d2238" : "white",
                          color: form.roomTypes.includes(rt.id) ? "white" : "#475569",
                          fontWeight: form.roomTypes.includes(rt.id) ? 700 : 400
                        }}
                      >
                        {rt.name}
                      </button>
                    ))}
                  </div>
                </F>
              )}

              <F label="Giảm giá (%)">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <input type="range" min={0} max={80} step={5} value={form.discountPercent}
                    onChange={(e) => setField("discountPercent", Number(e.target.value))}
                    style={{ flex: 1 }} />
                  <span style={{ fontWeight: 800, fontSize: 20, color: "#b45309", minWidth: 50 }}>
                    {form.discountPercent}%
                  </span>
                </div>
                {fieldErrors.discountPercent && <small style={{ color: "#b91c1c" }}>{fieldErrors.discountPercent}</small>}
              </F>

              <F label="Ghi chú">
                <textarea rows={3} placeholder="Mô tả thêm..." value={form.notes} onChange={(e) => setField("notes", e.target.value)}
                  style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, resize: "vertical" }} />
              </F>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={() => setOpenModal(false)}>Huỷ</button>
              <button className="btn btn-gold" onClick={save} disabled={saving}>
                {saving ? "Đang lưu..." : (editingId ? "Lưu cập nhật" : "Tạo pricing")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function F({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}
