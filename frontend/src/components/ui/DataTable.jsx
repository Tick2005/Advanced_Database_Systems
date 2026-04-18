import React from 'react';
import './DataTable.css';
const DataTable = ({ columns, data, loading, emptyText = 'Không có dữ liệu' }) => (
  <div className="table-wrapper">
    <table className="data-table">
      <thead>
        <tr>{columns.map(c => <th key={c.key}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {loading ? (
          <tr><td colSpan={columns.length} className="table-center"><span className="table-spinner" /></td></tr>
        ) : !data?.length ? (
          <tr><td colSpan={columns.length} className="table-center table-empty">{emptyText}</td></tr>
        ) : data.map((row, i) => (
          <tr key={row.id || i}>
            {columns.map(c => <td key={c.key}>{c.render ? c.render(row[c.key], row) : (row[c.key] ?? '-')}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
export default DataTable;
