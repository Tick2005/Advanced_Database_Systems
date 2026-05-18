/**
 * ManagerServicesPage.jsx
 * Services chỉ load theo branch của manager đang đăng nhập (từ token).
 * Không cho chọn branch tùy ý — manager chỉ quản lý branch của mình.
 */

import { useEffect, useState, useCallback } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { validateServiceForm } from "../../dashboard/domainValidators";
import { validateSelectedImageFile } from "../../../services/uploadGuard";
import UploadGuardHint from "../../../components/common/UploadGuardHint";
import { useTracking } from "../../../hooks/useTracking";
import { formatCurrencyVnd } from "../../../services/presenters";

const MODE_OPTIONS = [
  { value: "ALL",      label: "Tất cả chế độ" },
  { value: "BOTH",     label: "BOTH – Đặt trước & tại chỗ" },
  { value: "PREBOOK",  label: "PREBOOK – Chỉ đặt trước" },
  { value: "ON_SITE",  label: "ON_SITE – Chỉ tại chỗ" },
];

const EMPTY_FORM = { code: "", name: "", description: "", thumbnailUrl: "", price: 0, serviceMode: "BOTH" };

export default function ManagerServicesPage() {
  const { can } = usePermissions();
  const track = useTracking("manager-services");

  // Branch của manager lấy từ token (GET /api/manager/branch)
  const [branch, setBranch] = useState(null);
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load branch info từ token một lần duy nhất
  useEffect(() => {
    dashboardService.getManagerBranchInfo()
      .then((data) => setBranch(data || null))
      .catch(() => setError("Không thể tải thông tin chi nhánh."));
  }, []);

  // Load services khi đã có branch — dùng useCallback để tránh stale closure
  const fetchData = useCallback(() => {
    if (!branch?.id) return;
    dashboardService.getManagerServicesByBranch()
      .then((data) => { setServices(data || []); setError(""); })
      .catch((err) => setError(err.message || "Không thể tải danh sách dịch vụ."));
  }, [branch?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = services.filter((item) => {
    const matchQuery = !query
      || item.code?.toLowerCase().includes(query.toLowerCase())
      || item.name?.toLowerCase().includes(query.toLowerCase());
    const matchMode = modeFilter === "ALL" || item.serviceMode === modeFilter;
    return matchQuery && matchMode;
  });

  const openCreate = () => {
    if (!can(ACTIONS.SERVICE_CREATE)) { setError("Bạn không có quyền tạo dịch vụ."); return; }
    setEditing(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setThumbnailPreview("");
    setOpenModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ code: item.code || "", name: item.name || "", description: item.description || "", thumbnailUrl: item.thumbnailUrl || "", price: Number(item.price || 0), serviceMode: item.serviceMode || "BOTH" });
    setFieldErrors({});
    setThumbnailPreview(item.thumbnailUrl || "");
    setOpenModal(true);
  };

  const closeModal = () => { setOpenModal(false); setEditing(null); setFieldErrors({}); setThumbnailPreview(""); };

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const saveService = async () => {
    const action = editing ? ACTIONS.SERVICE_EDIT : ACTIONS.SERVICE_CREATE;
    if (!can(action)) { setError("Bạn không có quyền thực hiện thao tác này."); return; }

    const nextErrors = validateServiceForm(form, { isCreate: !editing });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      if (editing) {
        await dashboardService.updateManagerService(editing.id, {
          name: form.name,
          description: form.description,
          thumbnailUrl: form.thumbnailUrl,
          price: Number(form.price || 0),
          serviceMode: form.serviceMode,
        });
        setMessage("Đã cập nhật dịch vụ thành công.");
        track("service_updated", { serviceId: editing.id, branchId: branch?.id });
      } else {
        await dashboardService.createManagerService({
          ...form,
          branchId: branch?.id,
          price: Number(form.price || 0),
        });
        setMessage("Đã tạo dịch vụ mới thành công.");
        track("service_created", { code: form.code, branchId: branch?.id });
      }
      closeModal();
      fetchData();
    } catch (err) {
      setError(err.message || "Không thể lưu dịch vụ. Vui lòng thử lại.");
      track("service_save_failed", { branchId: branch?.id, reason: err.message || "unknown" });
    } finally {
      setSaving(false);
    }
  };

  const onSelectThumbnail = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const fileError = validateSelectedImageFile(file);
    if (fileError) { setError(fileError); return; }
    const localPreview = URL.createObjectURL(file);
    setThumbnailPreview(localPreview);
    setMessage("Ảnh hợp lệ. Hệ thống dùng URL thumbnail từ backend – bạn có thể paste URL để lưu.");
  };

  return (
    <section style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderRadius: 14, background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Dịch vụ phòng</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Quản lý Dịch vụ</div>
          {branch && (
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>
              {branch.name} — {branch.city}
            </div>
          )}
        </div>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error"   message={error}   onClose={() => setError("")}   />

      {/* Toolbar */}
      <div className="card" style={{ padding: 14, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="🔍 Tìm theo mã / tên dịch vụ"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, minWidth: 180 }}
          />
          <select value={modeFilter} onChange={(e) => setModeFilter(e.target.value)}>
            {MODE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button className="btn btn-primary" onClick={openCreate} disabled={!can(ACTIONS.SERVICE_CREATE)}>
            + Tạo dịch vụ
          </button>
        </div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          Hiển thị <strong>{filtered.length}</strong> / {services.length} dịch vụ
        </div>
      </div>

      {/* Table */}
      <DataTable
        rows={filtered}
        columns={[
          { key: "code",        label: "Mã dịch vụ" },
          { key: "name",        label: "Tên dịch vụ" },
          { key: "price",       label: "Đơn giá", render: (row) => <span className="mono">{formatCurrencyVnd(row.price)}</span> },
          { key: "serviceMode", label: "Chế độ" },
          {
            key: "thumbnailUrl", label: "Ảnh",
            render: (row) => row.thumbnailUrl
              ? <img src={row.thumbnailUrl} alt={row.name} style={{ width: 56, height: 36, objectFit: "cover", borderRadius: 6 }} />
              : <span style={{ color: "#cbd5e1", fontSize: 12 }}>Chưa có ảnh</span>
          },
        ]}
        renderActions={(row) => (
          <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 10px" }} onClick={() => openEdit(row)} disabled={!can(ACTIONS.SERVICE_EDIT)}>
            ✏️ Sửa
          </button>
        )}
      />

      {/* Modal */}
      {openModal && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ maxWidth: 520 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontWeight: 800, color: "#0d2238" }}>
                {editing ? "✏️ Cập nhật dịch vụ" : "➕ Tạo dịch vụ mới"}
              </h3>
              <button type="button" onClick={closeModal} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            {branch && (
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "#f0f9ff", border: "1px solid #bae6fd", fontSize: 13, marginBottom: 12 }}>
                🏢 Chi nhánh: <strong>{branch.name}</strong>
              </div>
            )}

            <div className="form-grid">
              {!editing && (
                <>
                  <input placeholder="Mã dịch vụ (VD: BF-SET)" value={form.code} onChange={(e) => setField("code", e.target.value)} />
                  {fieldErrors.code && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.code}</small>}
                </>
              )}

              <input placeholder="Tên dịch vụ" value={form.name} onChange={(e) => setField("name", e.target.value)} />
              {fieldErrors.name && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.name}</small>}

              <input placeholder="Mô tả ngắn" value={form.description} onChange={(e) => setField("description", e.target.value)} />

              <input placeholder="URL hình ảnh (thumbnail)" value={form.thumbnailUrl} onChange={(e) => { setField("thumbnailUrl", e.target.value); setThumbnailPreview(e.target.value); }} />

              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Hoặc chọn ảnh từ máy tính:</label>
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onSelectThumbnail} />
                <UploadGuardHint />
              </div>

              {thumbnailPreview && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <img src={thumbnailPreview} alt="Xem trước" style={{ width: 160, height: 100, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                </div>
              )}

              <input type="number" min={0} placeholder="Đơn giá (đồng)" value={form.price} onChange={(e) => setField("price", Number(e.target.value || 0))} />
              {fieldErrors.price && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.price}</small>}

              <select value={form.serviceMode} onChange={(e) => setField("serviceMode", e.target.value)}>
                <option value="BOTH">BOTH – Đặt trước & tại chỗ</option>
                <option value="PREBOOK">PREBOOK – Chỉ đặt trước</option>
                <option value="ON_SITE">ON_SITE – Chỉ tại chỗ</option>
              </select>
              {fieldErrors.serviceMode && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.serviceMode}</small>}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={closeModal}>Hủy</button>
              <button className="btn btn-primary" onClick={saveService} disabled={saving}>
                {saving ? "Đang lưu..." : editing ? "💾 Lưu cập nhật" : "➕ Tạo dịch vụ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
