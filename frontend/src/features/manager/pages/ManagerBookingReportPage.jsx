import { useEffect, useMemo, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";

export default function ManagerBookingReportPage() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    dashboardService.getManagerBookings().then((data) => setBookings(data || []));
  }, []);

  const statusRows = useMemo(() => {
    const counts = {};
    bookings.forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }, [bookings]);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Bao cao booking theo trang thai</h1>
      <DataTable
        rows={statusRows}
        keyField="status"
        columns={[
          { key: "status", label: "Trang thai" },
          { key: "count", label: "So luong" }
        ]}
      />
    </section>
  );
}
