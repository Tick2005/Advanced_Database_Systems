import { useEffect, useMemo, useState } from "react";
import RoomCard from "../RoomCard";
import { roomService } from "../roomService";
import { branchService } from "../../branches/branchService";
import { serviceService } from "../../services/serviceService";
import { feedbackService } from "../../feedback/feedbackService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";
import { formatStatus } from "../../../services/presenters";
import { useApiQuery } from "../../../hooks/useApiQuery";
import { queryKeys } from "../../../services/queryKeys";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue";
import { applyRoomFilters, sortRooms } from "../roomFilters";
import { loadLocationFromStorage, sortRoomsByProximityAndRating } from "../../../services/geo";

export default function RoomList({ customer = false }) {
  const [filters, setFilters] = useState({
    keyword: "",
    city: "",
    status: "",
    minPrice: "",
    maxPrice: "",
    occupancy: "",
    serviceId: ""
  });
  const [sortBy, setSortBy] = useState("featured");
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [userLocation] = useState(() => loadLocationFromStorage());

  const roomsQuery = useApiQuery({
    queryKey: queryKeys.rooms(),
    queryFn: () => roomService.getRooms(),
    staleTime: 60 * 1000
  });

  const branchesQuery = useApiQuery({
    queryKey: queryKeys.branches,
    queryFn: () => branchService.getBranches(),
    staleTime: 60 * 1000
  });

  const servicesQuery = useApiQuery({
    queryKey: queryKeys.services,
    queryFn: () => serviceService.getServices(),
    staleTime: 60 * 1000
  });

  const rooms = roomsQuery.data || [];
  const branches = branchesQuery.data || [];
  const services = servicesQuery.data || [];
  const roomIds = useMemo(() => [...new Set(rooms.map((room) => room.id).filter(Boolean))], [rooms]);
  const roomFeedbackSummaryQ = useApiQuery({
    queryKey: ["room-list-feedback-summary", roomIds.join(",")],
    queryFn: () => feedbackService.getRoomFeedbackSummaries(roomIds),
    staleTime: 60 * 1000,
    enabled: roomIds.length > 0,
  });
  const debouncedFilters = useDebouncedValue(filters, 250);
  const roomFeedbackSummaryMap = useMemo(() => {
    const entries = roomFeedbackSummaryQ.data || [];
    return entries.reduce((acc, item) => {
      if (item?.roomId) {
        acc[item.roomId] = {
          averageRating: Number(item.averageRating || 0),
          reviewCount: Number(item.reviewCount || 0),
        };
      }
      return acc;
    }, {});
  }, [roomFeedbackSummaryQ.data]);
  const roomsWithFeedback = useMemo(() => {
    return rooms.map((room) => {
      const summary = roomFeedbackSummaryMap[room.id];
      return {
        ...room,
        averageRating: summary?.averageRating ?? Number(room.averageRating || 0),
        reviewCount: summary?.reviewCount ?? Number(room.reviewCount || 0),
      };
    });
  }, [rooms, roomFeedbackSummaryMap]);

  const filtered = useMemo(() => {
    const nextRooms = applyRoomFilters(roomsWithFeedback, debouncedFilters);
    if (sortBy === "featured") {
      return sortRoomsByProximityAndRating(nextRooms, branches, userLocation);
    }
    return sortRooms(nextRooms, sortBy);
  }, [roomsWithFeedback, branches, userLocation, debouncedFilters, sortBy]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, sortBy]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const uniqueCities = useMemo(() => [...new Set(rooms.map((room) => room.branchCity).filter(Boolean))], [rooms]);
  const uniqueStatuses = useMemo(() => [...new Set(rooms.map((room) => room.status).filter(Boolean))], [rooms]);

  const onFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  if (roomsQuery.isLoading || branchesQuery.isLoading) return <LoadingState text="Dang tai danh sach phong..." />;
  if (roomsQuery.error) {
    return <ErrorState message={roomsQuery.error.message || "Khong the tai danh sach phong"} onRetry={roomsQuery.refetch} />;
  }
  if (branchesQuery.error) {
    return <ErrorState message={branchesQuery.error.message || "Khong the tai chi nhanh"} onRetry={branchesQuery.refetch} />;
  }

  return (
    <section className="container page-shell">
      <div className="page-heading">
        <h1>Tất cả phòng</h1>
        <p>Bộ lọc được tổ chức rõ ràng để người dùng có cảm giác như đang chọn phòng trong một resort thật.</p>
      </div>
      <div className="filters-shell">
        <aside className="card filters-panel">
          <h3>Bộ lọc</h3>
          <div className="field">
            <label>Từ khóa</label>
            <input
              value={filters.keyword}
              onChange={(event) => onFilterChange("keyword", event.target.value)}
              placeholder="Tên phòng, số phòng..."
            />
          </div>
          <div className="field">
            <label>Thành phố</label>
            <select value={filters.city} onChange={(event) => onFilterChange("city", event.target.value)}>
              <option value="">Tất cả</option>
              {uniqueCities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Trạng thái</label>
            <select value={filters.status} onChange={(event) => onFilterChange("status", event.target.value)}>
              <option value="">Tất cả</option>
              {uniqueStatuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
            </select>
          </div>
          <div className="split-panel">
            <div className="field">
              <label>Giá từ</label>
              <input type="number" min={0} value={filters.minPrice} onChange={(event) => onFilterChange("minPrice", event.target.value)} />
            </div>
            <div className="field">
              <label>Giá đến</label>
              <input type="number" min={0} value={filters.maxPrice} onChange={(event) => onFilterChange("maxPrice", event.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Sức chứa tối thiểu</label>
            <input type="number" min={0} value={filters.occupancy} onChange={(event) => onFilterChange("occupancy", event.target.value)} />
          </div>
          
          <div className="field">
            <label>Sắp xếp</label>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="featured">Nổi bật</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
              <option value="rating">Đánh giá cao nhất</option>
            </select>
          </div>
        </aside>

        <div style={{ display: "grid", gap: 16 }}>
          {filtered.length === 0 && (
            <div className="card" style={{ padding: 16 }}>
              Không có phòng phù hợp với bộ lọc hiện tại.
            </div>
          )}
          <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))" }}>
            {paginated.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                detailPath={customer ? PATHS.CUSTOMER_ROOM_DETAIL : PATHS.ROOM_DETAIL}
                actionLabel={customer ? "Đặt phòng" : "Xem chi tiết"}
              />
            ))}
          </div>
          {filtered.length > pageSize && (
            <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 8, alignItems: "center" }}>
              <button className="btn" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>Trước</button>
              <span className="pill pill-soft">Trang {page}/{totalPages}</span>
              <button className="btn" disabled={page >= totalPages} onClick={() => setPage((prev) => prev + 1)}>Sau</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
