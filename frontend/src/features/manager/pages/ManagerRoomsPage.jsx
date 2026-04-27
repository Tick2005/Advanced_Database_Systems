import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import StatusBadge from "../../../components/common/StatusBadge";
import ToastMessage from "../../../components/common/ToastMessage";
import PaginationBar from "../../../components/common/PaginationBar";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { validateRoomForm } from "../../dashboard/domainValidators";
import { useTracking } from "../../../hooks/useTracking";
import { formatCurrencyVnd } from "../../../services/presenters";
import { useMemo } from "react";

const INITIAL_FORM = { roomTypeId: "", roomNumber: "", floor: 1, maxOccupancy: 2, rate: 0, status: "AVAILABLE", notes: "" };
const PAGE_SIZE = 10;

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

  const loadRooms = (id) => {
    if (!id) return;
    dashboardService.getManagerRoomsByBranch(id).then((data) => {
      setRooms(data || []);
      setError("");
    }).catch((err) => setError(err.message || "Không thể tải danh sách phòng"));
  };

  useEffect(() => {
    branchService.getBranches().then((data) => {
      const first = data?.[0] || null;
      setBranch(first);
      if (first?.id) {
        loadRooms(first.id);
        dashboardService.getRoomTypes().then((rt) => setRoomTypes(rt || [])).catch(() => {});
      }
    }).catch((err) => setError(err.message || "Không thể tải chi nhánh"));
  }, []);

  const filtered = useMemo(() => rooms.filter((item) => {
    const matchQuery = !query
      || item.roomNumber?.toLowerCase().includes(query.toLowerCase())
      || item.roomTypeName?.toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchQuery && matchStatus;
  }), [rooms, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const openCreate = () => {
    if (!can(ACTIONS.ROOM_CREATE)) { setError("Bạn không có quyền tạo phòng"); return; }
    setEditing(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setOpenModal(true);
  };

  const openEdit = (row) => {
    if (!can(ACTIONS.ROOM_EDIT)) { setError("Bạn không có quyền sửa phòng"); return; }
    setEditing(row);
    setForm({ roomTypeId: row.roomTypeId || "", roomNumber: row.roomNumber || "", floor: row.floor || 1, maxOccupancy: row.maxOccupancy || 2, rate: row.rate || 0, status: row.status || "AVAILABLE", notes: row.notes || "" });
    setFieldErrors({});
    setOpenModal(true);
  };

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
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
  };

  const STATUS_OPTIONS = [
    { value: "AVAILABLE", label: "Còn trống", bg: "#dcfce7", color: "#16a34a" },
    { value: "HELD", label: "Tạm giữ", bg: "#fef9c3", color: "#ca8a04" },
    { value: "OCCUPIED", label: "Có khách", bg: "#dbeafe", color: "#2563eb" },
    { value: "MAINTENANCE", label: "Bảo trì", bg: "#fee2e2", color: "#dc2626" }
  ];

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <div>
        <h1 style={{ margin: 0 }}>🏨 Quản lý Phòng</h1>
        {branch && <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Chi nhánh: <strong>{branch.name}</strong> — {branch.city}</p>}
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* 3 buttons on top */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-primary" onClick={openCreate} disabled={!can(ACTIONS.ROOM_CREATE)}>
          ➕ Thêm phòng mới
        </button>
        <button
          className="btn btn-gold"
          onClick={() => { /* Export */ alert("Tính năng xuất Excel đang phát triển"); }}
        >
          📤 Xuất danh sách
        </button>
        <button
          className="btn"
          style={{ border: "1px solid #e2e8f0", background: "white" }}
          onClick={() => loadRooms(branch?.id || "")}
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Tìm theo số phòng / loại phòng"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 200, padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Quick stats */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {STATUS_OPTIONS.map((s) => {
          const count = rooms.filter((r) => r.status === s.value).length;
          return (
            <span key={s.value} style={{
              padding: "4px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700,
              background: s.bg, color: s.color, border: `1px solid ${s.color}30`
            }}>
              {s.label}: {count}
            </span>
          );
        })}
      </div>

      {/* Room table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              {["Số phòng", "Loại phòng", "Tầng", "Sức chứa", "Giá/đêm", "Trạng thái", ""].map((h) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 12, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 12px", fontWeight: 700 }}>Phòng {row.roomNumber}</td>
                <td style={{ padding: "10px 12px", color: "#475569" }}>{row.roomTypeName}</td>
                <td style={{ padding: "10px 12px", color: "#64748b" }}>{row.floor}</td>
                <td style={{ padding: "10px 12px", color: "#64748b" }}>{row.maxOccupancy} người</td>
                <td style={{ padding: "10px 12px", fontWeight: 700, color: "#9a7d24" }}>{formatCurrencyVnd(row.rate || 0)}</td>
                <td style={{ padding: "10px 12px" }}><StatusBadge value={row.status} /></td>
                <td style={{ padding: "10px 12px" }}>
                  <button
                    className="btn"
                    style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 12px", fontSize: 13 }}
                    onClick={() => openEdit(row)}
                    disabled={!can(ACTIONS.ROOM_EDIT)}
                  >
                    ✏️ Sửa
                  </button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Không có phòng nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />

      {/* Modal */}
      {openModal && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ display: "grid", gap: 14, maxWidth: 500, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{editing ? "✏️ Cập nhật phòng" : "➕ Tạo phòng mới"}</h3>
              <button style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }} onClick={() => setOpenModal(false)}>×</button>
            </div>

            {branch && (
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "#f0f9ff", fontSize: 13, border: "1px solid #bae6fd" }}>
                🏢 Chi nhánh: <strong>{branch.name}</strong>
              </div>
            )}

            <div style={{ display: "grid", gap: 10 }}>
              {!editing && (
                <>
                  <div style={{ display: "grid", gap: 4 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>LOẠI PHÒNG</label>
                    <select
                      value={form.roomTypeId}
                      onChange={(e) => setField("roomTypeId", e.target.value)}
                      style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${fieldErrors.roomTypeId ? "#fca5a5" : "#e2e8f0"}`, fontSize: 14 }}
                    >
                      <option value="">-- Chọn loại phòng --</option>
                      {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                    </select>
                    {fieldErrors.roomTypeId && <small style={{ color: "#b91c1c" }}>{fieldErrors.roomTypeId}</small>}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>SỐ PHÒNG</label>
                      <input placeholder="101" value={form.roomNumber} onChange={(e) => setField("roomNumber", e.target.value)}
                        style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${fieldErrors.roomNumber ? "#fca5a5" : "#e2e8f0"}`, fontSize: 14 }} />
                      {fieldErrors.roomNumber && <small style={{ color: "#b91c1c" }}>{fieldErrors.roomNumber}</small>}
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>TẦNG</label>
                      <input type="number" min={1} value={form.floor} onChange={(e) => setField("floor", Number(e.target.value || 1))}
                        style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>SỨC CHỨA</label>
                  <input type="number" min={1} value={form.maxOccupancy} onChange={(e) => setField("maxOccupancy", Number(e.target.value || 1))}
                    style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${fieldErrors.maxOccupancy ? "#fca5a5" : "#e2e8f0"}`, fontSize: 14 }} />
                  {fieldErrors.maxOccupancy && <small style={{ color: "#b91c1c" }}>{fieldErrors.maxOccupancy}</small>}
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>GIÁ / ĐÊM</label>
                  <input type="number" min={0} value={form.rate} onChange={(e) => setField("rate", Number(e.target.value || 0))}
                    style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${fieldErrors.rate ? "#fca5a5" : "#e2e8f0"}`, fontSize: 14 }} />
                  {fieldErrors.rate && <small style={{ color: "#b91c1c" }}>{fieldErrors.rate}</small>}
                </div>
              </div>

              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>TRẠNG THÁI</label>
                <select value={form.status} onChange={(e) => setField("status", e.target.value)}
                  style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}>
                  <option value="AVAILABLE">✅ Còn trống</option>
                  <option value="HELD">⏳ Tạm giữ</option>
                  <option value="OCCUPIED">🛏️ Có khách</option>
                  <option value="MAINTENANCE">🔧 Bảo trì</option>
                </select>
              </div>

              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>GHI CHÚ</label>
                <textarea placeholder="Ghi chú thêm về phòng..." rows={2} value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, resize: "vertical" }} />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={() => setOpenModal(false)}>Huỷ</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? "Đang lưu..." : (editing ? "Lưu cập nhật" : "Tạo phòng")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
