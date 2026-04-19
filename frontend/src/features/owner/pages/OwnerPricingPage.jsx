import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";
import ToastMessage from "../../../components/common/ToastMessage";

export default function OwnerPricingPage() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ branchId: "", name: "", startsOn: "", endsOn: "", discountPercent: 0, notes: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = () => {
    dashboardService.getOwnerPricing().then((data) => {
      setRows(data || []);
      if (!form.branchId && data?.[0]?.branchId) {
        setForm((prev) => ({ ...prev, branchId: data[0].branchId }));
      }
    }).catch((err) => setError(err.message || "Khong the tai pricing"));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const create = async () => {
    try {
      await dashboardService.createOwnerPricing({ ...form, discountPercent: Number(form.discountPercent || 0) });
      setMessage("Da tao pricing");
      fetchData();
    } catch (err) {
      setError(err.message || "Khong the tao pricing");
    }
  };

  const update = async (item) => {
    try {
      await dashboardService.updateOwnerPricing(item.id, {
        name: item.name,
        startsOn: item.startsOn,
        endsOn: item.endsOn,
        discountPercent: Number(item.discountPercent || 0),
        notes: item.notes || ""
      });
      setMessage("Da cap nhat pricing");
      fetchData();
    } catch (err) {
      setError(err.message || "Khong the cap nhat pricing");
    }
  };

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Quan ly pricing</h1>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
      <DataTable
        rows={rows}
        columns={[
          { key: "name", label: "Ten" },
          { key: "branchId", label: "Branch" },
          { key: "startsOn", label: "Bat dau" },
          { key: "endsOn", label: "Ket thuc" },
          { key: "discountPercent", label: "% Giam" }
        ]}
        renderActions={(row) => <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 10px" }} onClick={() => update(row)}>Luu cap nhat</button>}
      />
      <article className="card" style={{ padding: 14, display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Tao pricing moi</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Branch ID" value={form.branchId} onChange={(event) => setForm((prev) => ({ ...prev, branchId: event.target.value }))} />
          <input placeholder="Ten pricing" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          <input type="date" value={form.startsOn} onChange={(event) => setForm((prev) => ({ ...prev, startsOn: event.target.value }))} />
          <input type="date" value={form.endsOn} onChange={(event) => setForm((prev) => ({ ...prev, endsOn: event.target.value }))} />
          <input type="number" value={form.discountPercent} onChange={(event) => setForm((prev) => ({ ...prev, discountPercent: Number(event.target.value || 0) }))} />
          <input placeholder="Ghi chu" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
        </div>
        <button className="btn btn-gold" onClick={create}>Tao pricing</button>
      </article>
    </section>
  );
}
