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
  const [selectedFeedbackId, setSelectedFeedbackId] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [openReplyModal, setOpenReplyModal] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("ALL");

  useEffect(() => {
    branchService.getBranches().then(async (branches) => {
      const branchId = branches?.[0]?.id || "";
      if (!branchId) return;
      const roomData = await dashboardService.getManagerRoomsByBranch(branchId);
      setRooms(roomData || []);
      setRoomId(roomData?.[0]?.id || "");
    }).catch((err) => setError(err.message || "Khong the tai room"));
  }, []);

  useEffect(() => {
    if (!roomId) return;
    dashboardService.getManagerFeedbackByRoom(roomId).then((data) => {
      setFeedbacks(data || []);
    }).catch((err) => setError(err.message || "Khong the tai feedback"));
  }, [roomId]);

  const filtered = feedbacks.filter((item) => {
    const matchQuery = !query
      || item.customerName?.toLowerCase().includes(query.toLowerCase())
      || item.content?.toLowerCase().includes(query.toLowerCase());
    const matchRating = ratingFilter === "ALL" || String(item.rating) === ratingFilter;
    return matchQuery && matchRating;
  }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const visibleFeedbacks = showAll ? filtered : filtered.slice(0, 3);

  const submitReply = async () => {
    if (!selectedFeedbackId || !reply.trim()) return;
    try {
      await dashboardService.replyManagerFeedback({ feedbackId: selectedFeedbackId, reply });
      setMessage("Da gui phan hoi");
      setReply("");
      setOpenReplyModal(false);
      const data = await dashboardService.getManagerFeedbackByRoom(roomId);
      setFeedbacks(data || []);
    } catch (err) {
      setError(err.message || "Khong the gui phan hoi");
    }
  };

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Feedback khach hang</h1>
      <ToastMessage type="success" message={message} onClose={() => setMessage("")} />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      <select value={roomId} onChange={(event) => setRoomId(event.target.value)}>
        {rooms.map((room) => (
          <option key={room.id} value={room.id}>{room.roomNumber} - {room.roomTypeName}</option>
        ))}
      </select>

      <div className="table-toolbar">
        <input placeholder="Tim theo ten khach / noi dung" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>
          <option value="ALL">Tat ca danh gia</option>
          <option value="5">5 sao</option>
          <option value="4">4 sao</option>
          <option value="3">3 sao</option>
          <option value="2">2 sao</option>
          <option value="1">1 sao</option>
        </select>
      </div>

      {filtered.length === 0 && <EmptyState title="Chua co feedback" description="Khong co ket qua voi bo loc hien tai" />}
      {visibleFeedbacks.map((item) => (
        <article key={item.id} className="card" style={{ padding: 14, display: "grid", gap: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr auto", gap: 10, alignItems: "start" }}>
            <div style={{ display: "grid", gap: 4 }}>
              <strong>⭐ {item.rating}/5</strong>
              <small style={{ color: "#64748b" }}>{item.customerName || "Khach hang"}</small>
            </div>
            <div style={{ color: "#334155" }}>{item.content}</div>
            <button
              className="btn"
              style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 10px" }}
              onClick={() => {
                setSelectedFeedbackId(item.id);
                setReply(item.managerReply || "");
                setOpenReplyModal(true);
              }}
            >
              Phản hồi
            </button>
          </div>
          {item.managerReply && <small style={{ color: "#475569" }}>Phan hoi cu: {item.managerReply}</small>}
        </article>
      ))}

      {filtered.length > 3 && (
        <button
          type="button"
          className="btn"
          style={{ width: "fit-content", border: "1px solid #cbd5e1", background: "white" }}
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Thu gọn" : "View all"}
        </button>
      )}

      {openReplyModal && (
        <div className="modal-overlay">
          <div className="card modal-card" style={{ width: "min(640px,100%)" }}>
            <h3 style={{ margin: 0 }}>Phản hồi khách hàng</h3>
            <textarea value={reply} rows={4} placeholder="Noi dung phan hoi" onChange={(event) => setReply(event.target.value)} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={() => setOpenReplyModal(false)}>Đóng</button>
              <button className="btn btn-gold" disabled={!selectedFeedbackId || !reply.trim()} onClick={submitReply}>Gửi phản hồi</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
