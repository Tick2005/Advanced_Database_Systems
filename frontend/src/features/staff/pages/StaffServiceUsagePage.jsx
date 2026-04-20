import { Link } from "react-router-dom";
import { PATHS } from "../../../routes/pathConstants";

export default function StaffServiceUsagePage() {
  return (
    <section style={{ display: "grid", gap: 14 }}>
      <h1 style={{ margin: 0 }}>Dịch vụ booking và walk-in</h1>
      <article className="card" style={{ padding: 18, display: "grid", gap: 12 }}>
        <p style={{ margin: 0, color: "#475569" }}>
          Luồng tạo walk-in và thêm dịch vụ đã được gộp vào trang Booking hôm nay để thao tác theo popup ngay trên bảng dữ liệu.
        </p>
        <div>
          <Link className="btn btn-gold" to={PATHS.STAFF_BOOKINGS_TODAY}>Đi tới Booking hôm nay</Link>
        </div>
      </article>
    </section>
  );
}
