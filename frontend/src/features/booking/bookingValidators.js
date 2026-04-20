export function validatePreviewBookingForm(form, selectedRoom, nights) {
  const errors = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!form.roomId) errors.roomId = "Vui long chon phong";
  if (!form.branchId) errors.branchId = "Vui long chon chi nhanh";
  if (!form.checkInDate) errors.checkInDate = "Vui long chon ngay check-in";
  if (!form.checkOutDate) errors.checkOutDate = "Vui long chon ngay check-out";

  if (form.checkInDate) {
    const checkIn = new Date(form.checkInDate);
    if (checkIn < today) {
      errors.checkInDate = "Ngay check-in khong duoc trong qua khu";
    }
  }

  if (form.checkInDate && form.checkOutDate) {
    const checkIn = new Date(form.checkInDate);
    const checkOut = new Date(form.checkOutDate);
    if (checkOut <= checkIn) {
      errors.checkOutDate = "Ngay check-out phai sau check-in";
    }
  }

  if (form.adults < 1) errors.adults = "Nguoi lon toi thieu la 1";
  if (form.children < 0) errors.children = "Tre em khong hop le";

  if (selectedRoom && form.adults + form.children > selectedRoom.maxOccupancy) {
    errors.adults = `Tong so khach vuot suc chua toi da (${selectedRoom.maxOccupancy})`;
  }

  if (nights <= 0) {
    errors.checkOutDate = errors.checkOutDate || "So dem luu tru phai lon hon 0";
  }

  return errors;
}
