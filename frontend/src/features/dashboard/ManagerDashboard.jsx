import { useEffect, useMemo, useState } from "react";
import { dashboardService } from "./dashboardService";
import { branchService } from "../branches/branchService";
import { formatCurrencyVnd, formatDate, formatStatus } from "../../services/presenters";

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
      setError(err.message || "Khong the tai dashboard manager");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!selectedRoomForFeedback) {
        setFeedbacks([]);
        return;
      }
      try {
        const data = await dashboardService.getManagerFeedbackByRoom(selectedRoomForFeedback);
        setFeedbacks(data || []);
      } catch (err) {
        setError(err.message || "Khong the tai feedback");
      }
    };

    fetchFeedback();
  }, [selectedRoomForFeedback]);

  const selectedBranchName = useMemo(() => branches.find((branch) => branch.id === selectedBranchId)?.name || "", [branches, selectedBranchId]);

  const callAction = async (fn, successMsg = "Thao tac thanh cong") => {
    setMessage("");
    setError("");
    try {
      await fn();
      setMessage(successMsg);
      await loadData();
    } catch (err) {
      setError(err.message || "Thao tac that bai");
    }
  };

  if (loading) {
    return <div className="card" style={{ padding: 18 }}>Dang tai dashboard manager...</div>;
  }

  return (
    <section style={{ display: "grid", gap: 18 }}>
      <div className="page-heading">
        <h1>Manager Dashboard</h1>
        <p>Điều hành chi nhánh bằng bố cục dashboard hiện đại, rõ ràng và giàu ngữ cảnh.</p>
      </div>
      {message && <div style={{ color: "#166534" }}>{message}</div>}
      {error && <div style={{ color: "#b91c1c" }}>{error}</div>}

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

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Chi nhánh quản lý</h3>
        <select value={selectedBranchId} onChange={(event) => setSelectedBranchId(event.target.value)} style={{ maxWidth: 460 }}>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
          ))}
        </select>
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Pricing requests</h3>
        <div style={{ marginBottom: 10 }}>Chi nhanh hien tai: <strong>{selectedBranchName}</strong></div>
        <div style={{ display: "grid", gap: 8 }}>
          {pricingRequests.map((req) => (
            <div key={req.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
              <strong>{req.name}</strong> · {formatStatus(req.status)}
              <div>{formatDate(req.startsOn)} - {formatDate(req.endsOn)} · {req.discountPercent}%</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Ten chuong trinh" value={pricingForm.name} onChange={(event) => setPricingForm((prev) => ({ ...prev, name: event.target.value }))} />
          <input type="date" value={pricingForm.startsOn} onChange={(event) => setPricingForm((prev) => ({ ...prev, startsOn: event.target.value }))} />
          <input type="date" value={pricingForm.endsOn} onChange={(event) => setPricingForm((prev) => ({ ...prev, endsOn: event.target.value }))} />
          <input type="number" value={pricingForm.discountPercent} onChange={(event) => setPricingForm((prev) => ({ ...prev, discountPercent: Number(event.target.value || 0) }))} />
          <input placeholder="Ghi chu" value={pricingForm.notes} onChange={(event) => setPricingForm((prev) => ({ ...prev, notes: event.target.value }))} />
        </div>
        <button
          className="btn btn-gold"
          style={{ marginTop: 10 }}
          onClick={() => callAction(() => dashboardService.createManagerPricingRequest({ ...pricingForm, branchId: selectedBranchId }), "Da tao pricing request")}
        >
          Gui pricing request
        </button>
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Quan ly phong</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {rooms.map((room) => (
            <div key={room.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "flex", justifyContent: "space-between", gap: 10 }}>
              <span>{room.roomNumber} · {room.roomTypeName} · {formatStatus(room.status)}</span>
              <span className="mono">{formatCurrencyVnd(room.rate)}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Room type ID" value={roomForm.roomTypeId} onChange={(event) => setRoomForm((prev) => ({ ...prev, roomTypeId: event.target.value }))} />
          <input placeholder="Room number" value={roomForm.roomNumber} onChange={(event) => setRoomForm((prev) => ({ ...prev, roomNumber: event.target.value }))} />
          <input type="number" min={1} placeholder="Max occupancy" value={roomForm.maxOccupancy} onChange={(event) => setRoomForm((prev) => ({ ...prev, maxOccupancy: Number(event.target.value || 1) }))} />
          <input type="number" min={0} placeholder="Rate" value={roomForm.rate} onChange={(event) => setRoomForm((prev) => ({ ...prev, rate: Number(event.target.value || 0) }))} />
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 10 }}
          onClick={() => callAction(() => dashboardService.createManagerRoom({ ...roomForm, branchId: selectedBranchId }), "Da tao phong moi")}
        >
          Tao phong moi
        </button>
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Booking tai chi nhanh</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {bookings.map((booking) => (
            <div key={booking.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
              <div><strong>{booking.id}</strong> · {formatStatus(booking.status)}</div>
              <div>{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</div>
            </div>
          ))}
        </div>
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Feedback va phan hoi</h3>
        <select value={selectedRoomForFeedback} onChange={(event) => setSelectedRoomForFeedback(event.target.value)} style={{ marginBottom: 10, maxWidth: 500 }}>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>{room.roomNumber} - {room.roomTypeName}</option>
          ))}
        </select>
        <div style={{ display: "grid", gap: 8 }}>
          {feedbacks.map((fb) => (
            <label key={fb.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, display: "grid", gap: 4 }}>
              <input type="radio" name="selectedFeedback" checked={selectedFeedbackId === fb.id} onChange={() => setSelectedFeedbackId(fb.id)} />
              <span>⭐ {fb.rating}/5 - {fb.content}</span>
              {fb.managerReply && <small>Da reply: {fb.managerReply}</small>}
            </label>
          ))}
        </div>
        <textarea placeholder="Noi dung phan hoi" value={replyText} onChange={(event) => setReplyText(event.target.value)} rows={3} style={{ marginTop: 10, width: "100%" }} />
        <button
          className="btn btn-gold"
          style={{ marginTop: 10 }}
          onClick={() => callAction(() => dashboardService.replyManagerFeedback({ feedbackId: selectedFeedbackId, reply: replyText }), "Da gui phan hoi")}
          disabled={!selectedFeedbackId || !replyText.trim()}
        >
          Gui phan hoi
        </button>
      </article>

      <article className="card card-elevated" style={{ padding: 16 }}>
        <h3>Quan ly dich vu</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {services.map((service) => (
            <div key={service.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10 }}>
              <strong>{service.name}</strong> ({service.code}) · {formatCurrencyVnd(service.price)} · {service.serviceMode}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <input placeholder="Code" value={serviceForm.code} onChange={(event) => setServiceForm((prev) => ({ ...prev, code: event.target.value }))} />
          <input placeholder="Ten dich vu" value={serviceForm.name} onChange={(event) => setServiceForm((prev) => ({ ...prev, name: event.target.value }))} />
          <input placeholder="Mo ta" value={serviceForm.description} onChange={(event) => setServiceForm((prev) => ({ ...prev, description: event.target.value }))} />
          <input placeholder="Thumbnail URL" value={serviceForm.thumbnailUrl} onChange={(event) => setServiceForm((prev) => ({ ...prev, thumbnailUrl: event.target.value }))} />
          <input type="number" min={0} placeholder="Gia" value={serviceForm.price} onChange={(event) => setServiceForm((prev) => ({ ...prev, price: Number(event.target.value || 0) }))} />
          <select value={serviceForm.serviceMode} onChange={(event) => setServiceForm((prev) => ({ ...prev, serviceMode: event.target.value }))}>
            <option value="BOTH">BOTH</option>
            <option value="PREBOOK">PREBOOK</option>
            <option value="ON_SITE">ON_SITE</option>
          </select>
        </div>
        <button
          className="btn btn-primary"
          style={{ marginTop: 10 }}
          onClick={() => callAction(() => dashboardService.createManagerService({ ...serviceForm, branchId: selectedBranchId }), "Da tao dich vu")}
        >
          Tao dich vu moi
        </button>
      </article>
    </section>
  );
}
