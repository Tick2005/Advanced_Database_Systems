import { useEffect, useState } from "react";
import { dashboardService } from "./dashboardService";
import { formatCurrencyVnd, formatDate, formatStatus } from "../../services/presenters";

export default function OwnerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [pricingList, setPricingList] = useState([]);
  const [pricingRequests, setPricingRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [branchForm, setBranchForm] = useState({
    code: "",
    name: "",
    country: "Vietnam",
    city: "",
    address: "",
    phone: "",
    email: "",
    timezone: "Asia/Ho_Chi_Minh"
  });

  const [pricingForm, setPricingForm] = useState({
    branchId: "",
    name: "",
    startsOn: "",
    endsOn: "",
    discountPercent: 0,
    notes: ""
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardData, pricingData, pricingReqData, usersData, reportData] = await Promise.all([
        dashboardService.getOwnerDashboard(),
        dashboardService.getOwnerPricing(),
        dashboardService.getOwnerPricingRequests(),
        dashboardService.getOwnerUsers(),
        dashboardService.getOwnerReports()
      ]);
      setDashboard(dashboardData || null);
      setPricingList(pricingData || []);
      setPricingRequests(pricingReqData || []);
      setUsers(usersData || []);
      setReports(reportData || []);
      if (!pricingForm.branchId && pricingData?.[0]?.branchId) {
        setPricingForm((prev) => ({ ...prev, branchId: pricingData[0].branchId }));
      }
    } catch (err) {
      setError(err.message || "Khong the tai dashboard owner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const callAction = async (fn, successMessage = "Thao tac thanh cong") => {
    setError("");
    setMessage("");
    try {
      await fn();
      setMessage(successMessage);
      await loadData();
    } catch (err) {
      setError(err.message || "Thao tac that bai");
    }
  };

  if (loading) return <div className="card" style={{ padding: 18 }}>Dang tai dashboard owner...</div>;

  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div className="page-heading">
        <h1>Owner Dashboard</h1>
        <p>Tổng điều hành hệ thống với nhịp nhìn sang, rõ và phù hợp mô hình hotel chain.</p>
      </div>
      {message && <div style={{ color: "#166534" }}>{message}</div>}
      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}

      <article className="promo-banner">
        <div className="section-title" style={{ color: "white" }}>
          <h2 style={{ margin: 0 }}>Tổng quan hệ thống</h2>
          <small style={{ color: "rgba(255,255,255,0.78)" }}>Tập trung vào hiệu suất branch, pricing và doanh thu</small>
        </div>
        <div className="hero-stats" style={{ marginTop: 14 }}>
          <div className="hero-stat"><strong>{dashboard?.activeBranchCount || 0}</strong><span>Chi nhánh hoạt động</span></div>
          <div className="hero-stat"><strong>{dashboard?.conversion?.holdRate ?? 0}%</strong><span>Conversion hold</span></div>
          <div className="hero-stat"><strong>{dashboard?.conversion?.confirmRate ?? 0}%</strong><span>Conversion confirmed</span></div>
        </div>
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Quan ly pricing</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {pricingList.map((item) => (
            <div key={item.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "grid", gap: 4 }}>
              <strong>{item.name}</strong>
              <div>Branch: {item.branchId}</div>
              <div>{formatDate(item.startsOn)} - {formatDate(item.endsOn)} · {item.discountPercent}%</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Branch ID" value={pricingForm.branchId} onChange={(event) => setPricingForm((prev) => ({ ...prev, branchId: event.target.value }))} />
          <input placeholder="Ten pricing" value={pricingForm.name} onChange={(event) => setPricingForm((prev) => ({ ...prev, name: event.target.value }))} />
          <input type="date" value={pricingForm.startsOn} onChange={(event) => setPricingForm((prev) => ({ ...prev, startsOn: event.target.value }))} />
          <input type="date" value={pricingForm.endsOn} onChange={(event) => setPricingForm((prev) => ({ ...prev, endsOn: event.target.value }))} />
          <input type="number" value={pricingForm.discountPercent} onChange={(event) => setPricingForm((prev) => ({ ...prev, discountPercent: Number(event.target.value || 0) }))} />
          <input placeholder="Ghi chu" value={pricingForm.notes} onChange={(event) => setPricingForm((prev) => ({ ...prev, notes: event.target.value }))} />
        </div>
        <button className="btn btn-gold" style={{ marginTop: 10 }} onClick={() => callAction(() => dashboardService.createOwnerPricing(pricingForm), "Da tao pricing")}>Tao pricing moi</button>
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Duyet pricing requests</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {pricingRequests.map((req) => (
            <div key={req.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "grid", gap: 4 }}>
              <div><strong>{req.name}</strong> · {formatStatus(req.status)}</div>
              <div>{req.branchId} · {req.discountPercent}%</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" onClick={() => callAction(() => dashboardService.approveOwnerPricingRequest(req.id), "Da duyet request")}>Approve</button>
                <button className="btn" onClick={() => callAction(() => dashboardService.rejectOwnerPricingRequest(req.id), "Da tu choi request")}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Tao branch moi</h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Code" value={branchForm.code} onChange={(event) => setBranchForm((prev) => ({ ...prev, code: event.target.value }))} />
          <input placeholder="Ten chi nhanh" value={branchForm.name} onChange={(event) => setBranchForm((prev) => ({ ...prev, name: event.target.value }))} />
          <input placeholder="Country" value={branchForm.country} onChange={(event) => setBranchForm((prev) => ({ ...prev, country: event.target.value }))} />
          <input placeholder="City" value={branchForm.city} onChange={(event) => setBranchForm((prev) => ({ ...prev, city: event.target.value }))} />
          <input placeholder="Address" value={branchForm.address} onChange={(event) => setBranchForm((prev) => ({ ...prev, address: event.target.value }))} />
          <input placeholder="Phone" value={branchForm.phone} onChange={(event) => setBranchForm((prev) => ({ ...prev, phone: event.target.value }))} />
          <input placeholder="Email" value={branchForm.email} onChange={(event) => setBranchForm((prev) => ({ ...prev, email: event.target.value }))} />
        </div>
        <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={() => callAction(() => dashboardService.createOwnerBranch(branchForm), "Da tao branch")}>Tao branch</button>
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Quan ly users va role</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {users.map((user) => (
            <div key={user.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "grid", gap: 5 }}>
              <div><strong>{user.email}</strong> · {user.role}</div>
              <div>Created: {formatDate(user.createdAt)}</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select defaultValue={user.role} onChange={(event) => callAction(() => dashboardService.updateOwnerUserRole(user.id, event.target.value), "Da cap nhat role") }>
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="STAFF">STAFF</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="OWNER">OWNER</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Revenue reports</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {reports.map((report) => (
            <div key={`${report.roomTypeId}-${report.revenueQuarter}`} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
              <strong>{report.roomTypeName}</strong> · {report.branchName}
              <div>Quarter: {report.revenueQuarter} · Rank: {report.profitRank}</div>
              <div className="mono">{formatCurrencyVnd(report.totalRevenue)}</div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
