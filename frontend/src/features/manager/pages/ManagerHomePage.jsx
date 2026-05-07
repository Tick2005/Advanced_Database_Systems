import { useEffect, useMemo, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import { branchService } from "../../branches/branchService";
import { PATHS } from "../../../routes/pathConstants";
import { dashboardStyles } from "../../../styles/dashboardStyles";
import SkeletonBlock from "../../../components/common/SkeletonBlock";
import { RevenueChart, RoomStatusGroupBarChart, BookingStatusChart, RatingDistributionChart } from "../../../components/common/ChartWidgets";
import EmptyState from "../../../components/common/EmptyState";
import ErrorState from "../../../components/common/ErrorState";
import StatusBadge from "../../../components/common/StatusBadge";
import { formatCurrencyVnd } from "../../../services/presenters";

// Constants
const KPI_CARDS = [
  { icon: "🏨", label: "Tổng số phòng", key: "rooms", color: "#3b82f6" },
  { icon: "✅", label: "Phòng trống", key: "availableRooms", color: "#10b981" },
  { icon: "📋", label: "Booking đang mở", key: "openBookings", color: "#f59e0b" },
  { icon: "💰", label: "Pricing pending", key: "pendingPricing", color: "#8b5cf6" },
  { icon: "⭐", label: "Điểm rating TB", key: "averageRating", color: "#d97706" }
];

const QUICK_LINKS = [
  { to: PATHS.MANAGER_ROOMS, icon: "🏨", label: "Quản lý phòng", variant: "primary" },
  { to: PATHS.MANAGER_BOOKINGS, icon: "📋", label: "Xem tất cả booking", variant: "secondary" },
  { to: PATHS.MANAGER_PRICING_REQUESTS, icon: "💰", label: "Pricing requests", variant: "gold" },
  { to: PATHS.MANAGER_STAFF, icon: "👥", label: "Staff", variant: "secondary" },
  { to: PATHS.MANAGER_FEEDBACKS, icon: "💬", label: "Feedback khách", variant: "secondary" }
];

export default function ManagerHomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [branch, setBranch] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        setError("");
        const branchData = await branchService.getBranches();
        const activeBranch = branchData?.[0] || null;
        setBranch(activeBranch);
        const activeBranchId = activeBranch?.id || "";
        const [roomData, bookingData, requestData] = await Promise.all([
          activeBranchId ? dashboardService.getManagerRoomsByBranch(activeBranchId) : Promise.resolve([]),
          dashboardService.getManagerBookings(),
          dashboardService.getManagerPricingRequests()
        ]);
        setRooms(roomData || []);
        setBookings(bookingData || []);
        setRequests(requestData || []);
      } catch (err) {
        setError(err.message || "Không thể tải manager dashboard");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const summary = useMemo(() => ({
    rooms: rooms.length,
    openBookings: bookings.filter((b) => ["HOLD", "PENDING_PAYMENT", "CONFIRMED", "CHECKED_IN"].includes(b.status)).length,
    pendingPricing: requests.filter((r) => r.status === "PENDING").length,
    availableRooms: rooms.filter((r) => r.status === "AVAILABLE").length,
    averageRating: rooms.length > 0 ? (rooms.reduce((sum, room) => sum + Number(room.averageRating || 0), 0) / rooms.length).toFixed(1) : 0
  }), [rooms, bookings, requests]);

  const bookingByStatus = useMemo(() => {
    const map = new Map();
    bookings.forEach((b) => map.set(b.status, (map.get(b.status) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  const revenueTrend = useMemo(() => {
    const buckets = new Map();
    bookings.forEach((item) => {
      const sourceDate = item.checkInDate || item.createdAt || item.updatedAt;
      const parsed = sourceDate ? new Date(sourceDate) : null;
      if (!parsed || Number.isNaN(parsed.getTime())) return;
      const key = `${parsed.getMonth() + 1}/${parsed.getFullYear()}`;
      buckets.set(key, (buckets.get(key) || 0) + Number(item.totalPrice || 0));
    });
    return Array.from(buckets.entries()).slice(0, 6).map(([month, revenue]) => ({ month, revenue }));
  }, [bookings]);

  const recentBookings = useMemo(() => bookings.slice(0, 5), [bookings]);

  if (loading) return <SkeletonBlock rows={6} />;
  if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <section style={dashboardStyles.gridSection}>
      <BranchHeader branch={branch} />
      <KPISection summary={summary} />
      <QuickLinksSection />
      <ChartSection data={{ revenueTrend, rooms, bookingByStatus }} />
      <RecentBookingsSection bookings={recentBookings} />
    </section>
  );
}

// Subcomponent: Branch Header
function BranchHeader({ branch }) {
  return (
    <div style={{
      ...dashboardStyles.headerGradient,
      display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8
    }}>
      <div>
        <div style={dashboardStyles.headerSubtitle}>Chi nhánh quản lý</div>
        <div style={dashboardStyles.headerTitle}>{branch?.name || "Chưa xác định"}</div>
        {branch && (
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>
            📍 {branch.address}, {branch.city} · 📞 {branch.phone || "Chưa có SĐT"}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right", fontSize: 13, opacity: 0.8 }}>
        {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </div>
    </div>
  );
}

// Subcomponent: KPI Cards Section
function KPISection({ summary }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
      {KPI_CARDS.map((card) => (
        <SummaryCard
          key={card.key}
          icon={card.icon}
          label={card.label}
          value={summary[card.key]}
          color={card.color}
        />
      ))}
    </div>
  );
}

// Subcomponent: Quick Links
function QuickLinksSection() {
  return (
    <article style={{ ...dashboardStyles.summaryCard, display: "flex", flexWrap: "wrap", gap: 10 }}>
      {QUICK_LINKS.map((link) => (
        <Link
          key={link.to}
          className={`btn ${link.variant === "primary" ? "btn-primary" : link.variant === "gold" ? "btn-gold" : ""}`}
          style={link.variant === "secondary" ? { border: "1px solid #cbd5e1", background: "white" } : {}}
          to={link.to}
        >
          {link.icon} {link.label}
        </Link>
      ))}
    </article>
  );
}

// Subcomponent: Charts Section
function ChartSection({ data }) {
  return (
    <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))" }}>
      <RevenueChart data={data.revenueTrend.length > 0 ? data.revenueTrend : undefined} />
      <RoomStatusGroupBarChart rooms={data.rooms} />
      <BookingStatusChart data={data.bookingByStatus} />
      <RatingDistributionChart rooms={data.rooms} />
    </div>
  );
}

// Subcomponent: Recent Bookings
function RecentBookingsSection({ bookings }) {
  return (
    <article style={dashboardStyles.summaryCard}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <h3 style={dashboardStyles.headerTitle}>📅 Tình trạng booking hôm nay (Top 5)</h3>
        <Link className="btn btn-primary" style={{ fontSize: 13, padding: "6px 14px" }} to={PATHS.MANAGER_BOOKINGS}>
          Xem chi tiết →
        </Link>
      </div>
      {bookings.length === 0 ? (
        <EmptyState title="Chưa có booking" description="Booking sẽ hiển thị tại đây khi có khách đặt phòng." />
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {bookings.map((item) => (
            <BookingRowItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </article>
  );
}

// Subcomponent: KPI Card
function SummaryCard({ icon, label, value, color }) {
  return (
    <article style={{ ...dashboardStyles.summaryCard, borderLeft: `4px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={dashboardStyles.headerSubtitle}>{label}</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{value}</div>
        </div>
        <span style={{ fontSize: 26 }}>{icon}</span>
      </div>
    </article>
  );
}

// Subcomponent: Booking Row Item
function BookingRowItem({ item }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
      ...dashboardStyles.listItem
    }}>
      <div style={{ display: "grid", gap: 2 }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>
          {item.customerName || item.guestName || "Khách"} · Phòng {item.roomNumber || item.roomId?.slice(0, 6) || "?"}
        </span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{item.checkInDate} → {item.checkOutDate}</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontWeight: 700, color: "#9a7d24", fontSize: 13 }}>{formatCurrencyVnd(item.totalPrice || 0)}</span>
        <StatusBadge value={item.status} />
      </div>
    </div>
  );
}
