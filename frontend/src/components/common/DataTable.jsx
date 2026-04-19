export default function DataTable({ columns = [], rows = [], keyField = "id", emptyText = "Khong co du lieu", renderActions }) {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }}>
        <thead style={{ background: "#f8fafc" }}>
          <tr>
            {columns.map((column) => (
              <th key={column.key} style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #e2e8f0", color: "#334155" }}>
                {column.label}
              </th>
            ))}
            {renderActions && <th style={{ textAlign: "right", padding: "12px 14px", borderBottom: "1px solid #e2e8f0", color: "#334155" }}>Hanh dong</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (renderActions ? 1 : 0)} style={{ padding: 16, color: "#64748b", textAlign: "center" }}>{emptyText}</td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row[keyField]}>
              {columns.map((column) => (
                <td key={column.key} style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" }}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
              {renderActions && (
                <td style={{ padding: "12px 14px", borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>
                  {renderActions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
