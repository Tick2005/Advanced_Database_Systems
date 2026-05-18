import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { bookingService } from "../bookingService";
import { roomService } from "../../rooms/roomService";
import { PATHS } from "../../../routes/pathConstants";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutation";
import { queryKeys } from "../../../services/queryKeys";
import { calculateBookingPrice, calculateTotalWithSurcharge } from "../bookingPricing";
import { validatePreviewBookingForm } from "../bookingValidators";
import { useBookingFunnelStep } from "../../../hooks/useBookingFunnelStep";
import { trackEvent } from "../../../services/tracking";
import { formatCurrencyVnd, formatCurrencyVndPerNight } from "../../../services/presenters";

// Minimum check-in date = today
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Preset check-in time options
const CHECKIN_TIME_OPTIONS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00",
];

// Preset stay duration options
const STAY_NIGHT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30];

export default function PreviewBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const [fieldErrors, setFieldErrors] = useState({});
  useBookingFunnelStep("preview", { roomId: location.state?.roomId || null });

  const state = location.state || {};

  // If accessed directly without state (no roomId), redirect to rooms list
  useEffect(() => {
    if (!state.roomId) {
      navigate(PATHS.CUSTOMER_ROOMS, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [form, setForm] = useState({
    roomId: state.roomId || "",
    checkInDate: state.checkInDate || "",
    checkInTime: state.checkInTime || "14:00",
    stayNights: Number(state.stayNights || 1),
    adults: Number(state.adults || 2),
    children: Number(state.children || 0)
  });

  const roomsQuery = useApiQuery({
    queryKey: queryKeys.rooms(),
    queryFn: () => roomService.getRooms(),
    staleTime: 60 * 1000
  });

  const createBookingMutation = useApiMutation({
    mutationFn: (payload) => bookingService.createBooking(payload),
  });

  const rooms = roomsQuery.data || [];

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === form.roomId) || null,
    [rooms, form.roomId]
  );

  const selectedBranchId = selectedRoom?.branchId || state.branchId || "";

  const nights = useMemo(() => {
    return Math.max(1, Number(form.stayNights || 1));
  }, [form.stayNights]);

  const checkOutDate = useMemo(() => {
    if (!form.checkInDate || nights < 1) return "";
    const date = new Date(`${form.checkInDate}T00:00:00`);
    date.setDate(date.getDate() + nights);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [form.checkInDate, nights]);

  const totalPrice = useMemo(() => {
    // Dùng effectiveRate nếu có (đã áp pricing_season), fallback về rate gốc
    const pricePerNight = selectedRoom?.effectiveRate != null
      ? Number(selectedRoom.effectiveRate)
      : Number(selectedRoom?.rate || 0);
    return calculateBookingPrice(pricePerNight, nights);
  }, [selectedRoom, nights]);

  // Phụ phí số người: từ người thứ 3 trở đi, +20% giá phòng/đêm/người
  const { surcharge, total: totalWithSurcharge } = useMemo(() => {
    const pricePerNight = selectedRoom?.effectiveRate != null
      ? Number(selectedRoom.effectiveRate)
      : Number(selectedRoom?.rate || 0);
    const totalGuests = Number(form.adults || 1) + Number(form.children || 0);
    return calculateTotalWithSurcharge(pricePerNight, nights, totalGuests, 2);
  }, [selectedRoom, nights, form.adults, form.children]);

  const onChange = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "roomId") {
        const nextRoom = rooms.find((room) => room.id === value);
        next.branchId = nextRoom?.branchId || "";
      }
      return next;
    });
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submitBooking = async () => {
    const nextErrors = validatePreviewBookingForm(form, selectedRoom, nights);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      trackEvent("booking_validation_failed", { step: "preview", errors: Object.keys(nextErrors) });
      return;
    }

    // Guard: selectedRoom must be loaded before submitting
    if (!selectedRoom) {
      setFieldErrors((prev) => ({ ...prev, roomId: "Không tìm thấy thông tin phòng. Vui lòng thử lại." }));
      return;
    }

    // Compute totalPrice: dùng effectiveRate nếu có (đã áp pricing_season)
    // Nếu không có effectiveRate, fallback về rate gốc
    const pricePerNight = Number(selectedRoom.effectiveRate != null ? selectedRoom.effectiveRate : selectedRoom.rate || 0);
    const computedPrice = (totalPrice > 0 ? totalPrice : pricePerNight * nights) || 0;
    
    // Prevent submission if final price is 0 or invalid
    if (!computedPrice || computedPrice <= 0) {
      setFieldErrors((prev) => ({ ...prev, roomId: "Không thể tính toán giá phòng. Vui lòng kiểm tra lại thông tin phòng." }));
      trackEvent("booking_validation_failed", { step: "preview", reason: "Invalid price calculation" });
      return;
    }

    try {
      const payload = {
        roomId: form.roomId,
        branchId: selectedBranchId,
        checkInDate: form.checkInDate,
        checkInTime: form.checkInTime,
        checkOutDate,
        adults: Number(form.adults),
        children: Number(form.children),
        totalPrice: computedPrice
      };
      trackEvent("booking_step_submit", { step: "preview", roomId: payload.roomId, branchId: payload.branchId, totalPrice: payload.totalPrice });
      const booking = await createBookingMutation.mutateAsync(payload);
      trackEvent("booking_step_success", { step: "preview", bookingId: booking?.id || null });
      navigate(PATHS.CUSTOMER_BOOKING_REVIEW, { state: { booking, payload, room: selectedRoom } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Không thể tạo booking";
      trackEvent("booking_step_failed", { step: "preview", reason: errorMessage });
    }
  };

  if (roomsQuery.isLoading) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <h1>Đặt phòng - Bước 1</h1>
        <div className="card" style={{ padding: 18 }}>Đang tải dữ liệu phòng...</div>
      </section>
    );
  }

  if (roomsQuery.error) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <h1>Đặt phòng - Bước 1</h1>
        <div style={{ color: "#b91c1c", marginBottom: 10 }}>
          {roomsQuery.error?.message || "Không thể tải dữ liệu đặt phòng"}
        </div>
        <button className="btn btn-primary" onClick={() => roomsQuery.refetch()}>
          Thử lại
        </button>
      </section>
    );
  }

  const availableRooms = rooms.filter((room) => room.status === "AVAILABLE");

  return (
    <section className="container" style={{ padding: "28px 24px", maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span style={{ width: 32, height: 32, borderRadius: 999, background: "linear-gradient(135deg,#0d2238,#1e3a5f)", color: "#c9a84c", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14 }}>1</span>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0d2238" }}>Chọn phòng & Thời gian</h1>
        </div>
        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>Phòng sẽ được giữ trong <strong>15 phút</strong> sau khi tạo booking để chờ thanh toán.</p>
      </div>

      <div className="card-elevated" style={{ padding: 24, display: "grid", gap: 20 }}>

        {/* Room selection — only shown when no room was pre-selected (e.g. direct navigation) */}
        {!state.roomId && (
        <div className="field">
          <label htmlFor="booking-room" style={{ fontSize: 14, fontWeight: 700, color: "#0d2238" }}>🛏️ Chọn phòng</label>
          <select
            id="booking-room"
            aria-label="Chọn phòng"
            aria-invalid={Boolean(fieldErrors.roomId)}
            value={form.roomId}
            onChange={(e) => onChange("roomId", e.target.value)}
            style={{ fontSize: 14 }}
          >
            <option value="">-- Chọn phòng khả dụng --</option>
            {availableRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.roomTypeName} - Phòng {room.roomNumber} ({formatCurrencyVndPerNight(room.rate)})
              </option>
            ))}
          </select>
          {fieldErrors.roomId && <small style={{ color: "#b91c1c" }}>{fieldErrors.roomId}</small>}
          {availableRooms.length === 0 && (
            <small style={{ color: "#d97706" }}>⚠️ Hiện không có phòng nào khả dụng.</small>
          )}
        </div>
        )}

        {/* When room is pre-selected, show a read-only summary */}
        {state.roomId && selectedRoom && (
          <div style={{ padding: "12px 14px", borderRadius: 12, background: "#f0f9ff", border: "1px solid #bae6fd", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0d2238" }}>🛏️ {selectedRoom.roomTypeName} — Phòng {selectedRoom.roomNumber}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, display: "flex", alignItems: "center", gap: 8 }}>
                {/* Hiển thị effectiveRate, gạch rate gốc nếu có season */}
                <span style={{ fontWeight: 700, color: "#0d2238" }}>
                  {formatCurrencyVndPerNight(selectedRoom.effectiveRate != null ? selectedRoom.effectiveRate : selectedRoom.rate)}
                </span>
                {selectedRoom.effectiveRate != null && Math.abs(Number(selectedRoom.effectiveRate) - Number(selectedRoom.rate)) > 1 && (
                  <span style={{ textDecoration: "line-through", color: "#94a3b8" }}>
                    {formatCurrencyVndPerNight(selectedRoom.rate)}
                  </span>
                )}
                {selectedRoom.activeSeasonName && (
                  <span style={{ padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700,
                    background: Number(selectedRoom.effectiveRate) > Number(selectedRoom.rate) ? "#fee2e2" : "#dcfce7",
                    color: Number(selectedRoom.effectiveRate) > Number(selectedRoom.rate) ? "#b91c1c" : "#16a34a" }}>
                    {selectedRoom.activeSeasonName}
                  </span>
                )}
              </div>
            </div>
            <button type="button" className="btn pill pill-soft" style={{ fontSize: 12 }} onClick={() => navigate(-1)}>Đổi phòng</button>
          </div>
        )}

        {/* Check-in date & time */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0d2238", marginBottom: 10 }}>📅 Ngày & Giờ nhận phòng</div>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <label htmlFor="booking-checkin" style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Ngày nhận phòng</label>
              <input
                id="booking-checkin"
                type="date"
                min={getTodayStr()}
                aria-invalid={Boolean(fieldErrors.checkInDate)}
                value={form.checkInDate}
                onChange={(e) => onChange("checkInDate", e.target.value)}
              />
              {fieldErrors.checkInDate && <small style={{ color: "#b91c1c" }}>{fieldErrors.checkInDate}</small>}
            </div>

            <div className="field">
              <label htmlFor="booking-checkin-time" style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Giờ nhận phòng</label>
              <select
                id="booking-checkin-time"
                value={form.checkInTime}
                onChange={(e) => onChange("checkInTime", e.target.value)}
              >
                {CHECKIN_TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {fieldErrors.checkInTime && <small style={{ color: "#b91c1c" }}>{fieldErrors.checkInTime}</small>}
            </div>
          </div>
        </div>

        {/* Stay duration */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0d2238", marginBottom: 10 }}>🌙 Số đêm lưu trú</div>
          {/* Quick-select buttons */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {STAY_NIGHT_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange("stayNights", n)}
                style={{
                  padding: "6px 14px", borderRadius: 99, fontSize: 13, fontWeight: 600, cursor: "pointer",
                  border: form.stayNights === n ? "2px solid #c9a84c" : "1px solid #e2e8f0",
                  background: form.stayNights === n ? "#fffbeb" : "white",
                  color: form.stayNights === n ? "#9a7d24" : "#475569",
                  transition: "all 0.15s",
                }}
              >
                {n} đêm
              </button>
            ))}
          </div>
          {/* Manual input */}
          <div className="field">
            <label htmlFor="booking-nights" style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Hoặc nhập số đêm tùy chỉnh</label>
            <input
              id="booking-nights"
              type="number"
              min={1}
              max={365}
              value={form.stayNights}
              onChange={(e) => onChange("stayNights", Math.max(1, Number(e.target.value || 1)))}
              style={{ maxWidth: 120 }}
            />
          </div>
          {fieldErrors.stayNights && <small style={{ color: "#b91c1c" }}>{fieldErrors.stayNights}</small>}
        </div>

        {/* Summary card */}
        {form.checkInDate && (
          <div style={{ padding: "14px 16px", borderRadius: 14, background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1px solid #fde68a", display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 4 }}>📋 Tóm tắt thời gian</div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", fontSize: 14 }}>
              <div><span style={{ color: "#64748b" }}>Nhận phòng: </span><strong>{form.checkInDate} lúc {form.checkInTime}</strong></div>
              <div><span style={{ color: "#64748b" }}>Trả phòng: </span><strong>{checkOutDate || "--"}</strong></div>
              <div><span style={{ color: "#64748b" }}>Số đêm: </span><strong>{nights}</strong></div>
            </div>
          </div>
        )}

        {/* Guests */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0d2238", marginBottom: 10 }}>👥 Số khách</div>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
            <div className="field">
              <label htmlFor="booking-adults" style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Người lớn</label>
              <input
                id="booking-adults"
                type="number"
                min={1}
                aria-invalid={Boolean(fieldErrors.adults)}
                value={form.adults}
                onChange={(e) => onChange("adults", Math.max(1, Number(e.target.value || 1)))}
              />
              {fieldErrors.adults && <small style={{ color: "#b91c1c" }}>{fieldErrors.adults}</small>}
            </div>
            <div className="field">
              <label htmlFor="booking-children" style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Trẻ em</label>
              <input
                id="booking-children"
                type="number"
                min={0}
                aria-invalid={Boolean(fieldErrors.children)}
                value={form.children}
                onChange={(e) => onChange("children", Math.max(0, Number(e.target.value || 0)))}
              />
              {fieldErrors.children && <small style={{ color: "#b91c1c" }}>{fieldErrors.children}</small>}
            </div>
          </div>
        </div>

        {/* Price preview */}
        <div style={{ padding: "14px 16px", borderRadius: 14, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, color: "#0369a1", fontWeight: 600 }}>💰 Tổng tiền dự kiến</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#0d2238", fontFamily: "JetBrains Mono, monospace" }}>
              {selectedRoom ? formatCurrencyVnd(totalWithSurcharge) : "--"}
            </span>
          </div>
          {selectedRoom && (
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
              {formatCurrencyVndPerNight(selectedRoom.effectiveRate != null ? selectedRoom.effectiveRate : selectedRoom.rate)} × {nights} đêm = {formatCurrencyVnd(totalPrice)}
              {surcharge > 0 && (
                <span style={{ color: "#d97706", fontWeight: 600 }}>
                  {" "}+ phụ phí {form.adults + form.children - 2} người thêm: +{formatCurrencyVnd(surcharge)}
                </span>
              )}
              {selectedRoom.effectiveRate != null && Math.abs(Number(selectedRoom.effectiveRate) - Number(selectedRoom.rate)) > 1 && (
                <span style={{ display: "block", color: selectedRoom.activeSeasonName ? "#16a34a" : "#64748b", fontWeight: 600, marginTop: 2 }}>
                  {selectedRoom.activeSeasonName
                    ? `🏷️ Áp dụng chương trình: ${selectedRoom.activeSeasonName}`
                    : ""}
                </span>
              )}
              <span style={{ display: "block", marginTop: 2 }}>(chưa bao gồm VAT và dịch vụ)</span>
            </div>
          )}
          {(Number(form.adults || 1) + Number(form.children || 0)) > 2 && selectedRoom && (
            <div style={{ fontSize: 12, color: "#d97706", marginTop: 4, fontWeight: 600 }}>
              ℹ️ Phụ phí +20%/người/đêm áp dụng từ người thứ 3 trở đi
            </div>
          )}
          <div style={{ fontSize: 12, color: "#d97706", marginTop: 6, fontWeight: 600 }}>
            ⏱️ Phòng sẽ được giữ 15 phút sau khi tạo booking — hoàn thành thanh toán trước khi hết giờ.
          </div>
        </div>

        {createBookingMutation.error && (
          <div style={{ padding: "10px 14px", background: "#fee2e2", color: "#b91c1c", borderRadius: 10, fontSize: 13 }}>
            ❌ {createBookingMutation.error.message || "Không thể tạo booking. Vui lòng thử lại."}
          </div>
        )}

        <button
          className="btn btn-gold"
          onClick={submitBooking}
          disabled={createBookingMutation.isPending}
          style={{ padding: "14px", fontSize: 15, fontWeight: 700, opacity: createBookingMutation.isPending ? 0.6 : 1 }}
          aria-label="Tiếp tục sang bước xác nhận booking"
        >
          {createBookingMutation.isPending ? "⏳ Đang tạo booking..." : "Tiếp theo: Xác nhận & Thanh toán →"}
        </button>
      </div>
    </section>
  );
}
