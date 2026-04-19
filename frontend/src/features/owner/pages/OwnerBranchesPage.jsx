import { useEffect, useState } from "react";
import { branchService } from "../../branches/branchService";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";
import ToastMessage from "../../../components/common/ToastMessage";

export default function OwnerBranchesPage() {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("ALL");
  const [openModal, setOpenModal] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", country: "Vietnam", city: "", address: "", phone: "", email: "", timezone: "Asia/Ho_Chi_Minh" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = () => {
    branchService.getBranches().then((data) => setRows(data || [])).catch((err) => setError(err.message || "Khong the tai chi nhanh"));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cityOptions = Array.from(new Set(rows.map((item) => item.city).filter(Boolean)));
  const filtered = rows.filter((item) => {
    const matchQuery = !query
      || item.code?.toLowerCase().includes(query.toLowerCase())
      || item.name?.toLowerCase().includes(query.toLowerCase())
      || item.address?.toLowerCase().includes(query.toLowerCase());
    const matchCity = cityFilter === "ALL" || item.city === cityFilter;
    return matchQuery && matchCity;
  });

  const create = async () => {
    try {
      await dashboardService.createOwnerBranch(form);
      setMessage("Da tao branch moi");
      setOpenModal(false);
      setForm({ code: "", name: "", country: "Vietnam", city: "", address: "", phone: "", email: "", timezone: "Asia/Ho_Chi_Minh" });
      fetchData();
    } catch (err) {
      setError(err.message || "Khong the tao branch");
    }
  };

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Quan ly chi nhanh</h1>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      <div className="table-toolbar">
        <input placeholder="Tim code / ten / dia chi" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)}>
          <option value="ALL">Tat ca thanh pho</option>
          {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
        </select>
        <button className="btn btn-primary" onClick={() => setOpenModal(true)}>+ Tao chi nhanh</button>
      </div>

      <DataTable
        rows={filtered}
        columns={[
          { key: "code", label: "Code" },
          { key: "name", label: "Ten" },
          { key: "city", label: "Thanh pho" },
          { key: "address", label: "Dia chi" },
          { key: "phone", label: "Phone" }
        ]}
      />

      {openModal && (
        <div className="modal-overlay">
          <div className="card modal-card">
            <h3 style={{ margin: 0 }}>Tao chi nhanh moi</h3>
            <div className="form-grid">
              <input placeholder="Code" value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))} />
              <input placeholder="Ten" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              <input placeholder="Country" value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} />
              <input placeholder="City" value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
              <input placeholder="Address" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} />
              <input placeholder="Phone" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
              <input placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={() => setOpenModal(false)}>Huy</button>
              <button className="btn btn-primary" onClick={create}>Tao branch</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
