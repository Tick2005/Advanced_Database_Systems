// commit: fix(data-table): sửa encoding tiếng Việt trong default props
import EmptyState from "./EmptyState";

export default function DataTable({ columns = [], rows = [], keyField = "id", emptyText = "Không có dữ liệu", renderActions, ariaLabel = "Bảng dữ liệu" }) {
  return (
    <div className="card" style={{ overflowX: "auto", borderRadius: 18, boxShadow: "0 8px 28px rgba(15, 23, 42, 0.06)" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }} aria-label={ariaLabel}>
        <caption style={{ position: "absolute", left: -10000, top: "auto", width: 1, height: 1, overflow: "hidden" }}>
          {ariaLabel}
        </caption>
        <thead style={{ background: "#f8fafc", position: "sticky", top: 0, zIndex: 1 }}>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" style={{ textAlign: "left", padding: "14px 16px", borderBottom: "1px solid #e2e8f0", color: "#334155", fontSize: 13, letterSpacing: "0.02em" }}>
                {column.label}
              </th>
            ))}
            {renderActions && <th style={{ textAlign: "right", padding: "14px 16px", borderBottom: "1px solid #e2e8f0", color: "#334155", fontSize: 13, letterSpacing: "0.02em" }}>Hanh dong</th>}
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
            <tr key={row[keyField]} style={{ transition: "background 0.15s ease" }} onMouseEnter={(event) => { event.currentTarget.style.background = "#f8fafc"; }} onMouseLeave={(event) => { event.currentTarget.style.background = "transparent"; }}>
              {columns.map((column) => (
                <td key={column.key} style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top", fontSize: 13 }}>
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
              {renderActions && (
                <td style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9", textAlign: "right" }}>
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
