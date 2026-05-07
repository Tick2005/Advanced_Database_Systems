import { useEffect, useState, useMemo } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import StatusBadge from "../../../components/common/StatusBadge";
import ToastMessage from "../../../components/common/ToastMessage";
import { usePermissions } from "../../../hooks/usePermissions";
import { ACTIONS } from "../../../services/permissions";
import { useTracking } from "../../../hooks/useTracking";
import { dashboardService as ds } from "../../dashboard/dashboardService";

export default function OwnerPricingRequestsPage() {
  const { can, currentEmail } = usePermissions();
  const track = useTracking("owner-pricing-requests");
  const [rows, setRows] = useState([]);
  const [processingId, setProcessingId] = useState("");
  const [delegateModal, setDelegateModal] = useState(null); // { requestId }
  const [delegateEmail, setDelegateEmail] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchData = () => {
    ds.getOwnerPricingRequests().then((data) => setRows(data || []))
      .catch((err) => setError(err.message || "Không thể tải pricing requests"));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() =>
    filterStatus === "ALL" ? rows : rows.filter((r) => r.status === filterStatus),
    [rows, filterStatus]
  );

  const approve = async (row) => {
    if (!can(ACTIONS.PRICING_REQUEST_APPROVE, { status: row.status })) { setError("Bạn không có quyền duyệt request này"); return; }
    setProcessingId(row.id);
    try {
      await ds.approveOwnerPricingRequest(row.id);
      setMessage("✅ Đã duyệt pricing request");
      track("pricing_request_approved", { requestId: row.id });
      fetchData();
    } catch (err) {
      setError(err.message || "Không thể duyệt request");
    } finally { setProcessingId(""); }
  };

  const openReject = (row) => { setRejectModal(row); setRejectReason(""); };

  const confirmReject = async () => {
    if (!rejectModal) return;
    if (!can(ACTIONS.PRICING_REQUEST_REJECT, { status: rejectModal.status })) { setError("Bạn không có quyền từ chối request này"); return; }
    setProcessingId(rejectModal.id);
    try {
      await ds.rejectOwnerPricingRequest(rejectModal.id, rejectReason || "Không phù hợp");
      setMessage("❌ Đã từ chối pricing request");
      track("pricing_request_rejected", { requestId: rejectModal.id, reason: rejectReason });
      setRejectModal(null);
      fetchData();
    } catch (err) {
      setError(err.message || "Không thể từ chối request");
    } finally { setProcessingId(""); }
  };

  const openDelegate = (row) => { setDelegateModal(row); setDelegateEmail(""); };

  const confirmDelegate = async () => {
    if (!delegateModal || !delegateEmail.trim()) return;
    setProcessingId(delegateModal.id);
    try {
      await ds.delegatePricingRequest(delegateModal.id, delegateEmail);
      setMessage(`🤝 Đã uỷ quyền xử lý cho ${delegateEmail}. Báo cáo sẽ được gửi đến bạn.`);
      track("pricing_request_delegated", { requestId: delegateModal.id, delegateEmail });
      setDelegateModal(null);
      fetchData();
    } catch (err) {
      setError(err.message || "Không thể uỷ quyền");
    } finally { setProcessingId(""); }
  };

  const STATS = [
    { key: "PENDING", label: "Chờ duyệt", bg: "#fef9c3", color: "#854d0e" },
    { key: "APPROVED", label: "Đã duyệt", bg: "#dcfce7", color: "#16a34a" },
    { key: "REJECTED", label: "Đã từ chối", bg: "#fee2e2", color: "#b91c1c" },
    { key: "DELEGATED", label: "Đã uỷ quyền", bg: "#dbeafe", color: "#1e40af" }
  ];

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div style={{
        padding: "16px 20px", borderRadius: 14,
        background: "linear-gradient(135deg, #0d2238 0%, #1e3a5f 100%)",
        color: "white", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8
      }}>
        <div>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Duyệt yêu cầu</div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Pricing Requests</div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>Quyết định chính về pricing từ các manager</div>
        </div>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Stats filter */}
      <div className="card" style={{ padding: 14, display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => setFilterStatus("ALL")}
          style={{
            padding: "6px 16px", borderRadius: 99, fontSize: 12, cursor: "pointer",
            border: `1px solid ${filterStatus === "ALL" ? "#0d2238" : "#e2e8f0"}`,
            background: filterStatus === "ALL" ? "#0d2238" : "white",
            color: filterStatus === "ALL" ? "white" : "#475569", fontWeight: filterStatus === "ALL" ? 700 : 400
          }}
        >
          Tất cả ({rows.length})
        </button>
        {STATS.map((s) => {
          const count = rows.filter((r) => r.status === s.key).length;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setFilterStatus(s.key)}
              style={{
                padding: "6px 16px", borderRadius: 99, fontSize: 12, cursor: "pointer",
                border: `1px solid ${filterStatus === s.key ? s.color : "#e2e8f0"}`,
                background: filterStatus === s.key ? s.bg : "white",
                color: filterStatus === s.key ? s.color : "#64748b",
                fontWeight: filterStatus === s.key ? 700 : 400
              }}
            >
              {s.label} ({count})
            </button>
          );
        })}
        </div>
      </div>

      {/* Request cards */}
      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map((row) => (
          <article key={row.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 16px", background: "#f8fafc", flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: 15 }}>{row.name}</span>
                  <StatusBadge value={row.status} />
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  {row.branchName || row.branchId?.slice(0, 12) || "?"}
                  {row.startsOn && ` · ${row.startsOn} → ${row.endsOn}`}
                </div>
              </div>
              {row.discountPercent > 0 && (
                <span style={{ background: "#fef9c3", color: "#854d0e", padding: "3px 14px", borderRadius: 99, fontSize: 13, fontWeight: 800 }}>
                  -{row.discountPercent}%
                </span>
              )}
            </div>

            {row.notes && (
              <div style={{ padding: "8px 16px", borderBottom: "1px solid #f1f5f9", fontSize: 13, color: "#475569" }}>
                📝 {row.notes}
              </div>
            )}

            {row.delegatedTo && (
              <div style={{ padding: "6px 16px", background: "#dbeafe", fontSize: 12, color: "#1e40af" }}>
                🤝 Đã uỷ quyền cho: <strong>{row.delegatedTo}</strong>
              </div>
            )}

            {row.status === "PENDING" && (
              <div style={{ display: "flex", gap: 8, padding: "10px 16px", flexWrap: "wrap" }}>
                <button
                  className="btn btn-primary"
                  style={{ padding: "7px 14px", fontSize: 13 }}
                  onClick={() => approve(row)}
                  disabled={processingId === row.id || !can(ACTIONS.PRICING_REQUEST_APPROVE, { status: row.status })}
                >
                  {processingId === row.id ? "..." : "✅ Phê duyệt"}
                </button>
                <button
                  className="btn"
                  style={{ padding: "7px 14px", fontSize: 13, border: "1px solid #fecaca", color: "#b91c1c", background: "white" }}
                  onClick={() => openReject(row)}
                  disabled={processingId === row.id || !can(ACTIONS.PRICING_REQUEST_REJECT, { status: row.status })}
                >
                  ❌ Từ chối
                </button>
                <button
                  className="btn"
                  style={{ padding: "7px 14px", fontSize: 13, border: "1px solid #bfdbfe", color: "#1d4ed8", background: "#eff6ff" }}
                  onClick={() => openDelegate(row)}
                  disabled={processingId === row.id}
                >
                  🤝 Uỷ quyền
                </button>
              </div>
            )}
          </article>
        ))}

        {filtered.length === 0 && (
          <div className="card" style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
            Không có request nào với trạng thái đã chọn.
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ display: "grid", gap: 14, maxWidth: 440, width: "100%" }}>
            <h3 style={{ margin: 0 }}>❌ Từ chối pricing request</h3>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{rejectModal.name}</div>
            <div>
              <label style={{ fontSize: 13, color: "#475569", display: "block", marginBottom: 6 }}>Lý do từ chối</label>
              <textarea
                rows={3}
                placeholder="Nhập lý do từ chối để manager có thể cải thiện..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={() => setRejectModal(null)}>Huỷ</button>
              <button className="btn" style={{ border: "1px solid #fecaca", color: "#b91c1c", background: "#fff1f2" }} onClick={confirmReject} disabled={processingId === rejectModal.id}>
                {processingId === rejectModal.id ? "..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delegate Modal */}
      {delegateModal && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ display: "grid", gap: 14, maxWidth: 440, width: "100%" }}>
            <h3 style={{ margin: 0 }}>🤝 Uỷ quyền xử lý request</h3>
            <div style={{ padding: "8px 12px", borderRadius: 8, background: "#fef9c3", border: "1px solid #fde68a", fontSize: 13 }}>
              ⚠️ Người được uỷ quyền sẽ thay mặt owner đưa ra quyết định. Một báo cáo xác nhận sẽ được gửi đến <strong>{currentEmail}</strong>.
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{delegateModal.name}</div>
            <div>
              <label style={{ fontSize: 13, color: "#475569", display: "block", marginBottom: 6 }}>Email người được uỷ quyền *</label>
              <input
                type="email"
                placeholder="manager@luxstay.com"
                value={delegateEmail}
                onChange={(e) => setDelegateEmail(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14, boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={() => setDelegateModal(null)}>Huỷ</button>
              <button className="btn" style={{ border: "1px solid #bfdbfe", color: "#1d4ed8", background: "#eff6ff" }} onClick={confirmDelegate} disabled={!delegateEmail.trim() || processingId === delegateModal.id}>
                {processingId === delegateModal.id ? "..." : "🤝 Xác nhận uỷ quyền"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
