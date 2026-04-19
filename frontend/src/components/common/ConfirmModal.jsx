export default function ConfirmModal({ open, title, description, onConfirm, onCancel, confirmText = "Xac nhan", cancelText = "Huy" }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 80 }}>
      <div className="card card-elevated modal-card" style={{ width: "min(460px, 100%)" }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        <p style={{ margin: 0, color: "#475569" }}>{description}</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} onClick={onCancel}>{cancelText}</button>
          <button className="btn btn-primary" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
