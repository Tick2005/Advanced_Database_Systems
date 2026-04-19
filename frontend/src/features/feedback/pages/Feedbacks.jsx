import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { feedbackService } from "../feedbackService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await feedbackService.getMyFeedbacks();
      setFeedbacks(data || []);
    } catch (err) {
      setError(err.message || "Khong the tai feedbacks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingState text="Dang tai feedbacks..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      <h1>Danh gia cua toi</h1>
      <div style={{ marginBottom: 12 }}>
        <Link className="btn btn-gold" to={PATHS.CUSTOMER_FEEDBACK_CREATE}>Viet danh gia moi</Link>
      </div>

      {feedbacks.length === 0 && (
        <div className="card" style={{ padding: 16 }}>Ban chua co danh gia nao.</div>
      )}

      <div style={{ display: "grid", gap: 12 }}>
        {feedbacks.map((item) => (
          <article className="card" key={item.id} style={{ padding: 14 }}>
            <div>⭐ {item.rating}/5 · Room {item.roomId}</div>
            <div>{item.content}</div>
            {item.managerReply && (
              <div style={{ marginTop: 8, padding: 8, background: "#f8fafc", borderRadius: 8 }}>
                Phan hoi tu quan ly: {item.managerReply}
              </div>
            )}
            <small style={{ color: "#64748b" }}>{item.createdAt}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
