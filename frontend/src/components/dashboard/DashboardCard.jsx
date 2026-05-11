export default function DashboardCard({
  icon = "📊",
  label = "Metric",
  value = "0",
  subtext = "",
  color = "#3b82f6",
  trend = null,
  onClick = null,
  style = {}
}) {
  const trendIsPositive = trend && trend.value > 0;
  const trendIcon = trendIsPositive ? "📈" : trend && trend.value < 0 ? "📉" : "→";
  
  return (
    <article
      onClick={onClick}
      style={{
        background: "white",
        borderRadius: 14,
        padding: "20px 18px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.2s ease",
        cursor: onClick ? "pointer" : "default",
        ...style
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
          <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500, marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: color, lineHeight: 1 }}>
            {value}
          </div>
        </div>
        {trend && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 8px",
              background: trendIsPositive ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: trendIsPositive ? "#059669" : "#dc2626"
            }}
          >
            <span>{trendIcon}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      {subtext && (
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 12 }}>
          {subtext}
        </div>
      )}
    </article>
  );
}
