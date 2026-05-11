import { useEffect, useState, useMemo, useCallback } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import ToastMessage from "../../../components/common/ToastMessage";
import EmptyState from "../../../components/common/EmptyState";
import RatingStars from "../../../components/common/RatingStars";
import { dashboardStyles } from "../../../styles/dashboardStyles";

const REPORT_REASONS = [
  "Nội dung không phù hợp",
  "Spam / quảng cáo",
  "Thông tin sai sự thật",
  "Ngôn ngữ xúc phạm",
  "Khác"
];

const STAR_COLORS = {
  5: "#16a34a",
  4: "#84cc16",
  3: "#f59e0b",
  2: "#f97316",
  1: "#ef4444"
};

const QUICK_REPLIES = [
  { label: "Cảm ơn & cải thiện", text: "Cảm ơn bạn đã dành thời gian đánh giá. Chúng tôi rất trân trọng phản hồi của bạn và sẽ tiếp tục cải thiện dịch vụ." },
  { label: "Xin lỗi & khắc phục", text: "Chúng tôi xin lỗi về trải nghiệm chưa tốt của bạn. Chúng tôi đã ghi nhận và sẽ khắc phục ngay." },
  { label: "Cảm ơn đánh giá 5 sao", text: "Cảm ơn đánh giá 5 sao của bạn! Chúng tôi rất vui khi được phục vụ và mong đón bạn trở lại." },
];

export default function ManagerFeedbacksPage() {
  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Modal state
  const [activeModal, setActiveModal] = useState(null);
  const [selectedFeedbackId, setSelectedFeedbackId] = useState("");
  const [reply, setReply] = useState("");
  const [reportReason, setReportReason] = useState("");

  // Load rooms on mount
  useEffect(() => {
    setLoading(true);
    branchService.getBranches()
      .then((branches) => {
        const branchId = branches?.[0]?.id || "";
        if (!branchId) return;
        return dashboardService.getManagerRoomsByBranch(branchId);
      })
      .then((roomData) => {
        setRooms(roomData || []);
        setRoomId(roomData?.[0]?.id || "");
      })
      .catch((err) => setError(err.message || "Không thể tải phòng"))
      .finally(() => setLoading(false));
  }, []);

  // Load feedbacks when room changes
  useEffect(() => {
    if (!roomId) return;
    dashboardService.getManagerFeedbackByRoom(roomId)
      .then((data) => setFeedbacks(data || []))
      .catch((err) => setError(err.message || "Không thể tải feedback"));
  }, [roomId]);

  // Filter and sort feedbacks
  const filtered = useMemo(() => {
    return feedbacks
      .filter((item) => {
        const matchQuery = !query ||
          item.customerName?.toLowerCase().includes(query.toLowerCase()) ||
          item.content?.toLowerCase().includes(query.toLowerCase());
        const matchRating = ratingFilter === "ALL" || String(item.rating) === ratingFilter;
        return matchQuery && matchRating;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [feedbacks, query, ratingFilter]);

  const visibleFeedbacks = showAll ? filtered : filtered.slice(0, 5);

  // Modal handlers
  const openModal = useCallback((type, feedbackId) => {
    setSelectedFeedbackId(feedbackId);
    setReply("");
    setReportReason("");
    setActiveModal(type);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setSelectedFeedbackId("");
  }, []);

  const submitReply = useCallback(async () => {
    if (!selectedFeedbackId || !reply.trim()) return;
    try {
      await dashboardService.replyManagerFeedback({ feedbackId: selectedFeedbackId, reply });
      setMessage("Đã gửi phản hồi");
      closeModal();
      const data = await dashboardService.getManagerFeedbackByRoom(roomId);
      setFeedbacks(data || []);
    } catch (err) {
      setError(err.message || "Không thể gửi phản hồi");
    }
  }, [selectedFeedbackId, reply, roomId, closeModal]);

  const submitReport = useCallback(async () => {
    if (!selectedFeedbackId || !reportReason.trim()) return;
    try {
      await dashboardService.reportManagerFeedback(selectedFeedbackId, reportReason);
      setMessage("Đã gửi báo cáo feedback");
      closeModal();
    } catch (err) {
      setError(err.message || "Không thể gửi báo cáo");
    }
  }, [selectedFeedbackId, reportReason, closeModal]);

  return (
    <section style={dashboardStyles.gridSection}>
      {/* Header */}
      <div style={dashboardStyles.headerGradient}>
        <div>
          <div style={dashboardStyles.headerSubtitle}>Phản hồi khách hàng</div>
          <div style={dashboardStyles.headerTitle}>Feedbacks & Phản hồi</div>
          <div style={dashboardStyles.headerDescription}>Quản lý và trả lời phản hồi của khách</div>
        </div>
      </div>

      {/* Notifications */}
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Filters */}
      <FilterSection rooms={rooms} roomId={roomId} setRoomId={setRoomId} query={query} setQuery={setQuery} ratingFilter={ratingFilter} setRatingFilter={setRatingFilter} />

      {/* Feedback List */}
      {loading ? (
        <div style={{ ...dashboardStyles.cardContainer, textAlign: "center", color: "#64748b" }}>Đang tải...</div>
      ) : filtered.length === 0 ? (
        <EmptyState title="Chưa có feedback" description="Phản hồi của khách sẽ hiển thị tại đây." />
      ) : (
        <>
          <div style={{ display: "grid", gap: 10 }}>
            {visibleFeedbacks.map((fb) => (
              <FeedbackCard key={fb.id} feedback={fb} onReply={() => openModal("reply", fb.id)} onReport={() => openModal("report", fb.id)} />
            ))}
          </div>
          {filtered.length > 5 && (
            <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white", width: "100%" }} onClick={() => setShowAll(!showAll)}>
              {showAll ? "Thu gọn" : `Xem thêm ${filtered.length - 5} feedback`}
            </button>
          )}
        </>
      )}

      {/* Reply Modal */}
      {activeModal === "reply" && <ReplyModal reply={reply} setReply={setReply} onSubmit={submitReply} onClose={closeModal} />}

      {/* Report Modal */}
      {activeModal === "report" && <ReportModal reason={reportReason} setReason={setReportReason} onSubmit={submitReport} onClose={closeModal} />}
    </section>
  );
}

// Filter section component
function FilterSection({ rooms, roomId, setRoomId, query, setQuery, ratingFilter, setRatingFilter }) {
  return (
    <div style={dashboardStyles.filterContainer}>
      <div style={dashboardStyles.filterRow}>
        <select value={roomId} onChange={(e) => setRoomId(e.target.value)} style={dashboardStyles.formInput}>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.roomNumber} — {room.roomTypeName}
            </option>
          ))}
        </select>
        <input
          placeholder="🔍 Tìm tên khách / nội dung"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: 1, minWidth: 200, ...dashboardStyles.formInput }}
        />
      </div>
      <div style={dashboardStyles.filterRow}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
          <input type="radio" name="rating" value="ALL" checked={ratingFilter === "ALL"} onChange={(e) => setRatingFilter(e.target.value)} />
          Tất cả
        </label>
        {[5, 4, 3, 2, 1].map((r) => (
          <label key={r} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
            <input type="radio" name="rating" value={String(r)} checked={ratingFilter === String(r)} onChange={(e) => setRatingFilter(e.target.value)} />
            {"⭐".repeat(r)}
          </label>
        ))}
      </div>
    </div>
  );
}

// Feedback card component
function FeedbackCard({ feedback, onReply, onReport }) {
  return (
    <article style={dashboardStyles.cardContainer}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{feedback.customerName || "Khách"}</span>
          <span style={{ marginLeft: 10, fontSize: 12, color: "#94a3b8" }}>
            {feedback.createdAt ? new Date(feedback.createdAt).toLocaleDateString("vi-VN") : ""}
          </span>
        </div>
        <div style={{ color: STAR_COLORS[feedback.rating] || "#94a3b8" }}>
          <RatingStars value={feedback.rating} size={15} showValue />
        </div>
      </div>

      <p style={{ margin: 0, color: "#334155", fontSize: 14, lineHeight: 1.6, marginBottom: 12 }}>{feedback.content}</p>

      {feedback.managerReply && (
        <div style={{ padding: 10, borderRadius: 8, background: "#f0f9ff", border: "1px solid #bae6fd", fontSize: 13, marginBottom: 12 }}>
          <span style={{ fontWeight: 700, color: "#0284c7" }}>Phản hồi của manager: </span>
          {feedback.managerReply}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" style={{ fontSize: 13, padding: "6px 14px" }} onClick={onReply}>
          💬 Phản hồi
        </button>
        <button className="btn" style={{ fontSize: 13, padding: "6px 14px", border: "1px solid #fecaca", color: "#b91c1c", background: "white" }} onClick={onReport}>
          🚩 Report
        </button>
      </div>
    </article>
  );
}

// Reply modal component
function ReplyModal({ reply, setReply, onSubmit, onClose }) {
  return (
    <div style={dashboardStyles.modalOverlay}>
      <div style={dashboardStyles.modalCard}>
        <h3 style={{ margin: 0, marginBottom: 16 }}>💬 Phản hồi feedback</h3>

        <div style={dashboardStyles.formField}>
          <label style={dashboardStyles.formLabel}>Chọn mẫu phản hồi nhanh</label>
          <select onChange={(e) => { if (e.target.value) setReply(e.target.value); }} style={dashboardStyles.formInput}>
            <option value="">-- Mẫu phản hồi --</option>
            {QUICK_REPLIES.map((q) => (
              <option key={q.label} value={q.text}>
                {q.label}
              </option>
            ))}
          </select>
        </div>

        <div style={dashboardStyles.formField}>
          <label style={dashboardStyles.formLabel}>Nội dung phản hồi</label>
          <textarea
            placeholder="Nhập nội dung phản hồi..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            style={dashboardStyles.formTextarea}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={onClose}>
            Huỷ
          </button>
          <button className="btn btn-primary" onClick={onSubmit} disabled={!reply.trim()}>
            Gửi phản hồi
          </button>
        </div>
      </div>
    </div>
  );
}

// Report modal component
function ReportModal({ reason, setReason, onSubmit, onClose }) {
  const isCustomReason = !REPORT_REASONS.includes(reason);

  return (
    <div style={dashboardStyles.modalOverlay}>
      <div style={dashboardStyles.modalCard}>
        <h3 style={{ margin: 0, marginBottom: 16 }}>🚩 Báo cáo feedback</h3>

        <div style={dashboardStyles.formField}>
          <label style={dashboardStyles.formLabel}>Chọn lý do báo cáo</label>
          <div style={{ display: "grid", gap: 10 }}>
            {REPORT_REASONS.map((r) => (
              <label key={r} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer", fontSize: 14 }}>
                <input type="radio" name="report-reason" checked={reason === r} onChange={() => setReason(r)} />
                {r}
              </label>
            ))}
          </div>
        </div>

        {isCustomReason || reason === "Khác" ? (
          <textarea
            placeholder="Mô tả thêm (nếu cần)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            style={{ marginTop: 12, ...dashboardStyles.formTextarea }}
          />
        ) : null}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          <button className="btn" style={{ border: "1px solid #e2e8f0", background: "white" }} onClick={onClose}>
            Huỷ
          </button>
          <button className="btn" style={{ border: "1px solid #fecaca", color: "#b91c1c", background: "#fff1f2" }} onClick={onSubmit} disabled={!reason.trim()}>
            Gửi báo cáo
          </button>
        </div>
      </div>
    </div>
  );
}
