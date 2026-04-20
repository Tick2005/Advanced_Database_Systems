import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";
import StatusBadge from "../../../components/common/StatusBadge";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { useTracking } from "../../../hooks/useTracking";

export default function OwnerPricingRequestsPage() {
  const { can } = usePermissions();
  const track = useTracking("owner-pricing-requests");
  const [rows, setRows] = useState([]);
  const [processingId, setProcessingId] = useState("");
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

  const approve = async (row) => {
    if (!can(ACTIONS.PRICING_REQUEST_APPROVE, { status: row.status })) {
      setError("Ban khong co quyen duyet request nay");
      return;
    }

    setProcessingId(row.id);
    try {
      await dashboardService.approveOwnerPricingRequest(row.id);
      setMessage("Da duyet pricing request");
      track("pricing_request_approved", { requestId: row.id, branchId: row.branchId });
      fetchData();
    } catch (err) {
      setError(err.message || "Khong the duyet request");
      track("pricing_request_approve_failed", { requestId: row.id, reason: err.message || "unknown" });
    } finally {
      setProcessingId("");
    }
  };

  const reject = async (row) => {
    if (!can(ACTIONS.PRICING_REQUEST_REJECT, { status: row.status })) {
      setError("Ban khong co quyen tu choi request nay");
      return;
    }

    setProcessingId(row.id);
    try {
      await dashboardService.rejectOwnerPricingRequest(row.id);
      setMessage("Da tu choi pricing request");
      track("pricing_request_rejected", { requestId: row.id, branchId: row.branchId });
      fetchData();
    } catch (err) {
      setError(err.message || "Khong the tu choi request");
      track("pricing_request_reject_failed", { requestId: row.id, reason: err.message || "unknown" });
    } finally {
      setProcessingId("");
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
            <button className="btn btn-primary" style={{ padding: "6px 10px" }} onClick={() => approve(row)} disabled={processingId === row.id || !can(ACTIONS.PRICING_REQUEST_APPROVE, { status: row.status })}>Approve</button>
            <button className="btn" style={{ border: "1px solid #fecaca", color: "#b91c1c", background: "white", padding: "6px 10px" }} onClick={() => reject(row)} disabled={processingId === row.id || !can(ACTIONS.PRICING_REQUEST_REJECT, { status: row.status })}>Reject</button>
          </div>
        )}
      />
    </section>
  );
}
