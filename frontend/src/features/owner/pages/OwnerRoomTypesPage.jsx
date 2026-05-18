import { useEffect, useState, useCallback, useMemo } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import { dashboardStyles } from "../../../styles/dashboardStyles";
import ToastMessage from "../../../components/common/ToastMessage";
import { formatCurrencyVnd } from "../../../services/presenters";

const INITIAL_FORM = {
  branchId: "",
  code: "",
  name: "",
  description: "",
  basePrice: 0,
  capacity: 2,
  bedType: "",
  active: true,
};

export default function OwnerRoomTypesPage() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [rows, setRows] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const loadRoomTypes = useCallback((branchId) => {
    dashboardService.getOwnerRoomTypes(branchId || "")
      .then((data) => setRows(data || []))
      .catch((err) => setError(err.message || "Không thể tải loại phòng"));
  }, []);

  useEffect(() => {
    branchService.getBranches().then((data) => {
      setBranches(data || []);
      const firstId = data?.[0]?.id || "";
      setSelectedBranchId(firstId);
      loadRoomTypes(firstId);
    }).catch((err) => setError(err.message || "Không thể tải chi nhánh"));
  }, [loadRoomTypes]);

  const handleBranchChange = useCallback((id) => {
    setSelectedBranchId(id);
    loadRoomTypes(id);
  }, [loadRoomTypes]);

  const setField = useCallback((k, v) => setForm((p) => ({ ...p, [k]: v })), []);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setForm({ ...INITIAL_FORM, branchId: selectedBranchId });
    setOpenModal(true);
  }, [selectedBranchId]);

  const openEdit = useCallback((item) => {
    setEditingId(item.id);
    setForm({
      branchId: item.branchId || selectedBranchId,
      code: item.code || "",
      name: item.name || "",
      description: item.description || "",
      basePrice: Number(item.basePrice || 0),
      capacity: Number(item.capacity || 2),
      bedType: item.bedType || item.bed_type || "",
      active: item.active !== false,
    });
    setOpenModal(true);
  }, [selectedBranchId]);

  const save = useCallback(async () => {
    if (!form.name.trim()) { setError("Tên loại phòng là bắt buộc"); return; }
    if (!editingId && !form.code.trim()) { setError("Code là bắt buộc"); return; }
    if (!editingId && !form.branchId) { setError("Chi nhánh là bắt buộc"); return; }
    if (Number(form.basePrice) <= 0) { setError("Giá cơ bản phải > 0"); return; }
    if (Number(form.capacity) < 1) { setError("Sức chứa phải >= 1"); return; }

    setSaving(true);
    try {
      const payload = {
        branchId: form.branchId,
        code: form.code,
        name: form.name,
        description: form.description,
        basePrice: Number(form.basePrice),
        capacity: Number(form.capacity),
        bedType: form.bedType,
        active: form.active,
      };
      if (editingId) {
        await dashboardService.updateOwnerRoomType(editingId, payload);
        setMessage("Đã cập nhật loại phòng");
      } else {
        await dashboardService.createOwnerRoomType(payload);
        setMessage("Đã tạo loại phòng mới");
      }
      setOpenModal(false);
      loadRoomTypes(selectedBranchId);
    } catch (err) {
      setError(err.message || "Không thể lưu");
    } finally {
      setSaving(false);
    }
  }, [editingId, form, selectedBranchId, loadRoomTypes]);

  const deleteRoomType = useCallback(async (item) => {
    if (!window.confirm(`Xóa loại phòng "${item.name}"? Không thể hoàn tác.`)) return;
    try {
      await dashboardService.deleteOwnerRoomType(item.id);
      setMessage("Đã xóa loại phòng");
      loadRoomTypes(selectedBranchId);
    } catch (err) {
      setError(err.message || "Không thể xóa");
    }
  }, [selectedBranchId, loadRoomTypes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.name || "").toLowerCase().includes(q) ||
      (r.code || "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const currentBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <section style={dashboardStyles.gridSection}>
      {/* Header */}
      <div style={{ ...dashboardStyles.headerGradient, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={dashboardStyles.headerSubtitle}>Owner · Quản lý phòng</div>
          <div style={dashboardStyles.headerTitle}>Loại Phòng (Room Types)</div>
          {currentBranch && <div style={dashboardStyles.headerDescription}>{currentBranch.name} · {currentBranch.city}</div>}
        </div>
        <button className="btn btn-gold" onClick={openCreate} style={{ padding: "10px 18px", fontWeight: 700, flexShrink: 0 }}>
          ➕ Thêm loại phòng
        </button>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Branch selector */}
      <div style={dashboardStyles.summaryCard}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {branches.map((b) => (
            <button key={b.id} type="button" onClick={() => handleBranchChange(b.id)} style={{
              padding: "7px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
              border: `1px solid ${selectedBranchId === b.id ? "#0d2238" : "#e2e8f0"}`,
              background: selectedBranchId === b.id ? "#0d2238" : "white",
              color: selectedBranchId === b.id ? "white" : "#475569",
              fontWeight: selectedBranchId === b.id ? 700 : 400,
            }}>🏢 {b.name}</button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={dashboardStyles.summaryCard}>
        <input placeholder="🔍 Tìm theo tên / code..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ ...dashboardStyles.formInput, maxWidth: 400 }} />
      </div>

      {/* Table */}
      <div style={{ ...dashboardStyles.summaryCard, padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              {["Code", "Tên loại phòng", "Giá cơ bản", "Sức chứa", "Loại giường", "Trạng thái", ""].map((h) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{row.code}</td>
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>{row.name}</td>
                <td style={{ padding: "10px 12px", fontFamily: "monospace" }}>{formatCurrencyVnd(row.basePrice)}</td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>{row.capacity}</td>
                <td style={{ padding: "10px 12px", color: "#64748b" }}>{row.bedType || row.bed_type || "—"}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: row.active !== false ? "#dcfce7" : "#fee2e2", color: row.active !== false ? "#16a34a" : "#b91c1c" }}>
                    {row.active !== false ? "ACTIVE" : "INACTIVE"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white", padding: "5px 10px", fontSize: 12 }} onClick={() => openEdit(row)}>✏️ Sửa</button>
                    <button className="btn" style={{ border: "1px solid #fca5a5", background: "#fee2e2", color: "#b91c1c", padding: "5px 10px", fontSize: 12 }} onClick={() => deleteRoomType(row)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Chưa có loại phòng nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {openModal && (
        <RoomTypeModal
          editing={editingId}
          form={form}
          setField={setField}
          saving={saving}
          branches={branches}
          onSave={save}
          onClose={() => setOpenModal(false)}
        />
      )}
    </section>
  );
}

function RoomTypeModal({ editing, form, setField, saving, branches, onSave, onClose }) {
  return (
    <div style={dashboardStyles.modalOverlay}>
      <div style={{ ...dashboardStyles.modalCard, maxWidth: 520, width: "100%", maxHeight: "90vh", overflowY: "auto", display: "grid", gap: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{editing ? "✏️ Sửa loại phòng" : "➕ Thêm loại phòng"}</h3>
          <button style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }} onClick={onClose}>×</button>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {!editing && (
            <Field label="Chi nhánh *">
              <select value={form.branchId} onChange={(e) => setField("branchId", e.target.value)} style={dashboardStyles.formInput}>
                <option value="">-- Chọn chi nhánh --</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
          )}
          {!editing && (
            <Field label="Code *">
              <input placeholder="VD: HN-SUITE" value={form.code} onChange={(e) => setField("code", e.target.value.toUpperCase())} style={dashboardStyles.formInput} />
            </Field>
          )}
          <Field label="Tên loại phòng *">
            <input placeholder="VD: Suite Deluxe" value={form.name} onChange={(e) => setField("name", e.target.value)} style={dashboardStyles.formInput} />
          </Field>
          <Field label="Mô tả">
            <textarea rows={2} placeholder="Mô tả ngắn..." value={form.description} onChange={(e) => setField("description", e.target.value)} style={{ ...dashboardStyles.formInput, resize: "vertical" }} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Giá cơ bản (đ/đêm) *">
              <input type="number" min={0} value={form.basePrice} onChange={(e) => setField("basePrice", Number(e.target.value || 0))} style={dashboardStyles.formInput} />
            </Field>
            <Field label="Sức chứa *">
              <input type="number" min={1} max={20} value={form.capacity} onChange={(e) => setField("capacity", Number(e.target.value || 1))} style={dashboardStyles.formInput} />
            </Field>
          </div>
          <Field label="Loại giường">
            <input placeholder="VD: KING, QUEEN, DOUBLE + SINGLE" value={form.bedType} onChange={(e) => setField("bedType", e.target.value)} style={dashboardStyles.formInput} />
          </Field>
          <Field label="Trạng thái">
            <select value={form.active ? "true" : "false"} onChange={(e) => setField("active", e.target.value === "true")} style={dashboardStyles.formInput}>
              <option value="true">✅ Hoạt động</option>
              <option value="false">⛔ Tạm ngưng</option>
            </select>
          </Field>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Đang lưu..." : editing ? "Lưu cập nhật" : "Tạo loại phòng"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}
