const COLOR_BY_STATUS = {
  AVAILABLE: { bg: "#ecfdf5", text: "#047857" },
  HELD: { bg: "#fef3c7", text: "#92400e" },
  OCCUPIED: { bg: "#dbeafe", text: "#1d4ed8" },
  MAINTENANCE: { bg: "#fee2e2", text: "#b91c1c" },
  CONFIRMED: { bg: "#dcfce7", text: "#166534" },
  PENDING_PAYMENT: { bg: "#fef3c7", text: "#92400e" },
  CHECKED_IN: { bg: "#dbeafe", text: "#1d4ed8" },
  CHECKED_OUT: { bg: "#e2e8f0", text: "#334155" },
  CANCELLED: { bg: "#fee2e2", text: "#b91c1c" },
  REJECTED: { bg: "#fee2e2", text: "#b91c1c" },
  APPROVED: { bg: "#dcfce7", text: "#166534" },
  PENDING: { bg: "#fef3c7", text: "#92400e" }
};

export default function StatusBadge({ value }) {
  const key = String(value || "UNKNOWN").toUpperCase();
  const color = COLOR_BY_STATUS[key] || { bg: "#f1f5f9", text: "#334155" };
  return (
    <span
      style={{
        display: "inline-block",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        padding: "3px 10px",
        background: color.bg,
        color: color.text
      }}
    >
      {value || "UNKNOWN"}
    </span>
  );
}
