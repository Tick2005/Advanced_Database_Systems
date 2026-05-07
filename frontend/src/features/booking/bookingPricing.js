export function calculateNights(checkInDate, checkOutDate) {
  if (!checkInDate || !checkOutDate) return 0;
  const from = new Date(checkInDate);
  const to = new Date(checkOutDate);
  return Math.max(0, Math.round((to - from) / (1000 * 60 * 60 * 24)));
}

export function calculateBookingPrice(rate, nights) {
  if (!rate || nights <= 0) return 0;
  return Number(rate) * nights;
}
