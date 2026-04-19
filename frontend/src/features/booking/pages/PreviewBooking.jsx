import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { bookingService } from "../bookingService";
import { roomService } from "../../rooms/roomService";
import { branchService } from "../../branches/branchService";
import { PATHS } from "../../../routes/pathConstants";

export default function PreviewBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const state = location.state || {};
  const [form, setForm] = useState({
    roomId: state.roomId || "",
    branchId: state.branchId || "",
    checkInDate: state.checkInDate || "",
    checkOutDate: state.checkOutDate || "",
    adults: Number(state.adults || 2),
    children: Number(state.children || 0)
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [roomData, branchData] = await Promise.all([
          roomService.getRooms(),
          branchService.getTopBranches()
        ]);
        setRooms(roomData || []);
        setBranches(branchData || []);
      } catch (err) {
        setError(err.message || "Khong the tai du lieu dat phong");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === form.roomId) || null,
    [rooms, form.roomId]
  );

  const nights = useMemo(() => {
    if (!form.checkInDate || !form.checkOutDate) return 0;
    const from = new Date(form.checkInDate);
    const to = new Date(form.checkOutDate);
    return Math.max(0, Math.round((to - from) / (1000 * 60 * 60 * 24)));
  }, [form.checkInDate, form.checkOutDate]);

  const totalPrice = useMemo(() => {
    if (!selectedRoom?.rate || nights <= 0) return 0;
    return Number(selectedRoom.rate) * nights;
  }, [selectedRoom, nights]);

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!form.roomId) nextErrors.roomId = "Vui long chon phong";
    if (!form.branchId) nextErrors.branchId = "Vui long chon chi nhanh";
    if (!form.checkInDate) nextErrors.checkInDate = "Vui long chon ngay check-in";
    if (!form.checkOutDate) nextErrors.checkOutDate = "Vui long chon ngay check-out";

    if (form.checkInDate) {
      const checkIn = new Date(form.checkInDate);
      if (checkIn < today) {
        nextErrors.checkInDate = "Ngay check-in khong duoc trong qua khu";
      }
    }

    if (form.checkInDate && form.checkOutDate) {
      const checkIn = new Date(form.checkInDate);
      const checkOut = new Date(form.checkOutDate);
      if (checkOut <= checkIn) {
        nextErrors.checkOutDate = "Ngay check-out phai sau check-in";
      }
    }

    if (form.adults < 1) nextErrors.adults = "Nguoi lon toi thieu la 1";
    if (form.children < 0) nextErrors.children = "Tre em khong hop le";

    if (selectedRoom && form.adults + form.children > selectedRoom.maxOccupancy) {
      nextErrors.adults = `Tong so khach vuot suc chua toi da (${selectedRoom.maxOccupancy})`;
    }

    if (nights <= 0) {
      nextErrors.checkOutDate = nextErrors.checkOutDate || "So dem luu tru phai lon hon 0";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitBooking = async () => {
    if (!validate()) return;

    setLoading(true);
    setError("");
    try {
      const payload = {
        roomId: form.roomId,
        branchId: form.branchId,
        checkInDate: form.checkInDate,
        checkOutDate: form.checkOutDate,
        adults: Number(form.adults),
        children: Number(form.children),
        totalPrice
      };
      const booking = await bookingService.createBooking(payload);
      navigate(PATHS.CUSTOMER_BOOKING_REVIEW, { state: { booking, payload, room: selectedRoom } });
    } catch (err) {
      setError(err.message || "Khong the tao booking");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <h1>Dat phong - Buoc 1</h1>
        <div className="card" style={{ padding: 18 }}>Dang tai du lieu phong...</div>
      </section>
    );
  }

  const availableRooms = rooms.filter((room) => room.status === "AVAILABLE");

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      <h1>Dat phong - Buoc 1</h1>
      <div className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div className="field">
          <label>Phong</label>
          <select value={form.roomId} onChange={(event) => onChange("roomId", event.target.value)}>
            <option value="">Chon phong</option>
            {availableRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.roomTypeName} - {room.roomNumber} ({room.rate} VND/dem)
              </option>
            ))}
          </select>
          {fieldErrors.roomId && <small style={{ color: "#b91c1c" }}>{fieldErrors.roomId}</small>}
        </div>

        <div className="field">
          <label>Chi nhanh</label>
          <select value={form.branchId} onChange={(event) => onChange("branchId", event.target.value)}>
            <option value="">Chon chi nhanh</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
            ))}
          </select>
          {fieldErrors.branchId && <small style={{ color: "#b91c1c" }}>{fieldErrors.branchId}</small>}
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <div className="field">
            <label>Ngay check-in</label>
            <input type="date" value={form.checkInDate} onChange={(event) => onChange("checkInDate", event.target.value)} />
            {fieldErrors.checkInDate && <small style={{ color: "#b91c1c" }}>{fieldErrors.checkInDate}</small>}
          </div>

          <div className="field">
            <label>Ngay check-out</label>
            <input type="date" value={form.checkOutDate} onChange={(event) => onChange("checkOutDate", event.target.value)} />
            {fieldErrors.checkOutDate && <small style={{ color: "#b91c1c" }}>{fieldErrors.checkOutDate}</small>}
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <div className="field">
            <label>Nguoi lon</label>
            <input
              type="number"
              min={1}
              value={form.adults}
              onChange={(event) => onChange("adults", Number(event.target.value || 1))}
            />
            {fieldErrors.adults && <small style={{ color: "#b91c1c" }}>{fieldErrors.adults}</small>}
          </div>

          <div className="field">
            <label>Tre em</label>
            <input
              type="number"
              min={0}
              value={form.children}
              onChange={(event) => onChange("children", Number(event.target.value || 0))}
            />
            {fieldErrors.children && <small style={{ color: "#b91c1c" }}>{fieldErrors.children}</small>}
          </div>
        </div>

        <div className="card" style={{ padding: 12, borderColor: "#e9d7a5" }}>
          <div>So dem: <strong>{nights}</strong></div>
          <div className="mono">Tong tien du kien: <strong>{totalPrice} VND</strong></div>
        </div>

        {error && <div style={{ color: "#b91c1c" }}>{error}</div>}
        <button className="btn btn-gold" onClick={submitBooking} disabled={loading}>
          {loading ? "Dang tao..." : "Tiep theo"}
        </button>
      </div>
    </section>
  );
}
