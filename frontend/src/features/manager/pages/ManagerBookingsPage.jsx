import { useEffect, useMemo, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import StatusBadge from "../../../components/common/StatusBadge";
import PaginationBar from "../../../components/common/PaginationBar";
import ToastMessage from "../../../components/common/ToastMessage";
import { formatCurrencyVnd } from "../../../services/presenters";

const PAGE_SIZE = 8;

export default function ManagerBookingsPage() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dashboardService.getManagerBookings()
      .then((data) => setRows(data || []))
      .catch((err) => setError(err.message || "Không thể tải booking"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const matchSearch = !search
      || r.customerName?.toLowerCase().includes(search.toLowerCase())
      || r.customerEmail?.toLowerCase().includes(search.toLowerCase())
      || r.roomNumber?.toLowerCase().includes(search.toLowerCase())
      || r.id?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchSearch && matchStatus;
  }), [rows, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  return (
    <section style={{ display: "grid", gap: 14 }}>
      <div>
        <h1 style={{ margin: 0 }}>📋 Booking Chi Nhánh</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Quản lý tất cả đặt phòng tại chi nhánh</p>
      </div>

      <ToastMessage type="error" message={error} onClose={() => setError("")} />

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Tìm theo tên, email, phòng..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: 220, padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
        />
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ padding: "9px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 14 }}
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="HOLD">HOLD</option>
          <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="CHECKED_IN">CHECKED_IN</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: "center", color: "#64748b" }}>Đang tải...</div>
      ) : (
        <>
          <div style={{ display: "grid", gap: 10 }}>
            {paginated.map((row) => (
              <div
                key={row.id}
                className="card"
                style={{ padding: 0, overflow: "hidden", cursor: "pointer", border: selected?.id === row.id ? "2px solid #c9a84c" : "1px solid #e2e8f0" }}
                onClick={() => setSelected(selected?.id === row.id ? null : row)}
              >
                {/* Booking header */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "12px 16px", background: "#f8fafc" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>#{row.id?.slice(0, 10).toUpperCase()}</span>
                    <StatusBadge value={row.status} />
                    <span style={{ fontSize: 13, color: "#64748b" }}>{row.checkInDate} → {row.checkOutDate}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: "#9a7d24", fontSize: 14, whiteSpace: "nowrap" }}>
                    {formatCurrencyVnd(row.totalPrice || 0)}
                  </span>
                </div>

                {/* Expanded detail */}
                {selected?.id === row.id && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 1, background: "#e2e8f0" }}>
                    {/* Booking info */}
                    <div style={{ padding: "14px 18px", background: "white" }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                        📋 Thông tin đặt phòng
                      </div>
                      <InfoRow label="Mã booking" value={row.id} mono />
                      <InfoRow label="Phòng" value={`Phòng ${row.roomNumber || row.roomId?.slice(0, 8) || "?"}`} />
                      <InfoRow label="Loại phòng" value={row.roomTypeName || "—"} />
                      <InfoRow label="Check-in" value={row.checkInDate || "—"} />
                      <InfoRow label="Check-out" value={row.checkOutDate || "—"} />
                      <InfoRow label="Tổng tiền" value={formatCurrencyVnd(row.totalPrice || 0)} bold />
                      <InfoRow label="Thanh toán" value={row.paymentStatus || "—"} />
                      {row.notes && <InfoRow label="Ghi chú" value={row.notes} />}
                    </div>
                    {/* Customer info */}
                    <div style={{ padding: "14px 18px", background: "white" }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
                        👤 Thông tin khách hàng
                      </div>
                      <InfoRow label="Họ tên" value={row.customerName || row.guestName || "—"} bold />
                      <InfoRow label="Email" value={row.customerEmail || "—"} />
                      <InfoRow label="Số điện thoại" value={row.customerPhone || row.guestPhone || "—"} />
                      <InfoRow label="Mã khách" value={row.customerId?.slice(0, 12) || "Khách vãng lai"} mono />
                      {row.specialRequests && <InfoRow label="Yêu cầu đặc biệt" value={row.specialRequests} />}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {paginated.length === 0 && (
              <div className="card" style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
                Không tìm thấy booking nào.
              </div>
            )}
          </div>
          <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </section>
  );
}

function InfoRow({ label, value, mono, bold }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: "#64748b", minWidth: 110, flexShrink: 0 }}>{label}:</span>
      <span style={{ fontWeight: bold ? 700 : 400, fontFamily: mono ? "monospace" : undefined, wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}
