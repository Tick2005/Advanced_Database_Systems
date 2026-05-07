export default function EmptyState({ title = "Khong co du lieu", description = "Hay thu doi bo loc hoac quay lai sau.", action = null }) {
  return (
    <div className="card card-elevated" style={{ padding: 22, display: "grid", gap: 10, textAlign: "center" }}>
      <div className="feature-icon" style={{ margin: "0 auto" }}>○</div>
      <strong>{title}</strong>
      <span style={{ color: "#64748b" }}>{description}</span>
      {action}
    </div>
  );
}
