import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import SkeletonBlock from "../../../components/common/SkeletonBlock";
import ErrorState from "../../../components/common/ErrorState";
import ToastMessage from "../../../components/common/ToastMessage";
import { PATHS } from "../../../routes/pathConstants";

export default function ManagerStaffPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [staff, setStaff] = useState([]);
  const [query, setQuery] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadStaff = async () => {
    setLoading(true);
    try {
      setError("");
      const data = await dashboardService.getManagerStaff();
      setStaff(data || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return staff;
    return staff.filter((item) => {
      return [item.email, item.fullName, item.role, item.branchId].some((value) => String(value || "").toLowerCase().includes(needle));
    });
  }, [staff, query]);

  const summary = useMemo(() => ({
    total: staff.length,
    active: staff.filter((item) => item.active).length,
    inactive: staff.filter((item) => !item.active).length,
    verified: staff.filter((item) => item.emailVerified).length
  }), [staff]);

  const toggleActive = async (row) => {
    setUpdatingId(row.id);
    setMessage("");
    setError("");
    try {
      await dashboardService.updateManagerStaffActive(row.id, !row.active);
      setMessage(`${row.email} đã được ${row.active ? "vô hiệu hóa" : "kích hoạt"}`);
      await loadStaff();
    } catch (err) {
      setError(err.message || "Không thể cập nhật trạng thái staff");
    } finally {
      setUpdatingId("");
    }
  };

  if (loading) return <SkeletonBlock rows={8} />;
  if (error && staff.length === 0) return <ErrorState message={error} onRetry={loadStaff} />;

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div style={{
        padding: "16px 20px", borderRadius: 14,
        background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)",
        color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Nhân sự chi nhánh</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Quản lý Staff</div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>Kích hoạt, vô hiệu hóa và theo dõi nhân viên đang được phân công</div>
        </div>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <StatCard label="Tổng staff" value={summary.total} icon="👥" />
        <StatCard label="Đang hoạt động" value={summary.active} icon="✅" />
        <StatCard label="Đã khóa" value={summary.inactive} icon="⛔" />
        <StatCard label="Đã xác minh email" value={summary.verified} icon="✉️" />
      </div>

      <div className="card" style={{ padding: 14, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            placeholder="🔍 Tìm email / vai trò..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 240, padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
          />
          <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={loadStaff}>🔄 Làm mới</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
              {["Email", "Role", "Branch", "Trạng thái", "Thao tác"].map((header) => (
                <th key={header} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontWeight: 700, color: "#0d2238" }}>{row.email}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{row.id?.slice(0, 10)}…</div>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ padding: "4px 10px", borderRadius: 999, background: row.role === "MANAGER" ? "#dbeafe" : "#dcfce7", color: row.role === "MANAGER" ? "#1e40af" : "#166534", fontSize: 11, fontWeight: 700 }}>
                    {row.role}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", color: "#475569" }}>{row.branchId || "Chưa phân công"}</td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ padding: "4px 10px", borderRadius: 999, background: row.active ? "#dcfce7" : "#fee2e2", color: row.active ? "#166534" : "#b91c1c", fontSize: 11, fontWeight: 700 }}>
                    {row.active ? "ACTIVE" : "LOCKED"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: "6px 12px", fontSize: 13 }}
                    onClick={() => toggleActive(row)}
                    disabled={updatingId === row.id}
                  >
                    {updatingId === row.id ? "Đang xử lý..." : row.active ? "Vô hiệu hóa" : "Kích hoạt"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                  Không tìm thấy staff nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ padding: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link className="btn btn-primary" to={PATHS.MANAGER_BOOKINGS}>📋 Booking chi nhánh</Link>
        <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} to={PATHS.MANAGER_ROOMS}>🏨 Quản lý phòng</Link>
        <Link className="btn btn-gold" to={PATHS.MANAGER_SERVICES}>🍽️ Dịch vụ</Link>
      </div>
    </section>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="card" style={{ padding: 16, display: "grid", gap: 8 }}>
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: "#0d2238" }}>{value}</div>
    </div>
  );
}
