import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";
import StatusBadge from "../../../components/common/StatusBadge";
import ToastMessage from "../../../components/common/ToastMessage";

export default function OwnerPricingRequestsPage() {
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = () => {
    dashboardService.getOwnerPricingRequests().then((data) => {
      setRows(data || []);
    }).catch((err) => setError(err.message || "Khong the tai pricing requests"));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const approve = async (id) => {
    try {
      await dashboardService.approveOwnerPricingRequest(id);
      setMessage("Da duyet pricing request");
      fetchData();
    } catch (err) {
      setError(err.message || "Khong the duyet request");
    }
  };

  const reject = async (id) => {
    try {
      await dashboardService.rejectOwnerPricingRequest(id);
      setMessage("Da tu choi pricing request");
      fetchData();
    } catch (err) {
      setError(err.message || "Khong the tu choi request");
    }
  };

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Duyet pricing requests</h1>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
      <DataTable
        rows={rows}
        columns={[
          { key: "name", label: "Ten" },
          { key: "branchId", label: "Branch" },
          { key: "discountPercent", label: "Discount" },
          { key: "status", label: "Trang thai", render: (row) => <StatusBadge value={row.status} /> }
        ]}
        renderActions={(row) => (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn btn-primary" style={{ padding: "6px 10px" }} onClick={() => approve(row.id)}>Approve</button>
            <button className="btn" style={{ border: "1px solid #fecaca", color: "#b91c1c", background: "white", padding: "6px 10px" }} onClick={() => reject(row.id)}>Reject</button>
          </div>
        )}
      />
    </section>
  );
}
