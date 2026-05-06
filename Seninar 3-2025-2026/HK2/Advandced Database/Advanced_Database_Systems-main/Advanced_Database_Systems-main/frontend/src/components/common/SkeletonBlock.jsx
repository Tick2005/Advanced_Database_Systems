export default function SkeletonBlock({ rows = 4 }) {
  return (
    <div className="card" style={{ padding: 18, display: "grid", gap: 10 }}>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          style={{
            height: 14,
            borderRadius: 999,
            background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
            backgroundSize: "200% 100%",
            animation: "skeleton-shimmer 1.4s linear infinite"
          }}
        />
      ))}
    </div>
  );
}
