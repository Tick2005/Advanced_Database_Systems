export default function RatingStars({
  value = 0,
  max = 5,
  size = 14,
  showValue = true,
  valueSuffix = "/5",
  count = null,
  emptyColor = "#e2e8f0",
  fillColor = "#fbbf24",
  textColor = "#64748b",
  label
}) {
  const safeValue = Math.max(0, Math.min(Number(value) || 0, max));
  const percent = max > 0 ? (safeValue / max) * 100 : 0;
  const displayValue = Number.isInteger(safeValue) ? safeValue.toFixed(0) : safeValue.toFixed(1);

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }} aria-label={label || `Đánh giá ${displayValue} trên ${max}`}>
      <span style={{ position: "relative", display: "inline-flex", fontSize: size, lineHeight: 1 }}>
        <span aria-hidden="true" style={{ color: emptyColor }}>★★★★★</span>
        <span aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", width: `${percent}%`, color: fillColor, whiteSpace: "nowrap" }}>★★★★★</span>
      </span>
      {showValue && (
        <span style={{ fontSize: 12, color: textColor, fontWeight: 700 }}>
          {displayValue}{valueSuffix}{count != null ? ` · ${count} đánh giá` : ""}
        </span>
      )}
    </div>
  );
}