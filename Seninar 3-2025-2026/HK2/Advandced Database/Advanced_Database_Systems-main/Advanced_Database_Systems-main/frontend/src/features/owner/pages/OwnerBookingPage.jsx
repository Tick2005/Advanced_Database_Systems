import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import { formatCurrencyVnd } from "../../../services/presenters";
import SkeletonBlock from "../../../components/common/SkeletonBlock";
import ErrorState from "../../../components/common/ErrorState";
import StatusBadge from "../../../components/common/StatusBadge";
import { PATHS } from "../../../routes/pathConstants";

function StatCard({ icon, label, value }) {
  return (
    <div className="card" style={{ padding: 16, display: "grid", gap: 6 }}>
      <div style={{ fontSize: 26 }}>{icon}</div>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#0d2238" }}>{value}</div>
    </div>
  );
}

function RankList({ title, items, valueLabel }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700 }}>{title}</h3>
      {items.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: 13 }}>Chưa có dữ liệu</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#c9a84c", minWidth: 18 }}>#{i + 1}</span>
                <span style={{ fontSize: 13, color: "#0d2238" }}>{item.name || "—"}</span>
              </div>
              <span style={{ fontWeight: 700, color: "#0d2238", background: "#f1f5f9", padding: "3px 10px", borderRadius: 999, fontSize: 12 }}>{item.count} {valueLabel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OwnerBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    setLoading(true);
    setError("");
    dashboardService.getOwnerBookings()
      .then((data) => setBookings(data || []))
      .catch((err) => setError(err?.message || "Không thể tải booking data"))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((s, b) => s + Number(b.totalPrice || 0), 0);
    const branchGroups = {}, roomGroups = {};
    bookings.forEach((b) => {
      const bn = b.branchName || "Unknown";
      const rn = b.roomTypeName || b.roomNumber || "Unknown";
      branchGroups[bn] = (branchGroups[bn] || 0) + 1;
      roomGroups[rn]   = (roomGroups[rn]   || 0) + 1;
    });
    return {
      totalBookings: bookings.length,
      totalRevenue,
      paid: bookings.filter((b) => b.paymentStatus === "PAID").length,
      active: bookings.filter((b) => ["CONFIRMED","CHECKED_IN","HOLD"].includes(b.status)).length,
      topBranches: Object.entries(branchGroups).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      topRooms:    Object.entries(roomGroups).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    };
  }, [bookings]);

  const STATUSES = ["ALL", "HOLD", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"];
  const filtered = useMemo(() => statusFilter === "ALL" ? bookings : bookings.filter((b) => b.status === statusFilter), [bookings, statusFilter]);

  const fmt = (d) => d ? new Date(d).toLocaleDateString("vi-VN") : "—";

  if (loading) return <SkeletonBlock rows={8} />;
  if (error)   return <ErrorState message={error} onRetry={() => window.location.reload()} />;

  return (
    <section style={{ display: "grid", gap: 16 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", borderRadius: 14, background: "linear-gradient(135deg,#0d2238,#1e3a5f)", color: "white" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>📊 Phân tích Booking</h1>
        <p style={{ margin: "4px 0 0", opacity: 0.8, fontSize: 13 }}>Tổng quan booking toàn hệ thống – tất cả chi nhánh</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <StatCard icon="📋" label="Tổng booking"       value={stats.totalBookings} />
        <StatCard icon="💰" label="Tổng doanh thu"     value={formatCurrencyVnd(stats.totalRevenue)} />
        <StatCard icon="✅" label="Đã thanh toán"      value={stats.paid} />
        <StatCard icon="🔄" label="Đang hoạt động"     value={stats.active} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        <RankList title="🏢 Chi nhánh có booking nhiều nhất" items={stats.topBranches} valueLabel="booking" />
        <RankList title="🛏️ Loại phòng được đặt nhiều nhất" items={stats.topRooms} valueLabel="lần" />
      </div>

      {/* Booking table */}
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>📋 Danh sách booking ({filtered.length})</h3>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {STATUSES.map((s) => (
              <button key={s} type="button" onClick={() => setStatusFilter(s)}
                style={{ padding: "5px 12px", borderRadius: 99, border: "1px solid #e2e8f0", background: statusFilter === s ? "#0d2238" : "#fff", color: statusFilter === s ? "#fff" : "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                {s === "ALL" ? "Tất cả" : s}
              </button>
            ))}
          </div>
        </div>
        {filtered.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Không có booking nào</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["ID", "Chi nhánh", "Phòng", "Ngày vào", "Ngày ra", "Doanh thu", "Thanh toán", "Trạng thái"].map((h) => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, color: "#64748b", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map((b) => (
                  <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 12, color: "#64748b" }}>{b.id?.slice(-6) || "—"}</td>
                    <td style={{ padding: "8px 12px", color: "#0d2238", fontWeight: 600 }}>{b.branchName || "—"}</td>
                    <td style={{ padding: "8px 12px" }}>{b.roomTypeName || b.roomNumber || "—"}</td>
                    <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>{fmt(b.checkInDate)}</td>
                    <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>{fmt(b.checkOutDate)}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 700 }}>{formatCurrencyVnd(b.totalPrice || 0)}</td>
                    <td style={{ padding: "8px 12px" }}><StatusBadge status={b.paymentStatus} /></td>
                    <td style={{ padding: "8px 12px" }}><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 20 && <p style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", marginTop: 10 }}>Hiển thị 20/{filtered.length} bản ghi</p>}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="card" style={{ padding: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link className="btn pill pill-soft" to={PATHS.OWNER}>← Dashboard</Link>
        <Link className="btn btn-gold" to={PATHS.OWNER_PRICING_REQUESTS}>✅ Duyệt pricing requests</Link>
      </div>
    </section>
  );
}
