export function calculateNights(checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate) return 0;
  const from = new Date(checkInDate);
  const to = new Date(checkOutDate);
  return Math.max(0, Math.round((to - from) / (1000 * 60 * 60 * 24)));
}

export function calculateBookingPrice(rate, nights) {
  // Only reject if rate is null/undefined or nights <= 0
  // Note: rate of 0 is invalid for a real room, but we still calculate it
  // Backend will validate and reject zero rates
  if (rate === null || rate === undefined || nights <= 0) return 0;
  const numRate = Number(rate);
  // If rate is 0 or NaN after conversion, return 0 (backend will handle)
  if (!numRate || numRate <= 0) return 0;
  return numRate * nights;
}

/**
 * Tính phụ phí theo số người vượt sức chứa cơ bản (2 người).
 * - Từ 2 người trở xuống: không phụ phí.
 * - Mỗi người thêm (từ người thứ 3 trở đi): +20% giá phòng/đêm/người.
 *
 * Ví dụ: phòng 1.000.000đ/đêm, 3 người → phụ phí = 1.000.000 × 20% × 1 người × số đêm
 *
 * @param {number} rate - Giá phòng mỗi đêm
 * @param {number} nights - Số đêm
 * @param {number} totalGuests - Tổng số khách (người lớn + trẻ em)
 * @param {number} baseOccupancy - Sức chứa cơ bản không tính phụ phí (mặc định 2)
 * @returns {number} Tổng phụ phí
 */
export function calculateOccupancySurcharge(rate, nights, totalGuests, baseOccupancy = 2) {
  if (!rate || !nights || totalGuests <= baseOccupancy) return 0;
  const numRate = Number(rate);
  if (!numRate || numRate <= 0) return 0;
  const extraGuests = Math.max(0, totalGuests - baseOccupancy);
  // +20% giá phòng/đêm cho mỗi người vượt sức chứa cơ bản
  return Math.round(numRate * 0.2 * extraGuests * nights);
}

/**
 * Tính tổng tiền booking bao gồm phụ phí số người.
 * @param {number} rate - Giá phòng mỗi đêm
 * @param {number} nights - Số đêm
 * @param {number} totalGuests - Tổng số khách
 * @param {number} baseOccupancy - Sức chứa cơ bản (mặc định 2)
 * @returns {{ base: number, surcharge: number, total: number }}
 */
export function calculateTotalWithSurcharge(rate, nights, totalGuests, baseOccupancy = 2) {
  const base = calculateBookingPrice(rate, nights);
  const surcharge = calculateOccupancySurcharge(rate, nights, totalGuests, baseOccupancy);
  return { base, surcharge, total: base + surcharge };
}
