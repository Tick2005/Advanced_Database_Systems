import { useEffect, useState, useMemo } from "react";
import { branchService } from "../../branches/branchService";
import { dashboardService } from "../../dashboard/dashboardService";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { validateBranchForm } from "../../dashboard/domainValidators";
import { useTracking } from "../../../hooks/useTracking";
import RatingStars from "../../../components/common/RatingStars";

const INITIAL_FORM = { code: "", name: "", country: "Vietnam", city: "", address: "", phone: "", email: "", timezone: "Asia/Ho_Chi_Minh" };
const BRANCH_IMAGES = [
  "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg",
  "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg",
  "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg",
  "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg",
  "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg"
];

export default function OwnerBranchesPage() {
  const { can } = usePermissions();
  const track = useTracking("owner-branches");
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = () => {
    branchService.getBranches().then((data) => setRows(data || [])).catch((err) => setError(err.message || "Không thể tải chi nhánh"));
  };

  useEffect(() => { fetchData(); }, []);

  const cityOptions = Array.from(new Set(rows.map((r) => r.city).filter(Boolean)));
  const filtered = useMemo(() => rows.filter((r) => {
    const matchQ = !query || r.code?.toLowerCase().includes(query.toLowerCase())
      || r.name?.toLowerCase().includes(query.toLowerCase()) || r.address?.toLowerCase().includes(query.toLowerCase());
    return matchQ && (cityFilter === "ALL" || r.city === cityFilter);
  }), [rows, query, cityFilter]);

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const openCreate = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setFieldErrors({});
    setOpenModal(true);
  };

  const openEdit = (branch) => {
    setEditingId(branch.id);
    setForm({ code: branch.code || "", name: branch.name || "", country: branch.country || "Vietnam", city: branch.city || "", address: branch.address || "", phone: branch.phone || "", email: branch.email || "", timezone: branch.timezone || "Asia/Ho_Chi_Minh" });
    setFieldErrors({});
    setOpenModal(true);
  };

  const save = async () => {
    if (!can(editingId ? ACTIONS.BRANCH_UPDATE : ACTIONS.BRANCH_CREATE)) { setError("Bạn không có quyền"); return; }
    const existingCodes = rows.filter((r) => r.id !== editingId).map((r) => String(r.code || "").trim().toUpperCase());
    const nextErrors = validateBranchForm(form, existingCodes);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSaving(true);
    try {
      if (editingId) {
        await dashboardService.updateOwnerBranch(editingId, { ...form, code: String(form.code || "").trim().toUpperCase() });
        setMessage("Đã cập nhật chi nhánh");
        track("branch_updated", { id: editingId });
      } else {
        await dashboardService.createOwnerBranch({ ...form, code: String(form.code || "").trim().toUpperCase() });
        setMessage("Đã tạo chi nhánh mới");
        track("branch_created", { code: form.code, city: form.city });
      }
      setOpenModal(false);
      setFieldErrors({});
      fetchData();
    } catch (err) {
      setError(err.message || "Không thể lưu chi nhánh");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!can(ACTIONS.BRANCH_DELETE)) { setError("Bạn không có quyền xóa"); return; }
    if (!window.confirm("Bạn có chắc chắn muốn xóa chi nhánh này không? Hành động này không thể hoàn tác!")) return;
    setSaving(true);
    try {
      await dashboardService.deleteOwnerBranch(id);
      setMessage("Đã xóa chi nhánh");
      track("branch_deleted", { id });
      fetchData();
    } catch (err) {
      setError(err.message || "Không thể xóa chi nhánh");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div style={{
        padding: "16px 20px", borderRadius: 14,
        background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)",
        color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Chi nhánh hệ thống</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Quản lý Chi Nhánh</div>
        </div>
        <button
          className="btn btn-primary"
          style={{ padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700 }}
          onClick={openCreate}
          disabled={!can(ACTIONS.BRANCH_CREATE)}
        >
          ➕ Thêm chi nhánh
        </button>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Filters */}
      <div className="card" style={{ padding: 14, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Tìm code / tên / địa chỉ"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
        />
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}>
          <option value="ALL">Tất cả thành phố</option>
          {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        </div>
      </div>

      {/* Branch cards */}
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
        {filtered.map((branch, idx) => (
          <article key={branch.id} className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ position: "relative", height: 120, flexShrink: 0 }}>
              <img
                src={BRANCH_IMAGES[idx % BRANCH_IMAGES.length]}
                alt={branch.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)"
              }} />
              <span style={{
                position: "absolute", top: 10, right: 10,
                background: "#c9a84c", color: "white",
                padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 700, textTransform: "uppercase"
              }}>
                {branch.code}
              </span>
            </div>
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
              <div>
                <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#0d2238" }}>
                  {branch.name}
                </h3>
                {(() => {
                  const avg = branch.averageRating ?? branch.avgRating ?? branch.avg ?? null;
                  const cnt = branch.reviewCount ?? branch.reviewsCount ?? branch.feedbackCount ?? null;
                  if (avg != null) {
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                        <RatingStars value={avg} size={13} showValue count={cnt} />
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
              <div style={{ display: "grid", gap: 6, flex: 1 }}>
                <div style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>📍</span> {branch.city}, {branch.country}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>🏠</span> {branch.address}
                </div>
                <div style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>📞</span> {branch.phone || "—"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 8 }}>
                <button
                  className="btn"
                  style={{ flex: 1, border: "1px solid #dbe4ee", background: "white", padding: "8px 12px", fontSize: 13, fontWeight: 600, borderRadius: 8 }}
                  onClick={() => openEdit(branch)}
                >
                  ✏️ Chỉnh sửa
                </button>
                <button
                  className="btn"
                  style={{ flex: 1, border: "1px solid #fecaca", background: "#fff1f2", color: "#b91c1c", padding: "8px 12px", fontSize: 13, fontWeight: 600, borderRadius: 8 }}
                  onClick={() => handleDelete(branch.id)}
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="card" style={{ padding: 32, textAlign: "center", color: "#94a3b8", gridColumn: "1 / -1", fontSize: 14 }}>
            📭 Không tìm thấy chi nhánh nào.
          </div>
        )}
      </div>

      {/* Modal */}
      {openModal && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ display: "grid", gap: 14, maxWidth: 520, width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{editingId ? "✏️ Chỉnh sửa chi nhánh" : "➕ Tạo chi nhánh mới"}</h3>
              <button style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }} onClick={() => setOpenModal(false)}>×</button>
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
                <F label="Mã CODE *">
                  <input placeholder="HCM01" value={form.code} onChange={(e) => setField("code", e.target.value)}
                    disabled={!!editingId}
                    style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${fieldErrors.code ? "#fca5a5" : "#e2e8f0"}`, fontSize: 14, textTransform: "uppercase" }} />
                  {fieldErrors.code && <small style={{ color: "#b91c1c" }}>{fieldErrors.code}</small>}
                </F>
                <F label="Tên chi nhánh *">
                  <input placeholder="LuxStay Riverside" value={form.name} onChange={(e) => setField("name", e.target.value)}
                    style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${fieldErrors.name ? "#fca5a5" : "#e2e8f0"}`, fontSize: 14 }} />
                  {fieldErrors.name && <small style={{ color: "#b91c1c" }}>{fieldErrors.name}</small>}
                </F>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <F label="Thành phố *">
                  <input placeholder="Hồ Chí Minh" value={form.city} onChange={(e) => setField("city", e.target.value)}
                    style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${fieldErrors.city ? "#fca5a5" : "#e2e8f0"}`, fontSize: 14 }} />
                  {fieldErrors.city && <small style={{ color: "#b91c1c" }}>{fieldErrors.city}</small>}
                </F>
                <F label="Quốc gia">
                  <input value={form.country} onChange={(e) => setField("country", e.target.value)}
                    style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }} />
                </F>
              </div>
              <F label="Địa chỉ *">
                <input placeholder="123 Nguyễn Huệ, Q1" value={form.address} onChange={(e) => setField("address", e.target.value)}
                  style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${fieldErrors.address ? "#fca5a5" : "#e2e8f0"}`, fontSize: 14 }} />
                {fieldErrors.address && <small style={{ color: "#b91c1c" }}>{fieldErrors.address}</small>}
              </F>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <F label="Số điện thoại">
                  <input placeholder="028 xxxx xxxx" value={form.phone} onChange={(e) => setField("phone", e.target.value)}
                    style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }} />
                </F>
                <F label="Email">
                  <input placeholder="branch@luxstay.com" value={form.email} onChange={(e) => setField("email", e.target.value)}
                    style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }} />
                </F>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={() => setOpenModal(false)}>Huỷ</button>
              <button className="btn btn-primary" onClick={save} disabled={saving || (editingId ? !can(ACTIONS.BRANCH_UPDATE) : !can(ACTIONS.BRANCH_CREATE))}>
                {saving ? "Đang lưu..." : (editingId ? "Lưu cập nhật" : "Tạo chi nhánh")}
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
    <div style={{ display: "grid", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>
      {children}
    </div>
  );
}
