import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";
import StatusBadge from "../../../components/common/StatusBadge";
import PaginationBar from "../../../components/common/PaginationBar";
import { PATHS } from "../../../routes/pathConstants";

const PAGE_SIZE = 8;

export default function ManagerBookingsPage() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dashboardService.getManagerBookings().then((data) => {
      setRows(data || []);
    });
  }, []);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginated = useMemo(() => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [rows, page]);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Booking chi nhanh</h1>
      <DataTable
        rows={paginated}
        columns={[
          { key: "id", label: "Booking" },
          { key: "roomId", label: "Room" },
          { key: "checkInDate", label: "Check-in" },
          { key: "checkOutDate", label: "Check-out" },
          { key: "status", label: "Trang thai", render: (row) => <StatusBadge value={row.status} /> }
        ]}
        renderActions={(row) => (
          <Link className="btn" style={{ border: "1px solid #cbd5e1", background: "white", padding: "6px 10px" }} to={PATHS.MANAGER_BOOKINGS_DETAIL.replace(":id", row.id)}>Chi tiet</Link>
        )}
      />
      <PaginationBar page={page} totalPages={totalPages} onChange={setPage} />
    </section>
  );
}
