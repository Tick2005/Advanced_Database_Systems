import { useEffect, useMemo, useCallback, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import { dashboardStyles } from "../../../styles/dashboardStyles";
import StatusBadge from "../../../components/common/StatusBadge";
import PaginationBar from "../../../components/common/PaginationBar";
import ToastMessage from "../../../components/common/ToastMessage";
import { formatCurrencyVnd } from "../../../services/presenters";

const PAGE_SIZE = 8;

const BOOKING_STATUSES = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "HOLD", label: "HOLD" },
  { value: "PENDING_PAYMENT", label: "PENDING_PAYMENT" },
  { value: "CONFIRMED", label: "CONFIRMED" },
  { value: "CHECKED_IN", label: "CHECKED_IN" },
  { value: "COMPLETED", label: "COMPLETED" },
  { value: "CANCELLED", label: "CANCELLED" }
];

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

  const handleSearch = useCallback((value) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleStatusChange = useCallback((value) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleSelectBooking = useCallback((booking) => {
    setSelected(selected?.id === booking.id ? null : booking);
  }, [selected]);

  return (
    <section style={dashboardStyles.gridSection}>
      <PageHeader />
      <ToastMessage type="error" message={error} onClose={() => setError("")} />
      <FilterSection search={search} onSearch={handleSearch} statusFilter={statusFilter} onStatusChange={handleStatusChange} />
      
      {loading ? (
        <div style={{ ...dashboardStyles.summaryCard, textAlign: "center", color: "#64748b" }}>
          Đang tải...
        </div>
      ) : (
        <>
          <BookingsList bookings={paginated} selected={selected} onSelect={handleSelectBooking} />
          <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </section>
  );
}

// Subcomponent: Page Header
function PageHeader() {
  return (
    <div style={dashboardStyles.headerGradient}>
      <div>
        <div style={dashboardStyles.headerSubtitle}>Quản lý booking</div>
        <div style={dashboardStyles.headerTitle}>Booking Chi Nhánh</div>
        <div style={dashboardStyles.headerDescription}>Tất cả đặt phòng được quản lý từ đây</div>
      </div>
    </div>
  );
}

// Subcomponent: Filter Section
function FilterSection({ search, onSearch, statusFilter, onStatusChange }) {
  return (
    <div style={dashboardStyles.summaryCard}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          placeholder="🔍 Tìm theo tên, email, phòng..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{ flex: 1, minWidth: 220, ...dashboardStyles.formInput }}
        />
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          style={dashboardStyles.formInput}
        >
          {BOOKING_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// Subcomponent: Bookings List
function BookingsList({ bookings, selected, onSelect }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {bookings.map((row) => (
        <BookingCard
          key={row.id}
          booking={row}
          isSelected={selected?.id === row.id}
          onSelect={onSelect}
        />
      ))}
      {bookings.length === 0 && (
        <div style={{ ...dashboardStyles.summaryCard, textAlign: "center", color: "#94a3b8" }}>
          Không tìm thấy booking nào.
        </div>
      )}
    </div>
  );
}

// Subcomponent: Booking Card
function BookingCard({ booking, isSelected, onSelect }) {
  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        cursor: "pointer",
        border: isSelected ? "2px solid #c9a84c" : "1px solid #e2e8f0"
      }}
      onClick={() => onSelect(booking)}
    >
      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, padding: "12px 16px", background: "#f8fafc" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>#{booking.id?.slice(0, 10).toUpperCase()}</span>
          <StatusBadge value={booking.status} />
          <span style={{ fontSize: 13, color: "#64748b" }}>{booking.checkInDate} → {booking.checkOutDate}</span>
        </div>
        <span style={{ fontWeight: 800, color: "#9a7d24", fontSize: 14, whiteSpace: "nowrap" }}>
          {formatCurrencyVnd(booking.totalPrice || 0)}
        </span>
      </div>

      {/* Details */}
      {isSelected && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 1, background: "#e2e8f0" }}>
          <BookingInfoSection booking={booking} />
          <CustomerInfoSection booking={booking} />
        </div>
      )}
    </div>
  );
}

// Subcomponent: Booking Info Section
function BookingInfoSection({ booking }) {
  return (
    <div style={{ padding: "14px 18px", background: "white" }}>
      <div style={dashboardStyles.headerSubtitle}>📋 Thông tin đặt phòng</div>
      <InfoRow label="Mã booking" value={booking.id} mono />
      <InfoRow label="Phòng" value={`Phòng ${booking.roomNumber || booking.roomId?.slice(0, 8) || "?"}`} />
      <InfoRow label="Loại phòng" value={booking.roomTypeName || "—"} />
      <InfoRow label="Check-in" value={booking.checkInDate || "—"} />
      <InfoRow label="Check-out" value={booking.checkOutDate || "—"} />
      <InfoRow label="Tổng tiền" value={formatCurrencyVnd(booking.totalPrice || 0)} bold />
      <InfoRow label="Thanh toán" value={booking.paymentStatus || "—"} />
      {booking.notes && <InfoRow label="Ghi chú" value={booking.notes} />}
    </div>
  );
}

// Subcomponent: Customer Info Section
function CustomerInfoSection({ booking }) {
  return (
    <div style={{ padding: "14px 18px", background: "white" }}>
      <div style={dashboardStyles.headerSubtitle}>👤 Thông tin khách hàng</div>
      <InfoRow label="Họ tên" value={booking.customerName || booking.guestName || "—"} bold />
      <InfoRow label="Email" value={booking.customerEmail || "—"} />
      <InfoRow label="Số điện thoại" value={booking.customerPhone || booking.guestPhone || "—"} />
      <InfoRow label="Mã khách" value={booking.customerId?.slice(0, 12) || "Khách vãng lai"} mono />
      {booking.specialRequests && <InfoRow label="Yêu cầu đặc biệt" value={booking.specialRequests} />}
    </div>
  );
}

// Subcomponent: Info Row
function InfoRow({ label, value, mono, bold }) {
  return (
    <div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13 }}>
      <span style={{ color: "#64748b", minWidth: 110, flexShrink: 0 }}>{label}:</span>
      <span style={{ fontWeight: bold ? 700 : 400, fontFamily: mono ? "monospace" : undefined, wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}
