import { useEffect, useMemo, useState } from "react";
import RoomCard from "../RoomCard";
import { roomService } from "../roomService";
import LoadingState from "../../../components/common/LoadingState";
import ErrorState from "../../../components/common/ErrorState";
import { PATHS } from "../../../routes/pathConstants";
import { formatStatus } from "../../../services/presenters";

export default function RoomList({ customer = false }) {
  const [rooms, setRooms] = useState([]);
  const [filters, setFilters] = useState({
    keyword: "",
    city: "",
    status: "",
    minPrice: "",
    maxPrice: "",
    occupancy: ""
  });
  const [sortBy, setSortBy] = useState("featured");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pageSize = 6;

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      setRooms((await roomService.getRooms()) || []);
    } catch (err) {
      setError(err.message || "Khong the tai danh sach phong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const q = filters.keyword.trim().toLowerCase();
    const min = Number(filters.minPrice || 0);
    const max = Number(filters.maxPrice || 0);
    const occupancy = Number(filters.occupancy || 0);

    const filteredData = rooms.filter((r) => {
      const rate = Number(r.rate || 0);
      const keywordMatch = !q
        || (r.roomTypeName || "").toLowerCase().includes(q)
        || (r.roomNumber || "").toLowerCase().includes(q)
        || (r.branchCity || "").toLowerCase().includes(q);
      const cityMatch = !filters.city || r.branchCity === filters.city;
      const statusMatch = !filters.status || r.status === filters.status;
      const minMatch = !min || rate >= min;
      const maxMatch = !max || rate <= max;
      const occupancyMatch = !occupancy || Number(r.maxOccupancy || 0) >= occupancy;

      return keywordMatch && cityMatch && statusMatch && minMatch && maxMatch && occupancyMatch;
    });

    if (sortBy === "price-asc") {
      filteredData.sort((a, b) => Number(a.rate || 0) - Number(b.rate || 0));
    } else if (sortBy === "price-desc") {
      filteredData.sort((a, b) => Number(b.rate || 0) - Number(a.rate || 0));
    } else if (sortBy === "rating") {
      filteredData.sort((a, b) => Number(b.averageRating || 0) - Number(a.averageRating || 0));
    }

    return filteredData;
  }, [rooms, filters, sortBy]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [filters, sortBy]);

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

  if (loading) return <LoadingState text="Dang tai danh sach phong..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

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
