export function applyRoomFilters(rooms, filters) {
  const q = (filters.keyword || "").trim().toLowerCase();
  const min = Number(filters.minPrice || 0);
  const max = Number(filters.maxPrice || 0);
  const occupancy = Number(filters.occupancy || 0);
  // roomTypeName: gom nhóm đúng — "Standard" khớp tất cả phòng Standard ở mọi branch
  const roomTypeName = (filters.roomTypeName || "").trim().toLowerCase();

  return (rooms || []).filter((room) => {
    const rate = Number(room.rate || 0);

    const keywordMatch = !q
      || (room.roomTypeName || "").toLowerCase().includes(q)
      || (room.roomNumber || "").toLowerCase().includes(q)
      || (room.branchCity || "").toLowerCase().includes(q);

    const cityMatch = !filters.city || room.branchCity === filters.city;
    const statusMatch = !filters.status || room.status === filters.status;
    const minMatch = !min || rate >= min;
    const maxMatch = !max || rate <= max;
    const occupancyMatch = !occupancy || Number(room.maxOccupancy || 0) >= occupancy;
    // So sánh theo tên loại phòng (không phân biệt hoa thường)
    const roomTypeMatch = !roomTypeName
      || (room.roomTypeName || "").toLowerCase() === roomTypeName;

    return keywordMatch && cityMatch && statusMatch && minMatch && maxMatch && occupancyMatch && roomTypeMatch;
  });
}

export function sortRooms(rooms, sortBy) {
  const sorted = [...(rooms || [])];
  if (sortBy === "price-asc") {
    sorted.sort((a, b) => Number(a.rate || 0) - Number(b.rate || 0));
  } else if (sortBy === "price-desc") {
    sorted.sort((a, b) => Number(b.rate || 0) - Number(a.rate || 0));
  } else if (sortBy === "rating") {
    sorted.sort((a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0));
  }
  return sorted;
}
