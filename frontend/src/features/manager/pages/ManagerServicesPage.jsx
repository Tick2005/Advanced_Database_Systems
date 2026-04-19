import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import DataTable from "../../../components/common/DataTable";
import ToastMessage from "../../../components/common/ToastMessage";

export default function ManagerServicesPage() {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [services, setServices] = useState([]);
  const [query, setQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("ALL");
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", name: "", description: "", thumbnailUrl: "", price: 0, serviceMode: "BOTH" });
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
      } else {
        await dashboardService.createManagerService({
          ...form,
          branchId,
          price: Number(form.price || 0)
        });
        setMessage("Da tao dich vu");
      }
      setOpenModal(false);
      setEditing(null);
      fetchData(branchId);
    } catch (err) {
      setError(err.message || "Khong the luu dich vu");
    }
  };

  const onCreate = () => {
    setEditing(null);
    setForm({ code: "", name: "", description: "", thumbnailUrl: "", price: 0, serviceMode: "BOTH" });
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
    setOpenModal(true);
  };

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Dich vu chi nhanh</h1>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      <div className="table-toolbar">
        <input placeholder="Tim code / ten dich vu" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={modeFilter} onChange={(event) => setModeFilter(event.target.value)}>
          <option value="ALL">Tat ca mode</option>
          <option value="BOTH">BOTH</option>
          <option value="PREBOOK">PREBOOK</option>
          <option value="ON_SITE">ON_SITE</option>
        </select>
        <button className="btn btn-primary" onClick={onCreate}>+ Tao dich vu</button>
      </div>

      <div className="toolbar">
        <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
          ))}
        </select>
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
          <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 10px" }} onClick={() => onEdit(row)}>Sua</button>
        )}
      />

      {openModal && (
        <div className="modal-overlay">
          <div className="card modal-card">
            <h3 style={{ margin: 0 }}>{editing ? "Cap nhat dich vu" : "Tao dich vu moi"}</h3>
            <div className="form-grid">
              {!editing && <input placeholder="Code" value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} />}
              <input placeholder="Ten dich vu" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              <input placeholder="Mo ta" value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} />
              <input placeholder="Thumbnail URL" value={form.thumbnailUrl} onChange={(event) => setForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))} />
              <input type="number" min={0} placeholder="Gia" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: Number(event.target.value || 0) }))} />
              <select value={form.serviceMode} onChange={(event) => setForm((prev) => ({ ...prev, serviceMode: event.target.value }))}>
                <option value="BOTH">BOTH</option>
                <option value="PREBOOK">PREBOOK</option>
                <option value="ON_SITE">ON_SITE</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={() => setOpenModal(false)}>Huy</button>
              <button className="btn btn-primary" onClick={saveService}>{editing ? "Luu cap nhat" : "Tao dich vu"}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
