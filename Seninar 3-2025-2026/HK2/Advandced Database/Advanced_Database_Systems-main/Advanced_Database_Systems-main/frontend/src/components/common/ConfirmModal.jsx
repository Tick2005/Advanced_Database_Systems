// commit: fix(confirm-modal): sửa encoding tiếng Việt trong default props
export default function ConfirmModal({ open, title, description, onConfirm, onCancel, confirmText = "Xác nhận", cancelText = "Huỷ" }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 80 }}>
      <div className="card card-elevated modal-card" style={{ width: "min(460px, 100%)" }}>
        <div style={{ display: "grid", gap: 6 }}>
          <div className="pill pill-soft" style={{ width: "fit-content" }}>Xác nhận thao tác</div>
          <h3 style={{ margin: 0, fontSize: 22 }}>{title}</h3>
        </div>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>{description}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
          <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={onCancel}>{cancelText}</button>
          <button className="btn btn-primary" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
