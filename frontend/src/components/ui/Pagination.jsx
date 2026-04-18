import React from 'react';
import './Pagination.css';
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <div className="pagination">
      <button className="page-btn" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>‹</button>
      {pages.map(p => (
        <button key={p} className={`page-btn ${p === page ? 'page-btn--active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
      ))}
      <button className="page-btn" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>›</button>
    </div>
  );
};
export default Pagination;
