export function humanizeEnum(value) {
  if (!value) return "Unknown";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const STATUS_LABELS = {
  AVAILABLE:       "Còn phòng",
  HELD:            "Tạm giữ",
  OCCUPIED:        "Đang có khách",
  MAINTENANCE:     "Bảo trì",
  HOLD:            "Đang giữ chỗ",
  PENDING_PAYMENT: "Chờ thanh toán",
  CONFIRMED:       "Đã xác nhận",
  CHECKED_IN:      "Đã nhận phòng",
  CHECKED_OUT:     "Đã trả phòng",
  CANCELLED:       "Đã hủy",
  EXPIRED:         "Hết hạn",
  INITIATED:       "Khởi tạo",
  PENDING:         "Đang xử lý",
  SUCCESS:         "Thành công",
  FAILED:          "Thất bại",
  REFUNDED:        "Đã hoàn tiền",
};

const STATUS_COLORS = {
  AVAILABLE: { bg: "#dcfce7", color: "#14532d" },
  HELD: { bg: "#fef3c7", color: "#854d0e" },
  OCCUPIED: { bg: "#fee2e2", color: "#991b1b" },
  MAINTENANCE: { bg: "#e2e8f0", color: "#334155" },
  CONFIRMED: { bg: "#dbeafe", color: "#1e3a8a" },
  CHECKED_IN: { bg: "#ede9fe", color: "#5b21b6" },
  CHECKED_OUT: { bg: "#e2e8f0", color: "#334155" },
  CANCELLED: { bg: "#fee2e2", color: "#991b1b" },
  SUCCESS: { bg: "#dcfce7", color: "#14532d" },
  FAILED: { bg: "#fee2e2", color: "#991b1b" }
};

const ROOM_IMAGE_BY_KEYWORD = [
  ["family", "https://images.pexels.com/photos/271619/pexels-photo-271619.jpeg"],
  ["business", "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg"],
  ["deluxe", "https://images.pexels.com/photos/338504/pexels-photo-338504.jpeg"],
  ["suite", "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg"],
  ["queen", "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg"],
  ["king", "https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg"]
];

export function formatStatus(value) {
  if (!value) return "Unknown";
  return STATUS_LABELS[value] || humanizeEnum(value);
}

export function getStatusStyle(value) {
  return STATUS_COLORS[value] || { bg: "#e2e8f0", color: "#334155" };
}

const intlVndInteger = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

/**
 * Phần số tiền (nhóm hàng nghìn theo vi-VN), không kèm đơn vị — dùng cho biểu đồ hoặc ghép chuỗi.
 */
export function formatVndAmount(value) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return "0";
  return intlVndInteger.format(n);
}

/**
 * Tiền VNĐ chuẩn: số + " đồng" (không dùng ký hiệu tắt K/M/tr/đ/₫/VNĐ).
 */
export function formatCurrencyVnd(value) {
  return `${formatVndAmount(value)} đồng`;
}

/** Cùng quy tắc với formatCurrencyVnd (giữ export cho mã cũ). */
export function formatCurrencyVndShort(value) {
  return formatCurrencyVnd(value);
}

/** Giá theo đêm: "x đồng / đêm" */
export function formatCurrencyVndPerNight(value) {
  return `${formatVndAmount(value)} đồng / đêm`;
}

export function formatDate(value) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("vi-VN");
}

export function getRoomImage(room) {
  if (room?.imageUrl && String(room.imageUrl).trim()) {
    return room.imageUrl;
  }

  const text = `${room?.roomTypeName || ""} ${room?.roomNumber || ""}`.toLowerCase();
  for (const [keyword, image] of ROOM_IMAGE_BY_KEYWORD) {
    if (text.includes(keyword)) return image;
  }
  return "https://images.pexels.com/photos/189296/pexels-photo-189296.jpeg";
}

export function getRoomAmenities(room) {
  const text = (room?.roomTypeName || "").toLowerCase();
  if (text.includes("family"))
    return ["2 phòng ngủ", "Bếp mini", "Bàn ăn", "Wifi tốc độ cao"];
  if (text.includes("business"))
    return ["Bàn làm việc", "Wifi tốc độ cao", "Máy pha cà phê", "Dọn phòng nhanh"];
  if (text.includes("deluxe") || text.includes("king"))
    return ["Bồn tắm", "Smart TV", "Mini bar", "View thành phố"];
  return ["Điều hòa", "Wifi", "Nước uống miễn phí", "Két an toàn"];
}
