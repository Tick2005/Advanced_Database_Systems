export default function DashboardFilters({
  filters = [],
  activeFilters = {},
  onFilterChange = null,
  onSearch = null,
  searchPlaceholder = "Tìm kiếm..."
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        padding: "14px 0"
      }}
    >
      {/* Search Input */}
      {onSearch && (
        <input
          type="text"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearch(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #d1d5db",
            fontSize: 13,
            minWidth: 200,
            background: "white"
          }}
        />
      )}

      {/* Filter Pills */}
      {filters.map((filter) => {
        const isActive = activeFilters[filter.key];
        return (
          <div key={filter.key}>
            {filter.type === "select" ? (
              <select
                value={activeFilters[filter.key] || ""}
                onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: `1px solid ${isActive ? "#3b82f6" : "#d1d5db"}`,
                  fontSize: 13,
                  background: isActive ? "#eff6ff" : "white",
                  color: "#1f2937",
                  cursor: "pointer"
                }}
              >
                <option value="">{filter.label}</option>
                {filter.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => onFilterChange?.(filter.key, !isActive)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${isActive ? "#3b82f6" : "#d1d5db"}`,
                  background: isActive ? "#3b82f6" : "white",
                  color: isActive ? "white" : "#1f2937",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s"
                }}
              >
                {filter.label} {isActive ? "✓" : ""}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
