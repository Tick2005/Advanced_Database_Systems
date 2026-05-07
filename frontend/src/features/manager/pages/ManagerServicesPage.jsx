import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import DataTable from "../../../components/common/DataTable";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { validateServiceForm } from "../../dashboard/domainValidators";
import { validateSelectedImageFile } from "../../../services/uploadGuard";
import UploadGuardHint from "../../../components/common/UploadGuardHint";
import { useTracking } from "../../../hooks/useTracking";

export default function ManagerServicesPage() {
  const { can } = usePermissions();
  const track = useTracking("manager-services");
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", name: "", description: "", thumbnailUrl: "", price: 0, serviceMode: "BOTH" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    branchService.getBranches().then((data) => {
      setBranches(data || []);
      setBranchId(data?.[0]?.id || "");
    });
  }, []);

  const fetchData = async (id) => {
    if (!id) return;
    try {
      const data = await dashboardService.getManagerServicesByBranch(id);
      setServices(data || []);
      setError("");
    } catch (err) {
      setError(err.message || "Khong the tai danh sach dich vu");
    }
  };

  useEffect(() => {
    fetchData(branchId);
  }, [branchId]);

  const filtered = services.filter((item) => {
    const matchQuery = !query || item.code?.toLowerCase().includes(query.toLowerCase()) || item.name?.toLowerCase().includes(query.toLowerCase());
    const matchMode = modeFilter === "ALL" || item.serviceMode === modeFilter;
    return matchQuery && matchMode;
  });

  const saveService = async () => {
    const action = editing ? ACTIONS.SERVICE_EDIT : ACTIONS.SERVICE_CREATE;
    if (!can(action)) {
      setError("Ban khong co quyen thuc hien thao tac nay");
      return;
    }

    const nextErrors = validateServiceForm(form, { isCreate: !editing });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await dashboardService.updateManagerService(editing.id, {
          name: form.name,
          description: form.description,
          thumbnailUrl: form.thumbnailUrl,
          price: Number(form.price || 0),
          serviceMode: form.serviceMode
        });
        setMessage("Da cap nhat dich vu");
        track("service_updated", { serviceId: editing.id, branchId });
      } else {
        await dashboardService.createManagerService({
          ...form,
          branchId,
          price: Number(form.price || 0)
        });
        setMessage("Da tao dich vu");
        track("service_created", { code: form.code, branchId });
      }
      setOpenModal(false);
      setEditing(null);
      setFieldErrors({});
      setThumbnailPreview("");
      fetchData(branchId);
    } catch (err) {
      setError(err.message || "Khong the luu dich vu");
      track("service_save_failed", { branchId, reason: err.message || "unknown" });
    } finally {
      setSaving(false);
    }
  };

  const onCreate = () => {
    if (!can(ACTIONS.SERVICE_CREATE)) {
      setError("Ban khong co quyen tao dich vu");
      return;
    }
    setEditing(null);
    setForm({ code: "", name: "", description: "", thumbnailUrl: "", price: 0, serviceMode: "BOTH" });
    setFieldErrors({});
    setThumbnailPreview("");
    setOpenModal(true);
  };

  const onEdit = (item) => {
    setEditing(item);
    setForm({
      code: item.code || "",
      name: item.name || "",
      description: item.description || "",
      thumbnailUrl: item.thumbnailUrl || "",
      price: Number(item.price || 0),
      serviceMode: item.serviceMode || "BOTH"
    });
    setFieldErrors({});
    setThumbnailPreview(item.thumbnailUrl || "");
    setOpenModal(true);
  };

  const onSelectThumbnail = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileError = validateSelectedImageFile(file);
    if (fileError) {
      setError(fileError);
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setThumbnailPreview(localPreview);
    setMessage("Anh hop le. He thong dang dung URL thumbnail tu backend, ban co the paste URL de luu.");
  };

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div style={{
        padding: "16px 20px", borderRadius: 14,
        background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)",
        color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Dịch vụ phòng</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Quản lý Dịch vụ</div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>Tạo và cấu hình dịch vụ tại chi nhánh</div>
        </div>
      </div>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      <div className="card" style={{ padding: 14, display: "grid", gap: 12 }}>
        <div className="table-toolbar" style={{ margin: 0 }}>
        <input placeholder="Tim code / ten dich vu" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={modeFilter} onChange={(event) => setModeFilter(event.target.value)}>
          <option value="ALL">Tat ca mode</option>
          <option value="BOTH">BOTH</option>
          <option value="PREBOOK">PREBOOK</option>
          <option value="ON_SITE">ON_SITE</option>
        </select>
        <button className="btn btn-primary" onClick={onCreate} disabled={!can(ACTIONS.SERVICE_CREATE)}>+ Tao dich vu</button>
        </div>

        <div className="toolbar" style={{ margin: 0 }}>
        <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
          ))}
        </select>
        </div>
      </div>

      <DataTable
        rows={filtered}
        columns={[
          { key: "code", label: "Code" },
          { key: "name", label: "Ten" },
          { key: "price", label: "Gia", render: (row) => <span className="mono">{row.price}</span> },
          { key: "serviceMode", label: "Mode" }
        ]}
        renderActions={(row) => (
          <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 10px" }} onClick={() => onEdit(row)} disabled={!can(ACTIONS.SERVICE_EDIT)}>Sua</button>
        )}
      />

      {openModal && (
        <div className="modal-overlay">
          <div className="card modal-card">
            <h3 style={{ margin: 0 }}>{editing ? "Cap nhat dich vu" : "Tao dich vu moi"}</h3>
            <div className="form-grid">
              {!editing && <input placeholder="Code" value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} />}
              {!editing && fieldErrors.code && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.code}</small>}
              <input placeholder="Ten dich vu" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              {fieldErrors.name && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.name}</small>}
              <input placeholder="Mo ta" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
              {fieldErrors.description && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.description}</small>}
              <input placeholder="Thumbnail URL" value={form.thumbnailUrl} onChange={(event) => setForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))} />
              {fieldErrors.thumbnailUrl && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.thumbnailUrl}</small>}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onSelectThumbnail} />
              <UploadGuardHint />
              {thumbnailPreview && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <img src={thumbnailPreview} alt="thumbnail preview" style={{ width: 140, height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid #e2e8f0" }} />
                </div>
              )}
              <input type="number" min={0} placeholder="Gia" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value || 0) }))} />
              {fieldErrors.price && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.price}</small>}
              <select value={form.serviceMode} onChange={(event) => setForm((prev) => ({ ...prev, serviceMode: event.target.value }))}>
                <option value="BOTH">BOTH</option>
                <option value="PREBOOK">PREBOOK</option>
                <option value="ON_SITE">ON_SITE</option>
              </select>
              {fieldErrors.serviceMode && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.serviceMode}</small>}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={() => setOpenModal(false)}>Huy</button>
              <button className="btn btn-primary" onClick={saveService} disabled={saving}>{editing ? "Luu cap nhat" : "Tao dich vu"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
