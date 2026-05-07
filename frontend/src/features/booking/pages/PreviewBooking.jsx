import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { bookingService } from "../bookingService";
import { roomService } from "../../rooms/roomService";
import { branchService } from "../../branches/branchService";
import { PATHS } from "../../../routes/pathConstants";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { useApiMutation } from "../../../hooks/useApiMutation";
import { queryKeys } from "../../../services/queryKeys";
import { calculateBookingPrice, calculateNights } from "../bookingPricing";
import { validatePreviewBookingForm } from "../bookingValidators";
import { useBookingFunnelStep } from "../../../hooks/useBookingFunnelStep";
import { trackEvent } from "../../../services/tracking";

export default function PreviewBooking() {
  const location = useLocation();
  const navigate = useNavigate();
  const [fieldErrors, setFieldErrors] = useState({});
  useBookingFunnelStep("preview", { roomId: location.state?.roomId || null });

  const state = location.state || {};
  const [form, setForm] = useState({
    roomId: state.roomId || "",
    branchId: state.branchId || "",
    checkInDate: state.checkInDate || "",
    checkOutDate: state.checkOutDate || "",
    adults: Number(state.adults || 2),
    children: Number(state.children || 0)
  });

  const roomsQuery = useApiQuery({
    queryKey: queryKeys.rooms(),
    queryFn: () => roomService.getRooms(),
    staleTime: 60 * 1000
  });

  const branchesQuery = useApiQuery({
    queryKey: queryKeys.branches,
    queryFn: () => branchService.getTopBranches(),
    staleTime: 60 * 1000
  });

  const createBookingMutation = useApiMutation({
    mutationFn: (payload) => bookingService.createBooking(payload)
  });

  const rooms = roomsQuery.data || [];
  const branches = branchesQuery.data || [];

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === form.roomId) || null,
    [rooms, form.roomId]
  );

  const nights = useMemo(() => {
    return calculateNights(form.checkInDate, form.checkOutDate);
  }, [form.checkInDate, form.checkOutDate]);

  const totalPrice = useMemo(() => {
    return calculateBookingPrice(selectedRoom?.rate, nights);
  }, [selectedRoom, nights]);

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submitBooking = async () => {
    const nextErrors = validatePreviewBookingForm(form, selectedRoom, nights);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      trackEvent("booking_validation_failed", { step: "preview", errors: Object.keys(nextErrors) });
      return;
    }

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
      trackEvent("booking_step_submit", { step: "preview", roomId: payload.roomId, branchId: payload.branchId, totalPrice: payload.totalPrice });
      const booking = await createBookingMutation.mutateAsync(payload);
      trackEvent("booking_step_success", { step: "preview", bookingId: booking?.id || null });
      navigate(PATHS.CUSTOMER_BOOKING_REVIEW, { state: { booking, payload, room: selectedRoom } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Khong the tao booking";
      trackEvent("booking_step_failed", { step: "preview", reason: errorMessage });
    }
  };

  if (roomsQuery.isLoading || branchesQuery.isLoading) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <h1>Dat phong - Buoc 1</h1>
        <div className="card" style={{ padding: 18 }}>Dang tai du lieu phong...</div>
      </section>
    );
  }

  if (roomsQuery.error || branchesQuery.error) {
    return (
      <section className="container" style={{ padding: "28px 24px" }}>
        <h1>Dat phong - Buoc 1</h1>
        <div style={{ color: "#b91c1c", marginBottom: 10 }}>
          {(roomsQuery.error || branchesQuery.error)?.message || "Khong the tai du lieu dat phong"}
        </div>
        <button className="btn btn-primary" onClick={() => {
          roomsQuery.refetch();
          branchesQuery.refetch();
        }}>
          Thu lai
        </button>
      </section>
    );
  }

  const availableRooms = rooms.filter((room) => room.status === "AVAILABLE");

  return (
    <section className="container" style={{ padding: "28px 24px" }}>
      <h1>Dat phong - Buoc 1</h1>
      <div className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <div className="field">
          <label htmlFor="booking-room">Phong</label>
          <select id="booking-room" aria-label="Chon phong" aria-invalid={Boolean(fieldErrors.roomId)} aria-describedby={fieldErrors.roomId ? "booking-room-error" : undefined} value={form.roomId} onChange={(event) => onChange("roomId", event.target.value)}>
            <option value="">Chon phong</option>
            {availableRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.roomTypeName} - {room.roomNumber} ({room.rate} VND/dem)
              </option>
            ))}
          </select>
          {fieldErrors.roomId && <small id="booking-room-error" style={{ color: "#b91c1c" }}>{fieldErrors.roomId}</small>}
        </div>

        <div className="field">
          <label htmlFor="booking-branch">Chi nhanh</label>
          <select id="booking-branch" aria-label="Chon chi nhanh" aria-invalid={Boolean(fieldErrors.branchId)} aria-describedby={fieldErrors.branchId ? "booking-branch-error" : undefined} value={form.branchId} onChange={(event) => onChange("branchId", event.target.value)}>
            <option value="">Chon chi nhanh</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>{branch.name} - {branch.city}</option>
            ))}
          </select>
          {fieldErrors.branchId && <small id="booking-branch-error" style={{ color: "#b91c1c" }}>{fieldErrors.branchId}</small>}
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <div className="field">
            <label htmlFor="booking-checkin">Ngay check-in</label>
            <input id="booking-checkin" type="date" aria-invalid={Boolean(fieldErrors.checkInDate)} aria-describedby={fieldErrors.checkInDate ? "booking-checkin-error" : undefined} value={form.checkInDate} onChange={(event) => onChange("checkInDate", event.target.value)} />
            {fieldErrors.checkInDate && <small id="booking-checkin-error" style={{ color: "#b91c1c" }}>{fieldErrors.checkInDate}</small>}
          </div>

          <div className="field">
            <label htmlFor="booking-checkout">Ngay check-out</label>
            <input id="booking-checkout" type="date" aria-invalid={Boolean(fieldErrors.checkOutDate)} aria-describedby={fieldErrors.checkOutDate ? "booking-checkout-error" : undefined} value={form.checkOutDate} onChange={(event) => onChange("checkOutDate", event.target.value)} />
            {fieldErrors.checkOutDate && <small id="booking-checkout-error" style={{ color: "#b91c1c" }}>{fieldErrors.checkOutDate}</small>}
          </div>
        </div>

        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}>
          <div className="field">
            <label htmlFor="booking-adults">Nguoi lon</label>
            <input
              id="booking-adults"
              type="number"
              min={1}
              aria-invalid={Boolean(fieldErrors.adults)}
              aria-describedby={fieldErrors.adults ? "booking-adults-error" : undefined}
              value={form.adults}
              onChange={(event) => onChange("adults", Number(event.target.value || 1))}
            />
            {fieldErrors.adults && <small id="booking-adults-error" style={{ color: "#b91c1c" }}>{fieldErrors.adults}</small>}
          </div>

          <div className="field">
            <label htmlFor="booking-children">Tre em</label>
            <input
              id="booking-children"
              type="number"
              min={0}
              aria-invalid={Boolean(fieldErrors.children)}
              aria-describedby={fieldErrors.children ? "booking-children-error" : undefined}
              value={form.children}
              onChange={(event) => onChange("children", Number(event.target.value || 0))}
            />
            {fieldErrors.children && <small id="booking-children-error" style={{ color: "#b91c1c" }}>{fieldErrors.children}</small>}
          </div>
        </div>

        <div className="card" style={{ padding: 12, borderColor: "#e9d7a5" }}>
          <div>So dem: <strong>{nights}</strong></div>
          <div className="mono">Tong tien du kien: <strong>{totalPrice} VND</strong></div>
        </div>

        {createBookingMutation.error && <div style={{ color: "#b91c1c" }}>{createBookingMutation.error.message || "Khong the tao booking"}</div>}
        <button className="btn btn-gold" onClick={submitBooking} disabled={createBookingMutation.isPending} aria-label="Tiep tuc sang buoc xac nhan booking">
          {createBookingMutation.isPending ? "Dang tao..." : "Tiep theo"}
        </button>
      </div>
    </section>
  );
}
