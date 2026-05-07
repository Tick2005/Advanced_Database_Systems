export default function ErrorState({ message, onRetry }) {
  return (
    <div className="container page-shell" role="alert" aria-live="assertive">
      <div className="card card-elevated" style={{ padding: 24, borderColor: "rgba(185, 28, 28, 0.18)", display: "grid", gap: 12 }}>
        <div className="pill" style={{ width: "fit-content", background: "rgba(185,28,28,0.08)", color: "#991b1b" }}>Có lỗi xảy ra</div>
        <div style={{ color: "#b91c1c" }}>{message || "Da co loi xay ra"}</div>
        {onRetry && (
          <button className="btn btn-primary" onClick={onRetry} aria-label="Thu lai tai du lieu">Thu lai</button>
        )}
      </div>
    </div>
  );
}
