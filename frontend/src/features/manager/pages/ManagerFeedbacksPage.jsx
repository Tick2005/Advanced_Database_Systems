import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import ToastMessage from "../../../components/common/ToastMessage";
import EmptyState from "../../../components/common/EmptyState";

export default function ManagerFeedbacksPage() {
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [reply, setReply] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [selectedFeedbackId, setSelectedFeedbackId] = useState("");
  const [activeModal, setActiveModal] = useState(null); // "reply" | "report"
  const [showAll, setShowAll] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    branchService.getBranches().then(async (branches) => {
      const branchId = branches?.[0]?.id || "";
      if (!branchId) { setLoading(false); return; }
      const roomData = await dashboardService.getManagerRoomsByBranch(branchId);
      setRooms(roomData || []);
      setRoomId(roomData?.[0]?.id || "");
    }).catch((err) => setError(err.message || "Không thể tải phòng"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!roomId) return;
    dashboardService.getManagerFeedbackByRoom(roomId).then((data) => {
      setFeedbacks(data || []);
    }).catch((err) => setError(err.message || "Không thể tải feedback"));
  }, [roomId]);

  const filtered = feedbacks.filter((item) => {
    const matchQuery = !query
      || item.customerName?.toLowerCase().includes(query.toLowerCase())
      || item.content?.toLowerCase().includes(query.toLowerCase());
    const matchRating = ratingFilter === "ALL" || String(item.rating) === ratingFilter;
    return matchQuery && matchRating;
  }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  const visibleFeedbacks = showAll ? filtered : filtered.slice(0, 5);

  const openModal = (type, feedbackId) => {
    setSelectedFeedbackId(feedbackId);
    setReply("");
    setReportReason("");
    setActiveModal(type);
  };

  const submitReply = async () => {
    if (!selectedFeedbackId || !reply.trim()) return;
    try {
      await dashboardService.replyManagerFeedback({ feedbackId: selectedFeedbackId, reply });
      setMessage("Đã gửi phản hồi");
      setActiveModal(null);
      const data = await dashboardService.getManagerFeedbackByRoom(roomId);
      setFeedbacks(data || []);
    } catch (err) {
      setError(err.message || "Không thể gửi phản hồi");
    }
  };

  const submitReport = async () => {
    if (!selectedFeedbackId || !reportReason.trim()) return;
    try {
      await dashboardService.reportManagerFeedback(selectedFeedbackId, reportReason);
      setMessage("Đã gửi báo cáo feedback");
      setActiveModal(null);
    } catch (err) {
      setError(err.message || "Không thể gửi báo cáo");
    }
  };

  const REPORT_REASONS = [
    "Nội dung không phù hợp",
    "Spam / quảng cáo",
    "Thông tin sai sự thật",
    "Ngôn ngữ xúc phạm",
    "Khác"
  ];

  const STAR_COLORS = { 5: "#16a34a", 4: "#84cc16", 3: "#f59e0b", 2: "#f97316", 1: "#ef4444" };

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <div>
        <h1 style={{ margin: 0 }}>💬 Feedback Khách Hàng</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Quản lý và phản hồi đánh giá của khách</p>
      </div>

      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <select
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>{room.roomNumber} — {room.roomTypeName}</option>
          ))}
        </select>
        <input
          placeholder="🔍 Tìm tên khách / nội dung"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
        />
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
        >
          <option value="ALL">Tất cả đánh giá</option>
          {[5, 4, 3, 2, 1].map((r) => <option key={r} value={String(r)}>{r} sao</option>)}
        </select>
      </div>

      {/* Feedback list */}
      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Chưa có feedback" description="Phản hồi của khách sẽ hiển thị tại đây." />
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {visibleFeedbacks.map((fb) => (
            <article key={fb.id} className="card" style={{ padding: 16, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{fb.customerName || "Khách"}</span>
                  <span style={{ marginLeft: 10, fontSize: 12, color: "#94a3b8" }}>
                    {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString("vi-VN") : ""}
                  </span>
                </div>
                <span style={{
                  fontWeight: 800, fontSize: 15,
                  color: STAR_COLORS[fb.rating] || "#94a3b8"
                }}>
                  {"★".repeat(fb.rating || 0)}{"☆".repeat(5 - (fb.rating || 0))} {fb.rating}/5
                </span>
              </div>

              <p style={{ margin: 0, color: "#334155", fontSize: 14, lineHeight: 1.6 }}>{fb.content}</p>

              {fb.managerReply && (
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "#f0f9ff", border: "1px solid #bae6fd", fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: "#0284c7" }}>Phản hồi của manager: </span>
                  {fb.managerReply}
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: 13, padding: "6px 14px" }}
                  onClick={() => openModal("reply", fb.id)}
                >
                  💬 Phản hồi
                </button>
                <button
                  className="btn"
                  style={{ fontSize: 13, padding: "6px 14px", border: "1px solid #fecaca", color: "#b91c1c", background: "white" }}
                  onClick={() => openModal("report", fb.id)}
                >
                  🚩 Report
                </button>
              </div>
            </article>
          ))}

          {filtered.length > 5 && (
            <button
              className="btn"
              style={{ border: "1px solid #e2e8f0", background: "white", width: "100%" }}
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Thu gọn" : `Xem thêm ${filtered.length - 5} feedback`}
            </button>
          )}
        </div>
      )}

      {/* Reply Modal */}
      {activeModal === "reply" && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ display: "grid", gap: 14, maxWidth: 500, width: "100%" }}>
            <h3 style={{ margin: 0 }}>💬 Phản hồi feedback</h3>
            <div>
              <label style={{ fontSize: 13, color: "#475569", display: "block", marginBottom: 6 }}>Chọn mẫu phản hồi nhanh</label>
              <select
                onChange={(e) => { if (e.target.value) setReply(e.target.value); }}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, marginBottom: 8 }}
              >
                <option value="">-- Mẫu phản hồi --</option>
                <option value="Cảm ơn bạn đã dành thời gian đánh giá. Chúng tôi rất trân trọng phản hồi của bạn và sẽ tiếp tục cải thiện dịch vụ.">
                  Cảm ơn & cải thiện
                </option>
                <option value="Chúng tôi xin lỗi về trải nghiệm chưa tốt của bạn. Chúng tôi đã ghi nhận và sẽ khắc phục ngay.">
                  Xin lỗi & khắc phục
                </option>
                <option value="Cảm ơn đánh giá 5 sao của bạn! Chúng tôi rất vui khi được phục vụ và mong đón bạn trở lại.">
                  Cảm ơn đánh giá 5 sao
                </option>
              </select>
              <textarea
                placeholder="Nhập nội dung phản hồi..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "vertical", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={() => setActiveModal(null)}>Huỷ</button>
              <button className="btn btn-primary" onClick={submitReply} disabled={!reply.trim()}>Gửi phản hồi</button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {activeModal === "report" && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ display: "grid", gap: 14, maxWidth: 460, width: "100%" }}>
            <h3 style={{ margin: 0 }}>🚩 Báo cáo feedback</h3>
            <div>
              <label style={{ fontSize: 13, color: "#475569", display: "block", marginBottom: 6 }}>Chọn lý do báo cáo</label>
              <div style={{ display: "grid", gap: 6 }}>
                {REPORT_REASONS.map((r) => (
                  <label key={r} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", fontSize: 14 }}>
                    <input
                      type="radio"
                      name="report-reason"
                      value={r}
                      checked={reportReason === r}
                      onChange={() => setReportReason(r)}
                    />
                    {r}
                  </label>
                ))}
              </div>
              <textarea
                placeholder="Mô tả thêm (nếu cần)..."
                value={reportReason.startsWith("Khác") || !REPORT_REASONS.includes(reportReason) ? reportReason : ""}
                onChange={(e) => setReportReason(e.target.value)}
                rows={2}
                style={{ width: "100%", marginTop: 8, padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, resize: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={() => setActiveModal(null)}>Huỷ</button>
              <button
                className="btn"
                style={{ border: "1px solid #fecaca", color: "#b91c1c", background: "#fff1f2" }}
                onClick={submitReport}
                disabled={!reportReason.trim()}
              >
                Gửi báo cáo
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
