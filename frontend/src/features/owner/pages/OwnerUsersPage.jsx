import { useEffect, useState, useMemo } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { validateRoleChange } from "../../dashboard/domainValidators";
import { useTracking } from "../../../hooks/useTracking";
import PaginationBar from "../../../components/common/PaginationBar";

const PAGE_SIZE = 10;
const ROLES = ["CUSTOMER", "STAFF", "MANAGER", "OWNER"];
const ROLE_COLORS = {
  OWNER: { bg: "#fef9c3", color: "#854d0e" },
  MANAGER: { bg: "#dbeafe", color: "#1e40af" },
  STAFF: { bg: "#dcfce7", color: "#166534" },
  CUSTOMER: { bg: "#f1f5f9", color: "#475569" }
};

export default function OwnerUsersPage() {
  const { can, currentEmail } = usePermissions();
  const track = useTracking("owner-users");
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [branchFilter, setBranchFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [nextRole, setNextRole] = useState("CUSTOMER");
  const [nextBranchId, setNextBranchId] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = () => {
    dashboardService.getOwnerUsers().then((data) => setRows(data || []))
      .catch((err) => setError(err.message || "Không thể tải danh sách người dùng"));
  };

  useEffect(() => {
    fetchData();
    branchService.getBranches().then((data) => setBranches(data || [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => rows.filter((item) => {
    const matchQ = !query
      || item.email?.toLowerCase().includes(query.toLowerCase())
      || item.fullName?.toLowerCase().includes(query.toLowerCase());
    const matchRole = roleFilter === "ALL" || item.role === roleFilter;
    const matchBranch = branchFilter === "ALL" || item.branchId === branchFilter;
    return matchQ && matchRole && matchBranch;
  }), [rows, query, roleFilter, branchFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const openRoleModal = (row) => {
    setSelected(row);
    setNextRole(row.role || "CUSTOMER");
    setNextBranchId(row.branchId || "");
    setFieldErrors({});
    setOpenModal(true);
  };

  const save = async () => {
    const validation = validateRoleChange({ currentRole: selected?.role, nextRole, targetEmail: selected?.email, currentEmail });
    const permitted = can(ACTIONS.USER_ROLE_UPDATE, { targetEmail: selected?.email, nextRole });
    if (!permitted) { setError("Bạn không có quyền đổi role này"); return; }
    setFieldErrors(validation);
    if (Object.keys(validation).length > 0) return;

    setSaving(true);
    try {
      await dashboardService.updateOwnerUserRole(selected.id, nextRole);
      if (nextBranchId && nextBranchId !== selected.branchId) {
        await dashboardService.updateOwnerUserBranch(selected.id, nextBranchId);
      }
      setMessage("Đã cập nhật người dùng");
      setOpenModal(false);
      setFieldErrors({});
      track("user_updated", { userId: selected.id, nextRole, nextBranchId });
      fetchData();
    } catch (err) {
      setError(err.message || "Không thể cập nhật người dùng");
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (row) => {
    if (!window.confirm(`Xác nhận xóa tài khoản "${row.email}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(row.id);
    try {
      await dashboardService.deleteOwnerUser(row.id);
      setMessage("Đã xóa người dùng");
      track("user_deleted", { userId: row.id, email: row.email });
      fetchData();
    } catch (err) {
      setError(err.message || "Không thể xóa người dùng");
    } finally {
      setDeleting("");
    }
  };

  // Activity status: based on lastLoginAt timestamp
  const getActivityStatus = (row) => {
    if (!row.lastLoginAt) return { label: "Chưa đăng nhập", color: "#94a3b8", bg: "#f1f5f9" };
    const diff = Date.now() - new Date(row.lastLoginAt).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return { label: "Hoạt động hôm nay", color: "#16a34a", bg: "#dcfce7" };
    if (days <= 7) return { label: `${days} ngày trước`, color: "#d97706", bg: "#fef9c3" };
    return { label: `${days} ngày trước`, color: "#b91c1c", bg: "#fee2e2" };
  };

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <div>
        <h1 style={{ margin: 0 }}>👥 Quản lý Người Dùng</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>{rows.length} tài khoản trong hệ thống</p>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Tìm email / họ tên..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 220, padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
        />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}>
          <option value="ALL">Tất cả role</option>
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={branchFilter} onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}>
          <option value="ALL">Tất cả chi nhánh</option>
          {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              {["Người dùng", "Role", "Chi nhánh", "Hoạt động", "Thao tác"].map((h) => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row) => {
              const rc = ROLE_COLORS[row.role] || ROLE_COLORS.CUSTOMER;
              const act = getActivityStatus(row);
              return (
                <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{row.fullName || "—"}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{row.email}</div>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700, background: rc.bg, color: rc.color }}>
                      {row.role}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "#64748b", fontSize: 13 }}>
                    {branches.find((b) => b.id === row.branchId)?.name || row.branchName || "—"}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600, background: act.bg, color: act.color }}>
                      {act.label}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="btn"
                        style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 10px", fontSize: 12 }}
                        onClick={() => openRoleModal(row)}
                        disabled={!can(ACTIONS.USER_ROLE_UPDATE, { targetEmail: row.email, nextRole: row.role })}
                      >
                        ✏️ Phân quyền
                      </button>
                      <button
                        className="btn"
                        style={{ border: "1px solid #fecaca", color: "#b91c1c", background: "white", padding: "6px 10px", fontSize: 12 }}
                        onClick={() => deleteUser(row)}
                        disabled={deleting === row.id || row.email === currentEmail}
                      >
                        {deleting === row.id ? "..." : "🗑️"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>Không tìm thấy người dùng nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />

      {/* Modal */}
      {openModal && selected && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ display: "grid", gap: 14, maxWidth: 460, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>✏️ Phân quyền người dùng</h3>
              <button style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }} onClick={() => setOpenModal(false)}>×</button>
            </div>

            <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{selected.fullName || "—"}</div>
              <div style={{ fontSize: 13, color: "#64748b" }}>{selected.email}</div>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gap: 4 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role mới</label>
                <div style={{ display: "grid", gap: 6 }}>
                  {ROLES.map((r) => {
                    const rc = ROLE_COLORS[r] || ROLE_COLORS.CUSTOMER;
                    return (
                      <label key={r} style={{
                        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                        padding: "8px 12px", borderRadius: 8,
                        border: `1px solid ${nextRole === r ? rc.color : "#e2e8f0"}`,
                        background: nextRole === r ? rc.bg : "white"
                      }}>
                        <input type="radio" name="role" value={r} checked={nextRole === r} onChange={() => setNextRole(r)} />
                        <span style={{ fontWeight: 700, color: rc.color, fontSize: 13 }}>{r}</span>
                      </label>
                    );
                  })}
                </div>
                {fieldErrors.nextRole && <small style={{ color: "#b91c1c" }}>{fieldErrors.nextRole}</small>}
              </div>

              {/* Chi nhánh */}
              {(nextRole === "STAFF" || nextRole === "MANAGER") && (
                <div style={{ display: "grid", gap: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>Gán chi nhánh</label>
                  <div style={{ display: "grid", gap: 6, maxHeight: 180, overflowY: "auto" }}>
                    {branches.map((b) => (
                      <label key={b.id} style={{
                        display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                        padding: "7px 10px", borderRadius: 8,
                        border: `1px solid ${nextBranchId === b.id ? "#0d2238" : "#e2e8f0"}`,
                        background: nextBranchId === b.id ? "#f0f9ff" : "white"
                      }}>
                        <input type="radio" name="branch" value={b.id} checked={nextBranchId === b.id} onChange={() => setNextBranchId(b.id)} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{b.name}</div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>{b.city}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={() => setOpenModal(false)}>Huỷ</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
