export function humanizeEnum(value) {
  if (!value) return "Unknown";
  return String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const STATUS_LABELS = {
  AVAILABLE: "Con phong",
  HELD: "Tam giu",
  OCCUPIED: "Dang co khach",
  MAINTENANCE: "Bao tri",
  HOLD: "Giu cho",
  PENDING_PAYMENT: "Cho thanh toan",
  CONFIRMED: "Da xac nhan",
  CHECKED_IN: "Da nhan phong",
  CHECKED_OUT: "Da tra phong",
  CANCELLED: "Da huy",
  EXPIRED: "Het han",
  INITIATED: "Khoi tao",
  PENDING: "Dang xu ly",
  SUCCESS: "Thanh cong",
  FAILED: "That bai",
  REFUNDED: "Da hoan tien"
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

export function formatCurrencyVnd(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(amount);
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
  if (text.includes("family")) return ["2 phong ngu", "Bep mini", "Ban an", "Wifi toc do cao"];
  if (text.includes("business")) return ["Ban lam viec", "Wifi toc do cao", "May pha ca phe", "Don phong nhanh"];
  if (text.includes("deluxe") || text.includes("king")) return ["Bon tam", "Smart TV", "Mini bar", "View thanh pho"];
  return ["Dieu hoa", "Wifi", "Nuoc uong mien phi", "Ke an toan"];
}
