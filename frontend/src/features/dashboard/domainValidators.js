import { validateImageUrl } from "../../services/uploadGuard";

const ROOM_STATUSES = ["AVAILABLE", "HELD", "OCCUPIED", "MAINTENANCE"];
const SERVICE_MODES = ["BOTH", "PREBOOK", "ON_SITE"];
const ROLES = ["CUSTOMER", "STAFF", "MANAGER", "OWNER"];

function isValidDateRange(startsOn, endsOn) {
  if (!startsOn || !endsOn) return false;
  return new Date(endsOn).getTime() > new Date(startsOn).getTime();
}

export function validateRoomForm(form, { isCreate = false } = {}) {
  const errors = {};

  if (isCreate && !String(form.roomTypeId || "").trim()) {
    errors.roomTypeId = "Room type ID la bat buoc";
  }

  if (isCreate) {
    const roomNumber = String(form.roomNumber || "").trim();
    if (!roomNumber) {
      errors.roomNumber = "So phong la bat buoc";
    } else if (!/^[A-Za-z0-9-]{2,20}$/.test(roomNumber)) {
      errors.roomNumber = "So phong chi cho phep chu, so va dau - (2-20 ky tu)";
    }
  }

  if (isCreate && Number(form.floor || 0) < 1) {
    errors.floor = "Tang phai lon hon hoac bang 1";
  }

  // Khi edit, maxOccupancy và rate là optional — chỉ validate khi isCreate hoặc khi có giá trị
  if (isCreate) {
    const occupancy = Number(form.maxOccupancy || 0);
    if (occupancy < 1 || occupancy > 20) {
      errors.maxOccupancy = "Suc chua phai trong khoang 1-20";
    }

    const rate = Number(form.rate || 0);
    if (rate <= 0) {
      errors.rate = "Gia phong phai lon hon 0";
    }
  } else {
    // Khi edit: chỉ validate nếu người dùng đã nhập giá trị
    if (form.maxOccupancy !== undefined && form.maxOccupancy !== "" && form.maxOccupancy !== null) {
      const occupancy = Number(form.maxOccupancy);
      if (occupancy < 1 || occupancy > 20) {
        errors.maxOccupancy = "Suc chua phai trong khoang 1-20";
      }
    }
    if (form.rate !== undefined && form.rate !== "" && form.rate !== null) {
      const rate = Number(form.rate);
      if (rate <= 0) {
        errors.rate = "Gia phong phai lon hon 0";
      }
    }
  }

  if (form.status && !ROOM_STATUSES.includes(form.status)) {
    errors.status = "Trang thai phong khong hop le";
  }

  if (String(form.notes || "").length > 500) {
    errors.notes = "Ghi chu toi da 500 ky tu";
  }

  return errors;
}

export function validateServiceForm(form, { isCreate = false } = {}) {
  const errors = {};

  if (isCreate) {
    const code = String(form.code || "").trim();
    if (!code) {
      errors.code = "Code la bat buoc";
    } else if (!/^[A-Z0-9_]{2,30}$/.test(code)) {
      errors.code = "Code chi gom chu hoa, so, _ (2-30 ky tu)";
    }
  }

  if (String(form.name || "").trim().length < 2) {
    errors.name = "Ten dich vu toi thieu 2 ky tu";
  }

  if (String(form.description || "").length > 500) {
    errors.description = "Mo ta toi da 500 ky tu";
  }

  if (Number(form.price || 0) < 0) {
    errors.price = "Gia dich vu khong duoc am";
  }

  if (!SERVICE_MODES.includes(form.serviceMode)) {
    errors.serviceMode = "Service mode khong hop le";
  }

  const imageError = validateImageUrl(form.thumbnailUrl);
  if (imageError) {
    errors.thumbnailUrl = imageError;
  }

  return errors;
}

export function validatePricingForm(form) {
  const errors = {};

  if (!String(form.branchId || "").trim()) {
    errors.branchId = "Branch ID la bat buoc";
  }

  if (String(form.name || "").trim().length < 3) {
    errors.name = "Ten chuong trinh toi thieu 3 ky tu";
  }

  if (!isValidDateRange(form.startsOn, form.endsOn)) {
    errors.dateRange = "Ngay ket thuc phai sau ngay bat dau";
  }

  // discountPercent truyền vào đây là giá trị cuối (âm = tăng giá, dương = giảm giá)
  // Form lưu abs value + surchargeMode, nhưng save() đã convert trước khi validate
  // Nên ở đây chỉ cần check abs value != 0 và trong range
  const discount = Number(form.discountPercent || 0);
  const absDiscount = Math.abs(discount);
  if (absDiscount === 0) {
    errors.discountPercent = "Phan tram dieu chinh gia khong duoc bang 0";
  } else if (absDiscount > 100) {
    errors.discountPercent = "Phan tram dieu chinh gia toi da 100%";
  }

  if (String(form.notes || "").length > 500) {
    errors.notes = "Ghi chu toi da 500 ky tu";
  }

  return errors;
}

export function validateBranchForm(form, existingCodes = []) {
  const errors = {};

  const code = String(form.code || "").trim().toUpperCase();
  if (!code) {
    errors.code = "Code chi nhanh la bat buoc";
  } else if (!/^[A-Z0-9-]{2,20}$/.test(code)) {
    errors.code = "Code chi nhanh khong hop le (2-20 ky tu, A-Z 0-9 -)";
  } else if (existingCodes.includes(code)) {
    errors.code = "Code chi nhanh da ton tai";
  }

  if (String(form.name || "").trim().length < 3) {
    errors.name = "Ten chi nhanh toi thieu 3 ky tu";
  }

  if (String(form.city || "").trim().length < 2) {
    errors.city = "Thanh pho toi thieu 2 ky tu";
  }

  if (String(form.address || "").trim().length < 5) {
    errors.address = "Dia chi toi thieu 5 ky tu";
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Email chi nhanh khong hop le";
  }

  if (form.phone && !/^\+?[0-9\s-]{8,20}$/.test(form.phone)) {
    errors.phone = "So dien thoai khong hop le";
  }

  return errors;
}

export function validateRoleChange({ currentRole, nextRole, targetEmail, currentEmail }) {
  const errors = {};
  if (!ROLES.includes(nextRole)) {
    errors.nextRole = "Role moi khong hop le";
  }
  if (currentRole === nextRole) {
    errors.nextRole = "Role moi phai khac role hien tai";
  }
  if (targetEmail && targetEmail === currentEmail) {
    errors.nextRole = "Khong the tu doi role cua chinh minh";
  }
  if (nextRole === "OWNER") {
    errors.nextRole = "Khong cho phep nang cap len OWNER tu giao dien";
  }
  return errors;
}
