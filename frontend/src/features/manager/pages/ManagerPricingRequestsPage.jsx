import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import DataTable from "../../../components/common/DataTable";
import StatusBadge from "../../../components/common/StatusBadge";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { validatePricingForm } from "../../dashboard/domainValidators";
import { useTracking } from "../../../hooks/useTracking";

export default function ManagerPricingRequestsPage() {
  const { can } = usePermissions();
  const track = useTracking("manager-pricing-requests");
  const [rows, setRows] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [form, setForm] = useState({ name: "", startsOn: "", endsOn: "", discountPercent: 0, notes: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = () => {
    dashboardService.getManagerPricingRequests().then((data) => {
      setRows(data || []);
    }).catch((err) => setError(err.message || "Khong the tai pricing request"));
  };

  useEffect(() => {
    fetchData();
    branchService.getBranches().then((data) => {
      setBranches(data || []);
      setBranchId(data?.[0]?.id || "");
    });
  }, []);

  const submit = async () => {
    if (!can(ACTIONS.PRICING_REQUEST_CREATE)) {
      setError("Ban khong co quyen gui pricing request");
      return;
    }

    const nextErrors = validatePricingForm({ ...form, branchId });
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      await dashboardService.createManagerPricingRequest({ ...form, branchId, discountPercent: Number(form.discountPercent || 0) });
      setMessage("Da tao pricing request");
      setFieldErrors({});
      track("pricing_request_created", { branchId, name: form.name, discountPercent: Number(form.discountPercent || 0) });
      fetchData();
      setForm({ name: "", startsOn: "", endsOn: "", discountPercent: 0, notes: "" });
    } catch (err) {
      setError(err.message || "Khong the tao pricing request");
      track("pricing_request_create_failed", { branchId, reason: err.message || "unknown" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Pricing requests</h1>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
      <DataTable
        rows={rows}
        columns={[
          { key: "name", label: "Ten chuong trinh" },
          { key: "branchId", label: "Branch" },
          { key: "period", label: "Thoi gian", render: (row) => `${row.startsOn} -> ${row.endsOn}` },
          { key: "discountPercent", label: "Discount" },
          { key: "status", label: "Trang thai", render: (row) => <StatusBadge value={row.status} /> }
        ]}
      />

      <article className="card" style={{ padding: 14, display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Gui yeu cau moi</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
            ))}
          </select>
          {fieldErrors.branchId && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.branchId}</small>}
          <input placeholder="Ten" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
          {fieldErrors.name && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.name}</small>}
          <input type="date" value={form.startsOn} onChange={(event) => setForm((prev) => ({ ...prev, startsOn: event.target.value }))} />
          <input type="date" value={form.endsOn} onChange={(event) => setForm((prev) => ({ ...prev, endsOn: event.target.value }))} />
          {fieldErrors.dateRange && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.dateRange}</small>}
          <input type="number" value={form.discountPercent} onChange={(event) => setForm((prev) => ({ ...prev, discountPercent: Number(event.target.value || 0) }))} />
          {fieldErrors.discountPercent && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.discountPercent}</small>}
          <input placeholder="Ghi chu" value={form.notes} onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))} />
          {fieldErrors.notes && <small style={{ color: "#b91c1c", gridColumn: "1 / -1" }}>{fieldErrors.notes}</small>}
        </div>
        <button className="btn btn-gold" onClick={submit} disabled={!can(ACTIONS.PRICING_REQUEST_CREATE) || submitting}>Gui request</button>
      </article>
    </section>
  );
}
