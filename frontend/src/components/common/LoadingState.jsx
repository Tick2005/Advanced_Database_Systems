export default function LoadingState({ text = "Dang tai..." }) {
  return (
    <div className="container page-shell">
      <div className="card card-elevated" style={{ padding: 24, display: "grid", gap: 12 }}>
        <div className="pill pill-soft" style={{ width: "fit-content" }}>Đang xử lý</div>
        <div>{text}</div>
      </div>
    </div>
  );
}
