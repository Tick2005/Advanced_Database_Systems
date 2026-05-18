export function validatePreviewBookingForm(form, selectedRoom, nights) {
  const errors = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!form.roomId) errors.roomId = "Vui long chon phong";
  if (!form.checkInDate) errors.checkInDate = "Vui long chon ngay check-in";
  if (!form.checkInTime) errors.checkInTime = "Vui long chon gio check-in";
  if (!Number.isFinite(nights) || nights < 1) errors.stayNights = "So dem phai lon hon 0";

  if (form.checkInDate) {
    const checkIn = new Date(form.checkInDate);
    if (checkIn < today) {
      errors.checkInDate = "Ngay check-in khong duoc trong qua khu";
    }
  }

  const checkOutDate = (() => {
    if (!form.checkInDate || !Number.isFinite(nights) || nights < 1) return null;
    const date = new Date(form.checkInDate);
    date.setDate(date.getDate() + nights);
    return date;
  })();

  if (form.checkInDate && checkOutDate) {
    const checkIn = new Date(form.checkInDate);
    if (checkOutDate <= checkIn) {
      errors.stayNights = "Ngay tra phong phai sau ngay check-in";
    }
  }

  if (form.adults < 1) errors.adults = "Nguoi lon toi thieu la 1";
  if (form.children < 0) errors.children = "Tre em khong hop le";

  if (selectedRoom && form.adults + form.children > selectedRoom.maxOccupancy) {
    errors.adults = `Tong so khach vuot suc chua toi da (${selectedRoom.maxOccupancy})`;
  }

  return errors;
}
