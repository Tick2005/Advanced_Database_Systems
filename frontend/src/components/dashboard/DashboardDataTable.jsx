export default function DashboardDataTable({
  title = "",
  columns = [],
  data = [],
  onRowClick = null,
  renderRow = null,
  emptyMessage = "Không có dữ liệu",
  loading = false,
  pagination = null,
  onPaginationChange = null,
  rowsPerPage = 10
}) {
  const startIdx = pagination ? (pagination.page - 1) * rowsPerPage : 0;
  const endIdx = startIdx + rowsPerPage;
  const pageData = pagination ? data.slice(startIdx, endIdx) : data.slice(0, rowsPerPage);

  return (
    <article
      style={{
        background: "white",
        borderRadius: 14,
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        overflow: "hidden"
      }}
    >
      {/* Header */}
      {title && (
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e5e7eb",
            background: "#f9fafb"
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#1f2937" }}>
            {title}
          </h3>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 14
          }}
        >
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    padding: "12px 16px",
                    textAlign: col.align || "left",
                    fontWeight: 600,
                    color: "#6b7280",
                    fontSize: 13
                  }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}
                >
                  Đang tải...
                </td>
              </tr>
            ) : pageData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ padding: "40px", textAlign: "center", color: "#9ca3af" }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pageData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    cursor: onRowClick ? "pointer" : "default",
                    transition: "background 0.15s",
                    background: idx % 2 === 0 ? "white" : "#fafbfc"
                  }}
                  onMouseEnter={(e) => {
                    if (onRowClick) e.currentTarget.style.background = "#f0f9ff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = idx % 2 === 0 ? "white" : "#fafbfc";
                  }}
                >
                  {renderRow ? (
                    renderRow(row, idx)
                  ) : (
                    columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          padding: "14px 16px",
                          textAlign: col.align || "left",
                          color: col.textColor || "#1f2937"
                        }}
                      >
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f9fafb",
            fontSize: 13,
            color: "#6b7280"
          }}
        >
          <span>
            Hiển thị {startIdx + 1}-{Math.min(endIdx, data.length)} trong {data.length}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onPaginationChange?.({ ...pagination, page: Math.max(1, pagination.page - 1) })}
              disabled={pagination.page === 1}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: "white",
                cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                opacity: pagination.page === 1 ? 0.5 : 1
              }}
            >
              ← Trước
            </button>
            <button
              onClick={() => onPaginationChange?.({ ...pagination, page: pagination.page + 1 })}
              disabled={endIdx >= data.length}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: "white",
                cursor: endIdx >= data.length ? "not-allowed" : "pointer",
                opacity: endIdx >= data.length ? 0.5 : 1
              }}
            >
              Sau →
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
