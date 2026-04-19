export default function PaginationBar({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let index = 1; index <= totalPages; index += 1) {
    pages.push(index);
  }

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Truoc
      </button>
      {pages.map((item) => (
        <button
          key={item}
          className="btn"
          style={{ border: "1px solid #cbd5e1", background: item === page ? "#e8f0f8" : "white" }}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
      <button className="btn" style={{ border: "1px solid #cbd5e1", background: "white" }} disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Sau
      </button>
    </div>
  );
}
