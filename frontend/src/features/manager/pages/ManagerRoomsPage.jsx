import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import DataTable from "../../../components/common/DataTable";
import StatusBadge from "../../../components/common/StatusBadge";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { validateRoomForm } from "../../dashboard/domainValidators";
import { useTracking } from "../../../hooks/useTracking";

export default function ManagerRoomsPage() {
  const { can } = usePermissions();
  const track = useTracking("manager-rooms");
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ roomTypeId: "", roomNumber: "", floor: 1, maxOccupancy: 2, rate: 0, status: "AVAILABLE", notes: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadRooms = (id) => {
    if (!id) return;
    dashboardService.getManagerRoomsByBranch(id).then((data) => {
      setRooms(data || []);
      setError("");
    }).catch((err) => setError(err.message || "Khong the tai danh sach phong"));
  };

  useEffect(() => {
    branchService.getBranches().then((data) => {
      const first = data?.[0]?.id || "";
      setBranches(data || []);
      setBranchId(first);
    }).catch((err) => setError(err.message || "Khong the tai chi nhanh"));
  }, []);

  useEffect(() => {
    loadRooms(branchId);
  }, [branchId]);

  const filtered = rooms.filter((item) => {
    const matchQuery = !query
      || item.roomNumber?.toLowerCase().includes(query.toLowerCase())
      || item.roomTypeName?.toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
    return matchQuery && matchStatus;
  });

  const openCreate = () => {
    if (!can(ACTIONS.ROOM_CREATE)) {
      setError("Ban khong co quyen tao phong");
      return;
    }
    setEditing(null);
    setForm({ roomTypeId: "", roomNumber: "", floor: 1, maxOccupancy: 2, rate: 0, status: "AVAILABLE", notes: "" });
    setFieldErrors({});
    setOpenModal(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      roomTypeId: row.roomTypeId || "",
      roomNumber: row.roomNumber || "",
      floor: row.floor || 1,
      maxOccupancy: row.maxOccupancy || 2,
      rate: Number(row.rate || 0),
      status: row.status || "AVAILABLE",
      notes: row.notes || ""
    });
    setFieldErrors({});
    setOpenModal(true);
  };

  const save = async () => {
    const action = editing ? ACTIONS.ROOM_EDIT : ACTIONS.ROOM_CREATE;
    if (!can(action)) {
      setError("Ban khong co quyen thuc hien thao tac nay");
      return;
    }

    const nextErrors = validateRoomForm(form, { isCreate: !editing });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await dashboardService.updateManagerRoom(editing.id, {
          maxOccupancy: Number(form.maxOccupancy || 1),
          rate: Number(form.rate || 0),
          notes: form.notes,
          status: form.status
        });
        setMessage("Da cap nhat phong");
        track("room_updated", { roomId: editing.id, branchId, status: form.status });
      } else {
        await dashboardService.createManagerRoom({
          roomTypeId: form.roomTypeId,
          branchId,
          roomNumber: form.roomNumber,
          floor: Number(form.floor || 1),
          maxOccupancy: Number(form.maxOccupancy || 1),
          rate: Number(form.rate || 0),
          status: form.status,
          notes: form.notes
        });
        setMessage("Da tao phong moi");
        track("room_created", { roomNumber: form.roomNumber, branchId });
      }
      setOpenModal(false);
      setFieldErrors({});
      loadRooms(branchId);
    } catch (err) {
      setError(err.message || "Khong the luu phong");
      track("room_save_failed", { branchId, reason: err.message || "unknown" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Quan ly phong</h1>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      <div className="table-toolbar">
        <input placeholder="Tim theo so phong / loai phong" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="ALL">Tat ca trang thai</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="HELD">HELD</option>
          <option value="OCCUPIED">OCCUPIED</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
        </select>
        <button className="btn btn-primary" onClick={openCreate} disabled={!can(ACTIONS.ROOM_CREATE)}>+ Tao phong</button>
      </div>

      <div className="toolbar">
        <select value={branchId} onChange={(event) => setBranchId(event.target.value)} style={{ minWidth: 320 }}>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
          ))}
        </select>
      </div>

      <DataTable
        rows={filtered}
        columns={[
          { key: "roomNumber", label: "So phong" },
          { key: "roomTypeName", label: "Loai phong" },
          { key: "floor", label: "Tang" },
          { key: "rate", label: "Gia", render: (row) => <span className="mono">{row.rate}</span> },
          { key: "maxOccupancy", label: "Suc chua" },
          { key: "status", label: "Trang thai", render: (row) => <StatusBadge value={row.status} /> }
        ]}
        renderActions={(row) => (
          <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 10px" }} onClick={() => openEdit(row)} disabled={!can(ACTIONS.ROOM_EDIT)}>Sua</button>
        )}
      />

      {openModal && (
        <div className="modal-overlay">
          <div className="card modal-card">
            <h3 style={{ margin: 0 }}>{editing ? "Cap nhat phong" : "Tao phong moi"}</h3>
            <div className="form-grid">
              {!editing && <input placeholder="Room type ID" value={form.roomTypeId} onChange={(event) => setForm((prev) => ({ ...prev, roomTypeId: event.target.value }))} />}
              {!editing && fieldErrors.roomTypeId && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.roomTypeId}</small>}
              {!editing && <input placeholder="So phong" value={form.roomNumber} onChange={(event) => setForm((prev) => ({ ...prev, roomNumber: event.target.value }))} />}
              {!editing && fieldErrors.roomNumber && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.roomNumber}</small>}
              {!editing && <input type="number" min={1} placeholder="Tang" value={form.floor} onChange={(event) => setForm((prev) => ({ ...prev, floor: Number(event.target.value || 1) }))} />}
              {!editing && fieldErrors.floor && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.floor}</small>}
              <input type="number" min={1} placeholder="Suc chua" value={form.maxOccupancy} onChange={(event) => setForm((prev) => ({ ...prev, maxOccupancy: Number(event.target.value || 1) }))} />
              {fieldErrors.maxOccupancy && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.maxOccupancy}</small>}
              <input type="number" min={0} placeholder="Gia" value={form.rate} onChange={(event) => setForm((prev) => ({ ...prev, rate: Number(event.target.value || 0) }))} />
              {fieldErrors.rate && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.rate}</small>}
              <select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="HELD">HELD</option>
                <option value="OCCUPIED">OCCUPIED</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
              </select>
              {fieldErrors.status && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.status}</small>}
              <textarea placeholder="Ghi chu" rows={3} value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} style={{ gridColumn: "1 / -1" }} />
              {fieldErrors.notes && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.notes}</small>}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={() => setOpenModal(false)}>Huy</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{editing ? "Luu cap nhat" : "Tao phong"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
