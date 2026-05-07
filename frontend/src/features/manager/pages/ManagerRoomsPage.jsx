import { useEffect, useState, useMemo, useCallback } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import { dashboardStyles } from "../../../styles/dashboardStyles";
import StatusBadge from "../../../components/common/StatusBadge";
import ToastMessage from "../../../components/common/ToastMessage";
import PaginationBar from "../../../components/common/PaginationBar";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { validateRoomForm } from "../../dashboard/domainValidators";
import { useTracking } from "../../../hooks/useTracking";
import { formatCurrencyVnd } from "../../../services/presenters";

const INITIAL_FORM = { roomTypeId: "", roomNumber: "", floor: 1, maxOccupancy: 2, rate: 0, status: "AVAILABLE", notes: "" };
const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "AVAILABLE", label: "Còn trống", bg: "#dcfce7", color: "#16a34a" },
  { value: "HELD", label: "Tạm giữ", bg: "#fef9c3", color: "#ca8a04" },
  { value: "OCCUPIED", label: "Có khách", bg: "#dbeafe", color: "#2563eb" },
  { value: "MAINTENANCE", label: "Bảo trì", bg: "#fee2e2", color: "#dc2626" }
];

export default function ManagerRoomsPage() {
  const { can } = usePermissions();
  const track = useTracking("manager-rooms");
  const [branch, setBranch] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRooms = useCallback((id) => {
    if (!id) return;
    dashboardService.getManagerRoomsByBranch(id).then((data) => {
      setRooms(data || []);
      setError("");
    }).catch((err) => setError(err.message || "Không thể tải danh sách phòng"));
  }, []);

  useEffect(() => {
    branchService.getBranches().then((data) => {
      const first = data?.[0] || null;
      setBranch(first);
      if (first?.id) {
        loadRooms(first.id);
        dashboardService.getRoomTypes().then((rt) => setRoomTypes(rt || [])).catch(() => {});
      }
    }).catch((err) => setError(err.message || "Không thể tải chi nhánh"));
  }, [loadRooms]);

  const filtered = useMemo(() => rooms.filter((item) => {
    const matchQuery = !query || item.roomNumber?.toLowerCase().includes(query.toLowerCase()) || item.roomTypeName?.toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchQuery && matchStatus;
  }), [rooms, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const openCreate = useCallback(() => {
    if (!can(ACTIONS.ROOM_CREATE)) { setError("Bạn không có quyền tạo phòng"); return; }
    setEditing(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setOpenModal(true);
  }, [can]);

  const openEdit = useCallback((row) => {
    if (!can(ACTIONS.ROOM_EDIT)) { setError("Bạn không có quyền sửa phòng"); return; }
    setEditing(row);
    setForm({ roomTypeId: row.roomTypeId || "", roomNumber: row.roomNumber || "", floor: row.floor || 1, maxOccupancy: row.maxOccupancy || 2, rate: row.rate || 0, status: row.status || "AVAILABLE", notes: row.notes || "" });
    setFieldErrors({});
    setOpenModal(true);
  }, [can]);

  const setField = useCallback((k, v) => setForm((prev) => ({ ...prev, [k]: v })), []);

  const save = useCallback(async () => {
    const nextErrors = validateRoomForm(form, { isCreate: !editing });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    try {
      if (editing) {
        await dashboardService.updateManagerRoom(editing.id, {
          maxOccupancy: Number(form.maxOccupancy || 1),
          rate: Number(form.rate || 0),
          notes: form.notes,
          status: form.status
        });
        setMessage("Đã cập nhật phòng");
        track("room_updated", { roomId: editing.id, status: form.status });
      } else {
        await dashboardService.createManagerRoom({
          roomTypeId: form.roomTypeId,
          branchId: branch?.id || "",
          roomNumber: form.roomNumber,
          floor: Number(form.floor || 1),
          maxOccupancy: Number(form.maxOccupancy || 1),
          rate: Number(form.rate || 0),
          status: form.status,
          notes: form.notes
        });
        setMessage("Đã tạo phòng mới");
        track("room_created", { roomNumber: form.roomNumber, branchId: branch?.id });
      }
      setOpenModal(false);
      setFieldErrors({});
      loadRooms(branch?.id || "");
    } catch (err) {
      setError(err.message || "Không thể lưu phòng");
    } finally {
      setSaving(false);
    }
  }, [editing, form, branch, loadRooms, track]);

  const handleQuery = useCallback((value) => {
    setQuery(value);
    setPage(1);
  }, []);

  const handleStatusFilter = useCallback((value) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  return (
    <section style={dashboardStyles.gridSection}>
      <PageHeader branch={branch} />
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
      <ActionButtons branch={branch} can={can} onCreate={openCreate} onRefresh={() => loadRooms(branch?.id || "")} />
      <FilterSection query={query} onQuery={handleQuery} statusFilter={statusFilter} onStatusFilter={handleStatusFilter} />
      <StatusStats rooms={rooms} />
      <RoomTable paginated={paginated} can={can} onEdit={openEdit} />
      <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
      {openModal && <CreateEditRoomModal editing={editing} form={form} setField={setField} fieldErrors={fieldErrors} saving={saving} branch={branch} roomTypes={roomTypes} onSave={save} onClose={() => setOpenModal(false)} />}
    </section>
  );
}

// Subcomponent: Page Header
function PageHeader({ branch }) {
  return (
    <div style={dashboardStyles.headerGradient}>
      <div>
        <div style={dashboardStyles.headerSubtitle}>Chi nhánh quản lý</div>
        <div style={dashboardStyles.headerTitle}>Quản lý Phòng</div>
        {branch && <div style={dashboardStyles.headerDescription}>{branch.name} — {branch.city}</div>}
      </div>
    </div>
  );
}

// Subcomponent: Action Buttons
function ActionButtons({ branch, can, onCreate, onRefresh }) {
  return (
    <div style={dashboardStyles.summaryCard}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={onCreate} disabled={!can("ROOM_CREATE")}>
          ➕ Thêm phòng mới
        </button>
        <button className="btn btn-gold" onClick={() => alert("Tính năng xuất Excel đang phát triển")}>
          📤 Xuất danh sách
        </button>
        <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={onRefresh}>
          🔄 Làm mới
        </button>
      </div>
    </div>
  );
}

// Subcomponent: Filter Section
function FilterSection({ query, onQuery, statusFilter, onStatusFilter }) {
  return (
    <div style={dashboardStyles.summaryCard}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input placeholder="🔍 Tìm theo số phòng / loại phòng" value={query} onChange={(e) => onQuery(e.target.value)} style={{ flex: 1, minWidth: 200, ...dashboardStyles.formInput }} />
        <select value={statusFilter} onChange={(e) => onStatusFilter(e.target.value)} style={dashboardStyles.formInput}>
          <option value="ALL">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  );
}

// Subcomponent: Status Stats
function StatusStats({ rooms }) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {STATUS_OPTIONS.map((s) => {
        const count = rooms.filter((r) => r.status === s.value).length;
        return (
          <span key={s.value} style={{ padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.color}30` }}>
            {s.label}: {count}
          </span>
        );
      })}
    </div>
  );
}

// Subcomponent: Room Table
function RoomTable({ paginated, can, onEdit }) {
  return (
    <div style={{ ...dashboardStyles.summaryCard, padding: 0, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
            {["Số phòng", "Loại phòng", "Đánh giá", "Tầng", "Sức chứa", "Giá/đêm", "Trạng thái", ""].map((h) => (
              <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginated.map((row) => (
            <RoomTableRow key={row.id} row={row} can={can} onEdit={onEdit} />
          ))}
          {paginated.length === 0 && (
            <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Không có phòng nào.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Subcomponent: Room Table Row
function RoomTableRow({ row, can, onEdit }) {
  return (
    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
      <td style={{ padding: "10px 12px", fontWeight: 700 }}>Phòng {row.roomNumber}</td>
      <td style={{ padding: "10px 12px", color: "#475569" }}>{row.roomTypeName}</td>
      <td style={{ padding: "10px 12px", color: "#0d2238", fontWeight: 700 }}>
        {row.averageRating != null ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#f59e0b' }}>★</span>
            <span style={{ fontWeight: 700 }}>{Number(row.averageRating).toFixed(1)}</span>
            {row.feedbackCount != null && <span style={{ color: '#64748b', fontSize: 12 }}>({row.feedbackCount})</span>}
          </span>
        ) : (<span style={{ color: '#94a3b8' }}>—</span>)}
      </td>
      <td style={{ padding: "10px 12px", color: "#64748b" }}>{row.floor}</td>
      <td style={{ padding: "10px 12px", color: "#64748b" }}>{row.maxOccupancy} người</td>
      <td style={{ padding: "10px 12px", fontWeight: 700, color: "#9a7d24" }}>{formatCurrencyVnd(row.rate || 0)}</td>
      <td style={{ padding: "10px 12px" }}><StatusBadge value={row.status} /></td>
      <td style={{ padding: "10px 12px" }}>
        <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 12px", fontSize: 13 }} onClick={() => onEdit(row)} disabled={!can("ROOM_EDIT")}>
          ✏️ Sửa
        </button>
      </td>
    </tr>
  );
}

// Subcomponent: Create/Edit Room Modal
function CreateEditRoomModal({ editing, form, setField, fieldErrors, saving, branch, roomTypes, onSave, onClose }) {
  return (
    <div style={dashboardStyles.modalOverlay}>
      <div style={{ ...dashboardStyles.modalCard, display: "grid", gap: 14, maxWidth: 500, width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{editing ? "✏️ Cập nhật phòng" : "➕ Tạo phòng mới"}</h3>
          <button style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }} onClick={onClose}>×</button>
        </div>
        {branch && (<div style={{ padding: "8px 12px", borderRadius: 8, background: "#f0f9ff", fontSize: 13, border: "1px solid #bae6fd" }}>
          🏢 Chi nhánh: <strong>{branch.name}</strong>
        </div>)}
        <div style={{ display: "grid", gap: 10 }}>
          {!editing && (
            <>
              <FormField label="LOẠI PHÒNG" error={fieldErrors.roomTypeId}>
                <select value={form.roomTypeId} onChange={(e) => setField("roomTypeId", e.target.value)} style={dashboardStyles.formInput}>
                  <option value="">-- Chọn loại phòng --</option>
                  {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                </select>
              </FormField>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <FormField label="SỐ PHÒNG" error={fieldErrors.roomNumber}>
                  <input placeholder="101" value={form.roomNumber} onChange={(e) => setField("roomNumber", e.target.value)} style={dashboardStyles.formInput} />
                </FormField>
                <FormField label="TẦNG">
                  <input type="number" min={1} value={form.floor} onChange={(e) => setField("floor", Number(e.target.value || 1))} style={dashboardStyles.formInput} />
                </FormField>
              </div>
            </>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FormField label="SỨC CHỨA" error={fieldErrors.maxOccupancy}>
              <input type="number" min={1} value={form.maxOccupancy} onChange={(e) => setField("maxOccupancy", Number(e.target.value || 1))} style={dashboardStyles.formInput} />
            </FormField>
            <FormField label="GIÁ / ĐÊM" error={fieldErrors.rate}>
              <input type="number" min={0} value={form.rate} onChange={(e) => setField("rate", Number(e.target.value || 0))} style={dashboardStyles.formInput} />
            </FormField>
          </div>
          <FormField label="TRẠNG THÁI">
            <select value={form.status} onChange={(e) => setField("status", e.target.value)} style={dashboardStyles.formInput}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </FormField>
          <FormField label="GHI CHÚ">
            <textarea placeholder="Ghi chú thêm về phòng..." rows={2} value={form.notes} onChange={(e) => setField("notes", e.target.value)} style={{ ...dashboardStyles.formInput, resize: "vertical" }} />
          </FormField>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={onClose}>Huỷ</button>
          <button className="btn btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Đang lưu..." : (editing ? "Lưu cập nhật" : "Tạo phòng")}
          </button>
        </div>
      </div>
    </div>
  );
}

// Subcomponent: Form Field
function FormField({ label, error, children }) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>{label}</label>
      {children}
      {error && <small style={{ color: "#b91c1c" }}>{error}</small>}
    </div>
  );
}
