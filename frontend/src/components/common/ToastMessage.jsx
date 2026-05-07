export default function ToastMessage({ type = "success", message = "", onClose }) {
  if (!message) return null;

  const palette = type === "error"
    ? { bg: "rgba(185,28,28,0.08)", text: "#991b1b", border: "rgba(185,28,28,0.16)" }
    : { bg: "rgba(22,163,74,0.08)", text: "#14532d", border: "rgba(22,163,74,0.16)" };

  return (
    <div className="card" style={{ background: palette.bg, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 14, padding: "10px 12px", display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
      <span>{message}</span>
      {onClose && (
        <button className="btn" style={{ padding: "4px 10px", border: "1px solid #cbd5e1" }} onClick={onClose}>Đóng</button>
      )}
    </div>
  );
}
