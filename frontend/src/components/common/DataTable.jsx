import EmptyState from "./EmptyState";

export default function DataTable({ columns = [], rows = [], keyField = "id", emptyText = "Khong co du lieu", renderActions, ariaLabel = "Bang du lieu" }) {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 780 }} aria-label={ariaLabel}>
        <caption style={{ position: "absolute", left: -10000, top: "auto", width: 1, height: 1, overflow: "hidden" }}>
          {ariaLabel}
        </caption>
        <thead style={{ background: "#f8fafc" }}>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid #e2e8f0", color: "#334155" }}>
                {column.label}
              </th>
            ))}
            {renderActions && <th style={{ textAlign: "right", padding: "12px 14px", borderBottom: "1px solid #e2e8f0", color: "#334155" }}>Hanh dong</th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (renderActions ? 1 : 0)} style={{ padding: 16 }}>
                <EmptyState title={emptyText} description="Thu doi bo loc hoac thu lai sau." />
              </td>
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
