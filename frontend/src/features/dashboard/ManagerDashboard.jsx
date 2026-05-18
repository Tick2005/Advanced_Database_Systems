import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { dashboardService } from "./dashboardService";
import { branchService } from "../branches/branchService";
import { formatCurrencyVnd, formatDate, formatStatus } from "../../services/presenters";

// ── Colour palette ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  AVAILABLE:   "#34d399",
  HELD:        "#fbbf24",
  OCCUPIED:    "#60a5fa",
  MAINTENANCE: "#f87171",
};
const STATUS_LABELS = {
  AVAILABLE:   "Trống",
  HELD:        "Tạm giữ",
  OCCUPIED:    "Có khách",
  MAINTENANCE: "Bảo trì",
};

export default function ManagerDashboard() {
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [pricingRequests, setPricingRequests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [selectedRoomForFeedback, setSelectedRoomForFeedback] = useState("");
  const [replyText, setReplyText] = useState("");
  const [selectedFeedbackId, setSelectedFeedbackId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [roomForm, setRoomForm] = useState({ roomTypeId: "", roomNumber: "", maxOccupancy: 2, rate: 1200000 });
  const [pricingForm, setPricingForm] = useState({ name: "", startsOn: "", endsOn: "", discountPercent: 0, notes: "" });
  const [serviceForm, setServiceForm] = useState({ code: "", name: "", description: "", thumbnailUrl: "", price: 0, serviceMode: "BOTH" });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const branchList = (await branchService.getBranches()) || [];
      const branchId = selectedBranchId || branchList[0]?.id || "";

      setBranches(branchList);
      setSelectedBranchId(branchId);

      const [pricingList, roomList, bookingList, serviceList] = await Promise.all([
        dashboardService.getManagerPricingRequests(),
        branchId ? dashboardService.getManagerRoomsByBranch(branchId) : Promise.resolve([]),
        dashboardService.getManagerBookings(),
        branchId ? dashboardService.getManagerServicesByBranch(branchId) : Promise.resolve([])
      ]);

      setPricingRequests(pricingList || []);
      setRooms(roomList || []);
      setBookings(bookingList || []);
      setServices(serviceList || []);

      const firstRoomId = (roomList || [])[0]?.id || "";
      setSelectedRoomForFeedback((prev) => prev || firstRoomId);
    } catch (err) {
      setError(err.message || "Không thể tải dashboard manager");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!selectedRoomForFeedback) { setFeedbacks([]); return; }
      try {
        const data = await dashboardService.getManagerFeedbackByRoom(selectedRoomForFeedback);
        setFeedbacks(data || []);
      } catch (err) {
        setError(err.message || "Không thể tải feedback");
      }
    };
    fetchFeedback();
  }, [selectedRoomForFeedback]);

  const selectedBranchName = useMemo(
    () => branches.find((b) => b.id === selectedBranchId)?.name || "",
    [branches, selectedBranchId]
  );

  // ── Chart data derived from already-loaded state ──────────────────────────

  // 1. Bookings per day in current month (line chart)
  const bookingsByDay = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const counts = Array.from({ length: daysInMonth }, (_, i) => ({ day: `N${i + 1}`, count: 0 }));
    bookings.forEach((b) => {
      const d = b.createdAt ? new Date(b.createdAt) : null;
      if (d && d.getFullYear() === year && d.getMonth() === month) {
        const idx = d.getDate() - 1;
        if (idx >= 0 && idx < counts.length) counts[idx].count += 1;
      }
    });
    // Only return days up to today
    return counts.slice(0, now.getDate());
  }, [bookings]);

  // 2. Room status pie chart
  const roomStatusPie = useMemo(() => {
    const map = {};
    rooms.forEach((r) => {
      const s = r.status || "AVAILABLE";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({
      name: STATUS_LABELS[name] || name,
      value,
      color: STATUS_COLORS[name] || "#cbd5e1",
    }));
  }, [rooms]);

  // 3. Booking rate by month (bar chart — last 6 months)
  const bookingsByMonth = useMemo(() => {
    const months = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `T${d.getMonth() + 1}`;
      months[key] = { month: key, confirmed: 0, cancelled: 0, total: 0 };
    }
    bookings.forEach((b) => {
      const d = b.createdAt ? new Date(b.createdAt) : null;
      if (!d) return;
      const key = `T${d.getMonth() + 1}`;
      if (!months[key]) return;
      months[key].total += 1;
      if (b.status === "CONFIRMED" || b.status === "CHECKED_IN" || b.status === "CHECKED_OUT") {
        months[key].confirmed += 1;
      } else if (b.status === "CANCELLED" || b.status === "EXPIRED") {
        months[key].cancelled += 1;
      }
    });
    return Object.values(months);
  }, [bookings]);

  const callAction = async (fn, successMsg = "Thao tác thành công") => {
    setMessage(""); setError("");
    try {
      await fn();
      setMessage(successMsg);
      await loadData();
    } catch (err) {
      setError(err.message || "Thao tác thất bại");
    }
  };

  if (loading) return <div className="card" style={{ padding: 18 }}>Đang tải dashboard manager...</div>;

  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div className="page-heading">
        <h1>Manager Dashboard</h1>
        <p>Điều hành chi nhánh bằng bố cục dashboard hiện đại, rõ ràng và giàu ngữ cảnh.</p>
      </div>
      {message && <div style={{ padding: "10px 14px", background: "#dcfce7", color: "#166534", borderRadius: 10, fontSize: 14 }}>{message}</div>}
      {error   && <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 14 }}>{error}</div>}

      {/* ── Banner ── */}
      <article className="promo-banner">
        <div className="section-title" style={{ color: "white" }}>
          <h2 style={{ margin: 0 }}>Tổng quan vận hành</h2>
          <small style={{ color: "rgba(255,255,255,0.78)" }}>{selectedBranchName || "Đang tải chi nhánh"}</small>
        </div>
        <div className="hero-stats" style={{ marginTop: 14 }}>
          <div className="hero-stat"><strong>{branches.length}</strong><span>Chi nhánh</span></div>
          <div className="hero-stat"><strong>{rooms.length}</strong><span>Phòng quản lý</span></div>
          <div className="hero-stat"><strong>{bookings.length}</strong><span>Booking theo dõi</span></div>
        </div>
      </article>

      {/* ── 3 Charts ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

        {/* Chart 1: Bookings per day this month (line) */}
        <article className="card card-elevated" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#0d2238" }}>
            📈 Số booking theo ngày (tháng này)
          </h3>
          {bookingsByDay.every((d) => d.count === 0) ? (
            <div style={{ height: 220, display: "grid", placeItems: "center", color: "#94a3b8", fontSize: 13 }}>
              Chưa có booking trong tháng này
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={bookingsByDay} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="count" name="Booking" stroke="#9a7d24" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </article>

        {/* Chart 2: Room status pie */}
        <article className="card card-elevated" style={{ padding: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#0d2238" }}>
            🏨 Tình trạng phòng
          </h3>
          {roomStatusPie.length === 0 ? (
            <div style={{ height: 220, display: "grid", placeItems: "center", color: "#94a3b8", fontSize: 13 }}>
              Chưa có dữ liệu phòng
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={roomStatusPie}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {roomStatusPie.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </article>
      </div>

      {/* Chart 3: Booking rate by month (bar — full width) */}
      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "#0d2238" }}>
          📊 Tỉ lệ đặt phòng theo tháng (6 tháng gần nhất)
        </h3>
        {bookingsByMonth.every((d) => d.total === 0) ? (
          <div style={{ height: 220, display: "grid", placeItems: "center", color: "#94a3b8", fontSize: 13 }}>
            Chưa có dữ liệu booking
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bookingsByMonth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="confirmed" name="Xác nhận" fill="#34d399" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="cancelled" name="Hủy/Hết hạn" fill="#f87171" radius={[4, 4, 0, 0]} stackId="a" />
              <Bar dataKey="total"     name="Tổng"       fill="#0d2238" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </article>

      {/* ── Branch selector ── */}
      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Chi nhánh quản lý</h3>
        <select value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} style={{ maxWidth: 460 }}>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name} - {b.city}</option>
          ))}
        </select>
      </article>

      {/* ── Pricing requests ── */}
      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Pricing requests</h3>
        <div style={{ marginBottom: 10 }}>Chi nhánh hiện tại: <strong>{selectedBranchName}</strong></div>
        <div style={{ display: "grid", gap: 8 }}>
          {pricingRequests.map((req) => (
            <div key={req.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
              <strong>{req.name}</strong> · {formatStatus(req.status)}
              <div>{formatDate(req.startsOn)} - {formatDate(req.endsOn)} · {req.discountPercent}%</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Tên chương trình" value={pricingForm.name} onChange={(e) => setPricingForm((p) => ({ ...p, name: e.target.value }))} />
          <input type="date" value={pricingForm.startsOn} onChange={(e) => setPricingForm((p) => ({ ...p, startsOn: e.target.value }))} />
          <input type="date" value={pricingForm.endsOn} onChange={(e) => setPricingForm((p) => ({ ...p, endsOn: e.target.value }))} />
          <input type="number" placeholder="Giảm %" value={pricingForm.discountPercent} onChange={(e) => setPricingForm((p) => ({ ...p, discountPercent: Number(e.target.value || 0) }))} />
          <input placeholder="Ghi chú" value={pricingForm.notes} onChange={(e) => setPricingForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
        <button className="btn btn-gold" style={{ marginTop: 10 }}
          onClick={() => callAction(() => dashboardService.createManagerPricingRequest({ ...pricingForm, branchId: selectedBranchId }), "Đã tạo pricing request")}>
          Gửi pricing request
        </button>
      </article>

      {/* ── Room management ── */}
      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Quản lý phòng</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {rooms.map((room) => (
            <div key={room.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span>{room.roomNumber} · {room.roomTypeName} · {formatStatus(room.status)}</span>
              <span className="mono">{formatCurrencyVnd(room.rate)}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Room type ID" value={roomForm.roomTypeId} onChange={(e) => setRoomForm((p) => ({ ...p, roomTypeId: e.target.value }))} />
          <input placeholder="Số phòng" value={roomForm.roomNumber} onChange={(e) => setRoomForm((p) => ({ ...p, roomNumber: e.target.value }))} />
          <input type="number" min={1} placeholder="Sức chứa" value={roomForm.maxOccupancy} onChange={(e) => setRoomForm((p) => ({ ...p, maxOccupancy: Number(e.target.value || 1) }))} />
          <input type="number" min={0} placeholder="Giá/đêm" value={roomForm.rate} onChange={(e) => setRoomForm((p) => ({ ...p, rate: Number(e.target.value || 0) }))} />
        </div>
        <button className="btn btn-primary" style={{ marginTop: 10 }}
          onClick={() => callAction(() => dashboardService.createManagerRoom({ ...roomForm, branchId: selectedBranchId }), "Đã tạo phòng mới")}>
          Tạo phòng mới
        </button>
      </article>

      {/* ── Bookings list ── */}
      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Booking tại chi nhánh</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {bookings.map((booking) => (
            <div key={booking.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
              <div><strong>{booking.id}</strong> · {formatStatus(booking.status)}</div>
              <div>{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</div>
            </div>
          ))}
        </div>
      </article>

      {/* ── Feedback ── */}
      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Feedback và phản hồi</h3>
        <select value={selectedRoomForFeedback} onChange={(e) => setSelectedRoomForFeedback(e.target.value)} style={{ marginBottom: 10, maxWidth: 500 }}>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>{room.roomNumber} - {room.roomTypeName}</option>
          ))}
        </select>
        <div style={{ display: "grid", gap: 8 }}>
          {feedbacks.map((fb) => (
            <label key={fb.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "grid", gap: 4 }}>
              <input type="radio" name="selectedFeedback" checked={selectedFeedbackId === fb.id} onChange={() => setSelectedFeedbackId(fb.id)} />
              <span>⭐ {fb.rating}/5 - {fb.content}</span>
              {fb.managerReply && <small>Đã reply: {fb.managerReply}</small>}
            </label>
          ))}
        </div>
        <textarea placeholder="Nội dung phản hồi" value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={3} style={{ marginTop: 10, width: "100%" }} />
        <button className="btn btn-gold" style={{ marginTop: 10 }}
          onClick={() => callAction(() => dashboardService.replyManagerFeedback({ feedbackId: selectedFeedbackId, reply: replyText }), "Đã gửi phản hồi")}
          disabled={!selectedFeedbackId || !replyText.trim()}>
          Gửi phản hồi
        </button>
      </article>

      {/* ── Services ── */}
      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Quản lý dịch vụ</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {services.map((service) => (
            <div key={service.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
              <strong>{service.name}</strong> ({service.code}) · {formatCurrencyVnd(service.price)} · {service.serviceMode}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Code" value={serviceForm.code} onChange={(e) => setServiceForm((p) => ({ ...p, code: e.target.value }))} />
          <input placeholder="Tên dịch vụ" value={serviceForm.name} onChange={(e) => setServiceForm((p) => ({ ...p, name: e.target.value }))} />
          <input placeholder="Mô tả" value={serviceForm.description} onChange={(e) => setServiceForm((p) => ({ ...p, description: e.target.value }))} />
          <input placeholder="Thumbnail URL" value={serviceForm.thumbnailUrl} onChange={(e) => setServiceForm((p) => ({ ...p, thumbnailUrl: e.target.value }))} />
          <input type="number" min={0} placeholder="Giá" value={serviceForm.price} onChange={(e) => setServiceForm((p) => ({ ...p, price: Number(e.target.value || 0) }))} />
          <select value={serviceForm.serviceMode} onChange={(e) => setServiceForm((p) => ({ ...p, serviceMode: e.target.value }))}>
            <option value="BOTH">BOTH</option>
            <option value="PREBOOK">PREBOOK</option>
            <option value="ON_SITE">ON_SITE</option>
          </select>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 10 }}
          onClick={() => callAction(() => dashboardService.createManagerService({ ...serviceForm, branchId: selectedBranchId }), "Đã tạo dịch vụ")}>
          Tạo dịch vụ mới
        </button>
      </article>
    </section>
  );
}
