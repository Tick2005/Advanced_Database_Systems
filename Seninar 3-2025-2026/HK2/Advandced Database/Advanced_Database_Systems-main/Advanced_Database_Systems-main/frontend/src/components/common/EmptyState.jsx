// commit: fix(empty-state): sửa encoding tiếng Việt
export default function EmptyState({ title = "Không có dữ liệu", description = "Hãy thử đổi bộ lọc hoặc quay lại sau.", action = null }) {
  return (
    <div className="card card-elevated" style={{ padding: 22, display: "grid", gap: 10, textAlign: "center" }}>
      <div className="feature-icon" style={{ margin: "0 auto" }}>○</div>
      <strong>{title}</strong>
      <span style={{ color: "#64748b" }}>{description}</span>
      {action}
    </div>
  );
}
