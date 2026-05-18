import { useEffect, useState, useCallback, useMemo } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import { dashboardStyles } from "../../../styles/dashboardStyles";
import ToastMessage from "../../../components/common/ToastMessage";
import { formatCurrencyVnd } from "../../../services/presenters";

// ── helpers ──────────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  name: "",
  startsOn: "",
  endsOn: "",
  discountPercent: 10,
  surchargeMode: false,   // false = giảm giá, true = tăng giá
  branchIds: [],          // [] = tất cả chi nhánh
  roomTypeIds: [],        // [] = tất cả loại phòng
  notes: "",
};

function pctLabel(pct) {
  const n = Number(pct ?? 0);
  if (n === 0) return null;
  return n < 0 ? `+${Math.abs(n)}% tăng giá` : `-${n}% giảm giá`;
}

function scopeLabel(branchIds, branches) {
  if (!branchIds || branchIds.length === 0) return "Tất cả chi nhánh";
  const names = branchIds.map((id) => branches.find((b) => b.id === id)?.name || id.slice(0, 8));
  return names.join(", ");
}

function rtScopeLabel(roomTypeIds, roomTypes) {
  if (!roomTypeIds || roomTypeIds.length === 0) return "Tất cả loại phòng";
  // roomTypeIds từ backend là UUIDs, allRoomTypes có ids[] chứa UUIDs
  const matched = new Set();
  roomTypeIds.forEach((uuid) => {
    const rt = roomTypes.find((r) => r.ids && r.ids.includes(uuid));
    if (rt) matched.add(rt.name);
    else matched.add(uuid.slice(0, 8));
  });
  return Array.from(matched).join(", ");
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OwnerPricingPage() {
  const [branches, setBranches] = useState([]);
  const [allRoomTypes, setAllRoomTypes] = useState([]);
  const [rows, setRows] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filterActive, setFilterActive] = useState("ALL"); // ALL | ACTIVE | INACTIVE

  const load = useCallback(async () => {
    try {
      const [pricingData, branchData] = await Promise.all([
        dashboardService.getOwnerPricing(),
        branchService.getBranches(),
      ]);
      setRows(pricingData || []);
      setBranches(branchData || []);
      // Load room types — group theo tên, mỗi nhóm chứa tất cả IDs cùng tên
      // Khi chọn 1 loại phòng theo tên → áp dụng cho tất cả branch có loại phòng đó
      const rtData = await dashboardService.getOwnerRoomTypes();
      const grouped = new Map(); // name → { name, ids: UUID[] }
      (rtData || []).forEach((rt) => {
        if (!grouped.has(rt.name)) {
          grouped.set(rt.name, { id: rt.name, name: rt.name, ids: [] });
        }
        grouped.get(rt.name).ids.push(rt.id);
      });
      setAllRoomTypes(Array.from(grouped.values()));
    } catch (err) {
      setError(err.message || "Không thể tải dữ liệu");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const setField = useCallback((k, v) => setForm((p) => ({ ...p, [k]: v })), []);

  const toggleId = useCallback((field, id) => {
    setForm((p) => ({
      ...p,
      [field]: p[field].includes(id) ? p[field].filter((x) => x !== id) : [...p[field], id],
    }));
  }, []);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setOpenModal(true);
  }, []);

  const openEdit = useCallback((item) => {
    setEditingId(item.id);
    const pct = Number(item.discountPercent ?? 0);
    // Convert UUIDs từ backend → name keys để toggle UI hoạt động đúng
    const roomTypeNameKeys = [...new Set(
      (item.roomTypeIds || []).map(
        (uuid) => allRoomTypes.find((rt) => rt.ids && rt.ids.includes(uuid))?.id ?? uuid
      )
    )];
    setForm({
      name: item.name || "",
      startsOn: item.startsOn || "",
      endsOn: item.endsOn || "",
      discountPercent: Math.abs(pct) || 10,
      surchargeMode: pct < 0,
      branchIds: item.branchIds || [],
      roomTypeIds: roomTypeNameKeys,
      notes: item.notes || "",
    });
    setOpenModal(true);
  }, [allRoomTypes]);

  const save = useCallback(async () => {
    if (!form.name.trim()) { setError("Tên chương trình là bắt buộc"); return; }
    if (!form.startsOn || !form.endsOn) { setError("Ngày bắt đầu và kết thúc là bắt buộc"); return; }
    if (new Date(form.endsOn) <= new Date(form.startsOn)) { setError("Ngày kết thúc phải sau ngày bắt đầu"); return; }
    if (!form.discountPercent || Number(form.discountPercent) <= 0) { setError("Phần trăm điều chỉnh phải > 0"); return; }

    const finalDiscount = form.surchargeMode
      ? -Math.abs(Number(form.discountPercent))
      : Math.abs(Number(form.discountPercent));

    const payload = {
      name: form.name,
      startsOn: form.startsOn,
      endsOn: form.endsOn,
      discountPercent: finalDiscount,
      branchIds: form.branchIds,
      // form.roomTypeIds chứa name keys → expand thành UUIDs thực để gửi backend
      roomTypeIds: form.roomTypeIds.flatMap(
        (nameKey) => allRoomTypes.find((rt) => rt.id === nameKey)?.ids ?? []
      ),
      notes: form.notes,
    };

    setSaving(true);
    try {
      if (editingId) {
        await dashboardService.updateOwnerPricing(editingId, payload);
        setMessage("Đã cập nhật pricing season");
      } else {
        await dashboardService.createOwnerPricing(payload);
        setMessage("Đã tạo pricing season mới");
      }
      setOpenModal(false);
      load();
    } catch (err) {
      setError(err.message || "Không thể lưu");
    } finally {
      setSaving(false);
    }
  }, [editingId, form, load, allRoomTypes]);

  const toggleActive = useCallback(async (item) => {
    try {
      await dashboardService.updateOwnerPricing(item.id, { active: !item.active });
      setMessage(item.active ? "Đã tạm ngưng" : "Đã kích hoạt");
      load();
    } catch (err) {
      setError(err.message || "Không thể cập nhật");
    }
  }, [load]);

  const deleteSeason = useCallback(async (item) => {
    if (!window.confirm(`Xóa "${item.name}"? Không thể hoàn tác.`)) return;
    try {
      await dashboardService.deleteOwnerPricing(item.id);
      setMessage("Đã xóa pricing season");
      load();
    } catch (err) {
      setError(err.message || "Không thể xóa");
    }
  }, [load]);

  const filtered = useMemo(() => {
    if (filterActive === "ACTIVE") return rows.filter((r) => r.active);
    if (filterActive === "INACTIVE") return rows.filter((r) => !r.active);
    return rows;
  }, [rows, filterActive]);

  return (
    <section style={dashboardStyles.gridSection}>
      {/* Header */}
      <div style={{ ...dashboardStyles.headerGradient, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={dashboardStyles.headerSubtitle}>Owner · Quản lý giá</div>
          <div style={dashboardStyles.headerTitle}>Pricing Seasons</div>
          <div style={dashboardStyles.headerDescription}>
            Tạo và quản lý các kỳ điều chỉnh giá theo mùa / dịp lễ cho toàn hệ thống hoặc chi nhánh cụ thể.
          </div>
        </div>
        <button className="btn btn-gold" onClick={openCreate} style={{ padding: "10px 18px", fontWeight: 700, flexShrink: 0 }}>
          ➕ Tạo season mới
        </button>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Filter bar */}
      <div style={dashboardStyles.summaryCard}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Lọc:</span>
          {[["ALL", "Tất cả"], ["ACTIVE", "Đang hoạt động"], ["INACTIVE", "Tạm ngưng"]].map(([val, label]) => (
            <button key={val} type="button" onClick={() => setFilterActive(val)} style={{
              padding: "6px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer",
              border: `1px solid ${filterActive === val ? "#0d2238" : "#e2e8f0"}`,
              background: filterActive === val ? "#0d2238" : "white",
              color: filterActive === val ? "white" : "#475569",
              fontWeight: filterActive === val ? 700 : 400,
            }}>{label} ({val === "ALL" ? rows.length : val === "ACTIVE" ? rows.filter(r => r.active).length : rows.filter(r => !r.active).length})</button>
          ))}
        </div>
      </div>

      {/* Season list */}
      {filtered.length === 0 ? (
        <div style={{ ...dashboardStyles.summaryCard, padding: 32, textAlign: "center", color: "#94a3b8" }}>
          Chưa có pricing season nào.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((item) => (
            <SeasonCard
              key={item.id}
              item={item}
              branches={branches}
              allRoomTypes={allRoomTypes}
              onEdit={openEdit}
              onToggle={toggleActive}
              onDelete={deleteSeason}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {openModal && (
        <SeasonModal
          editing={editingId}
          form={form}
          setField={setField}
          toggleId={toggleId}
          saving={saving}
          branches={branches}
          allRoomTypes={allRoomTypes}
          onSave={save}
          onClose={() => setOpenModal(false)}
        />
      )}
    </section>
  );
}

// ── SeasonCard ────────────────────────────────────────────────────────────────
function SeasonCard({ item, branches, allRoomTypes, onEdit, onToggle, onDelete }) {
  const pct = Number(item.discountPercent ?? 0);
  const isIncrease = pct < 0;
  const label = pctLabel(pct);

  return (
    <article style={{
      ...dashboardStyles.summaryCard,
      opacity: item.active ? 1 : 0.65,
      borderLeft: `4px solid ${item.active ? (isIncrease ? "#ef4444" : "#22c55e") : "#cbd5e1"}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "grid", gap: 4, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 15, textDecoration: item.active ? "none" : "line-through" }}>
              {item.name}
            </span>
            {label && (
              <span style={{
                padding: "2px 10px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                background: isIncrease ? "#fee2e2" : "#dcfce7",
                color: isIncrease ? "#b91c1c" : "#16a34a",
              }}>{label}</span>
            )}
            <span style={{
              padding: "2px 8px", borderRadius: 99, fontSize: 11, fontWeight: 600,
              background: item.active ? "#dbeafe" : "#f1f5f9",
              color: item.active ? "#1d4ed8" : "#64748b",
            }}>{item.active ? "ACTIVE" : "INACTIVE"}</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            📅 {item.startsOn} → {item.endsOn}
          </div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            🏢 {scopeLabel(item.branchIds, branches)}
          </div>
          <div style={{ fontSize: 12, color: "#475569" }}>
            🛏️ {rtScopeLabel(item.roomTypeIds, allRoomTypes)}
          </div>
          {item.notes && <div style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>{item.notes}</div>}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <button className="btn" style={{ border: item.active ? "1px solid #fca5a5" : "1px solid #bbf7d0", background: item.active ? "#fee2e2" : "#dcfce7", color: item.active ? "#b91c1c" : "#16a34a", padding: "6px 10px", fontSize: 12, fontWeight: 600 }} onClick={() => onToggle(item)}>
            {item.active ? "⏸ Tạm ngưng" : "▶ Kích hoạt"}
          </button>
          <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white", padding: "6px 10px", fontSize: 12 }} onClick={() => onEdit(item)}>✏️ Sửa</button>
          <button className="btn" style={{ border: "1px solid #fca5a5", background: "#fee2e2", color: "#b91c1c", padding: "6px 10px", fontSize: 12 }} onClick={() => onDelete(item)}>🗑️</button>
        </div>
      </div>
    </article>
  );
}

// ── SeasonModal ───────────────────────────────────────────────────────────────
function SeasonModal({ editing, form, setField, toggleId, saving, branches, allRoomTypes, onSave, onClose }) {
  return (
    <div style={dashboardStyles.modalOverlay}>
      <div style={{ ...dashboardStyles.modalCard, maxWidth: 600, width: "100%", maxHeight: "92vh", overflowY: "auto", display: "grid", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{editing ? "✏️ Chỉnh sửa season" : "➕ Tạo pricing season mới"}</h3>
          <button style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }} onClick={onClose}>×</button>
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          {/* Tên */}
          <Field label="Tên chương trình *">
            <input placeholder="VD: Tết Nguyên Đán 2026" value={form.name} onChange={(e) => setField("name", e.target.value)} style={dashboardStyles.formInput} />
          </Field>

          {/* Ngày */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Ngày bắt đầu *">
              <input type="date" value={form.startsOn} onChange={(e) => setField("startsOn", e.target.value)} style={dashboardStyles.formInput} />
            </Field>
            <Field label="Ngày kết thúc *">
              <input type="date" value={form.endsOn} onChange={(e) => setField("endsOn", e.target.value)} style={dashboardStyles.formInput} />
            </Field>
          </div>

          {/* Loại điều chỉnh */}
          <Field label="Loại điều chỉnh giá">
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { val: false, label: "📉 Giảm giá", activeColor: "#16a34a", activeBg: "#dcfce7" },
                { val: true,  label: "📈 Tăng giá", activeColor: "#b91c1c", activeBg: "#fee2e2" },
              ].map(({ val, label, activeColor, activeBg }) => (
                <button key={String(val)} type="button" onClick={() => setField("surchargeMode", val)} style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
                  border: `2px solid ${form.surchargeMode === val ? activeColor : "#e2e8f0"}`,
                  background: form.surchargeMode === val ? activeBg : "white",
                  color: form.surchargeMode === val ? activeColor : "#64748b",
                }}>{label}</button>
              ))}
            </div>
          </Field>

          {/* Slider % */}
          <Field label={`${form.surchargeMode ? "Tăng" : "Giảm"} giá (%)`}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="range" min={1} max={form.surchargeMode ? 100 : 90} step={5}
                value={Math.abs(Number(form.discountPercent || 0))}
                onChange={(e) => setField("discountPercent", Number(e.target.value))}
                style={{ flex: 1 }} />
              <span style={{ fontWeight: 800, fontSize: 20, minWidth: 60, color: form.surchargeMode ? "#b91c1c" : "#b45309" }}>
                {form.surchargeMode ? "+" : "-"}{Math.abs(Number(form.discountPercent || 0))}%
              </span>
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
              {form.surchargeMode ? "Giá phòng sẽ tăng thêm phần trăm này trong kỳ" : "Khách hàng được giảm phần trăm này trong kỳ"}
            </div>
          </Field>

          {/* Chọn chi nhánh */}
          <Field label="Chi nhánh áp dụng (bỏ chọn tất cả = áp dụng toàn hệ thống)">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {branches.map((b) => (
                <button key={b.id} type="button" onClick={() => toggleId("branchIds", b.id)} style={{
                  padding: "5px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer",
                  border: `1px solid ${form.branchIds.includes(b.id) ? "#0d2238" : "#e2e8f0"}`,
                  background: form.branchIds.includes(b.id) ? "#0d2238" : "white",
                  color: form.branchIds.includes(b.id) ? "white" : "#475569",
                  fontWeight: form.branchIds.includes(b.id) ? 700 : 400,
                }}>🏢 {b.name}</button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
              {form.branchIds.length === 0 ? "✅ Áp dụng TẤT CẢ chi nhánh" : `Đã chọn ${form.branchIds.length} chi nhánh`}
            </div>
          </Field>

          {/* Chọn loại phòng */}
          <Field label="Loại phòng áp dụng (bỏ chọn tất cả = áp dụng mọi loại phòng)">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {allRoomTypes.map((rt) => (
                <button key={rt.id} type="button" onClick={() => toggleId("roomTypeIds", rt.id)} style={{
                  padding: "5px 12px", borderRadius: 99, fontSize: 12, cursor: "pointer",
                  border: `1px solid ${form.roomTypeIds.includes(rt.id) ? "#7c3aed" : "#e2e8f0"}`,
                  background: form.roomTypeIds.includes(rt.id) ? "#7c3aed" : "white",
                  color: form.roomTypeIds.includes(rt.id) ? "white" : "#475569",
                  fontWeight: form.roomTypeIds.includes(rt.id) ? 700 : 400,
                }}>🛏️ {rt.name}</button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
              {form.roomTypeIds.length === 0 ? "✅ Áp dụng TẤT CẢ loại phòng" : `Đã chọn ${form.roomTypeIds.length} loại phòng`}
            </div>
          </Field>

          {/* Ghi chú */}
          <Field label="Ghi chú">
            <textarea rows={2} placeholder="Mô tả thêm..." value={form.notes} onChange={(e) => setField("notes", e.target.value)} style={{ ...dashboardStyles.formInput, resize: "vertical" }} />
          </Field>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={onClose}>Huỷ</button>
          <button className="btn btn-gold" onClick={onSave} disabled={saving}>
            {saving ? "Đang lưu..." : editing ? "Lưu cập nhật" : "Tạo season"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}
