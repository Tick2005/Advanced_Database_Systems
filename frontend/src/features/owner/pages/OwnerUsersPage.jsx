import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { validateRoleChange } from "../../dashboard/domainValidators";
import { useTracking } from "../../../hooks/useTracking";

export default function OwnerUsersPage() {
  const { can, currentEmail } = usePermissions();
  const track = useTracking("owner-users");
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [nextRole, setNextRole] = useState("CUSTOMER");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = () => {
    dashboardService.getOwnerUsers().then((data) => {
      setRows(data || []);
    }).catch((err) => setError(err.message || "Khong the tai user list"));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = rows.filter((item) => {
    const matchQuery = !query
      || item.email?.toLowerCase().includes(query.toLowerCase())
      || item.fullName?.toLowerCase().includes(query.toLowerCase());
    const matchRole = roleFilter === "ALL" || item.role === roleFilter;
    return matchQuery && matchRole;
  });

  const updateRole = async (id, role) => {
    const validation = validateRoleChange({
      currentRole: selected?.role,
      nextRole: role,
      targetEmail: selected?.email,
      currentEmail
    });
    const permission = can(ACTIONS.USER_ROLE_UPDATE, {
      targetEmail: selected?.email,
      nextRole: role
    });

    if (!permission) {
      setError("Ban khong co quyen doi role nay");
      return;
    }

    setFieldErrors(validation);
    if (Object.keys(validation).length > 0) {
      return;
    }

    setSaving(true);
    try {
      await dashboardService.updateOwnerUserRole(id, role);
      setMessage("Da cap nhat role");
      setOpenModal(false);
      setFieldErrors({});
      track("user_role_updated", { userId: id, nextRole: role, targetEmail: selected?.email || null });
      fetchData();
    } catch (err) {
      setError(err.message || "Khong the cap nhat role");
      track("user_role_update_failed", { userId: id, reason: err.message || "unknown" });
    } finally {
      setSaving(false);
    }
  };

  const openRoleModal = (row) => {
    setSelected(row);
    setNextRole(row.role || "CUSTOMER");
    setFieldErrors({});
    setOpenModal(true);
  };

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Quan ly nguoi dung</h1>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      <div className="table-toolbar">
        <input placeholder="Tim theo email / ho ten" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
          <option value="ALL">Tat ca role</option>
          <option value="CUSTOMER">CUSTOMER</option>
          <option value="STAFF">STAFF</option>
          <option value="MANAGER">MANAGER</option>
          <option value="OWNER">OWNER</option>
        </select>
      </div>

      <DataTable
        rows={filtered}
        columns={[
          { key: "email", label: "Email" },
          { key: "fullName", label: "Ho ten" },
          { key: "role", label: "Role" },
          { key: "branchName", label: "Chi nhánh", render: (row) => row.branchName || row.branchCode || row.branchId || "-" },
          { key: "createdAt", label: "Created" }
        ]}
        renderActions={(row) => (
          <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 10px" }} onClick={() => openRoleModal(row)} disabled={!can(ACTIONS.USER_ROLE_UPDATE, { targetEmail: row.email, nextRole })}>Doi role</button>
        )}
      />

      {openModal && selected && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ display: "grid", gap: 12 }}>
            <h3 style={{ margin: 0 }}>Cap nhat role nguoi dung</h3>
            <div style={{ color: "#64748b", fontSize: 14 }}>{selected.email}</div>
            <select value={nextRole} onChange={(event) => setNextRole(event.target.value)}>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="STAFF">STAFF</option>
              <option value="MANAGER">MANAGER</option>
              <option value="OWNER">OWNER</option>
            </select>
            {fieldErrors.nextRole && <small style={{ color: "#b91c1c" }}>{fieldErrors.nextRole}</small>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={() => setOpenModal(false)}>Huy</button>
              <button className="btn btn-primary" onClick={() => updateRole(selected.id, nextRole)} disabled={saving || !can(ACTIONS.USER_ROLE_UPDATE, { targetEmail: selected.email, nextRole })}>Luu role</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
