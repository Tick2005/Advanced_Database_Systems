import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { validatePricingForm } from "../../dashboard/domainValidators";
import { useTracking } from "../../../hooks/useTracking";

export default function OwnerPricingPage() {
  const { can } = usePermissions();
  const track = useTracking("owner-pricing");
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ branchId: "", name: "", startsOn: "", endsOn: "", discountPercent: 0, notes: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
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
    if (!can(ACTIONS.PRICING_CREATE)) {
      setError("Ban khong co quyen tao pricing");
      return;
    }

    const nextErrors = validatePricingForm(form);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await dashboardService.createOwnerPricing({ ...form, discountPercent: Number(form.discountPercent || 0) });
      setMessage("Da tao pricing");
      setFieldErrors({});
      track("pricing_created", { branchId: form.branchId, name: form.name, discountPercent: Number(form.discountPercent || 0) });
      fetchData();
      setForm({ branchId: form.branchId, name: "", startsOn: "", endsOn: "", discountPercent: 0, notes: "" });
    } catch (err) {
      setError(err.message || "Khong the tao pricing");
      track("pricing_create_failed", { reason: err.message || "unknown" });
    } finally {
      setSaving(false);
    }
  };

  const update = async (item) => {
    if (!can(ACTIONS.PRICING_UPDATE)) {
      setError("Ban khong co quyen cap nhat pricing");
      return;
    }

    const nextErrors = validatePricingForm(item);
    if (Object.keys(nextErrors).length > 0) {
      setError(Object.values(nextErrors)[0]);
      return;
    }

    try {
      await dashboardService.updateOwnerPricing(item.id, {
        name: item.name,
        startsOn: item.startsOn,
        endsOn: item.endsOn,
        discountPercent: Number(item.discountPercent || 0),
        notes: item.notes || ""
      });
      setMessage("Da cap nhat pricing");
      track("pricing_updated", { pricingId: item.id, discountPercent: Number(item.discountPercent || 0) });
      fetchData();
    } catch (err) {
      setError(err.message || "Khong the cap nhat pricing");
      track("pricing_update_failed", { pricingId: item.id, reason: err.message || "unknown" });
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
        renderActions={(row) => <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 10px" }} onClick={() => update(row)} disabled={!can(ACTIONS.PRICING_UPDATE)}>Luu cap nhat</button>}
      />
      <article className="card" style={{ padding: 14, display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Tao pricing moi</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Branch ID" value={form.branchId} onChange={(event) => setForm((prev) => ({ ...prev, branchId: event.target.value }))} />
          {fieldErrors.branchId && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.branchId}</small>}
          <input placeholder="Ten pricing" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          {fieldErrors.name && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.name}</small>}
          <input type="date" value={form.startsOn} onChange={(event) => setForm((prev) => ({ ...prev, startsOn: event.target.value }))} />
          <input type="date" value={form.endsOn} onChange={(event) => setForm((prev) => ({ ...prev, endsOn: event.target.value }))} />
          {fieldErrors.dateRange && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.dateRange}</small>}
          <input type="number" value={form.discountPercent} onChange={(event) => setForm((prev) => ({ ...prev, discountPercent: Number(event.target.value || 0) }))} />
          {fieldErrors.discountPercent && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.discountPercent}</small>}
          <input placeholder="Ghi chu" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
          {fieldErrors.notes && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.notes}</small>}
        </div>
        <button className="btn btn-gold" onClick={create} disabled={!can(ACTIONS.PRICING_CREATE) || saving}>Tao pricing</button>
      </article>
    </section>
  );
}
