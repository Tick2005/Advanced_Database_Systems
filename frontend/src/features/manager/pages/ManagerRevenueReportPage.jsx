import { useEffect, useMemo, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";

export default function ManagerRevenueReportPage() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    dashboardService.getManagerBookings().then((data) => setBookings(data || []));
  }, []);

  const revenueRows = useMemo(() => {
    const map = new Map();
    bookings.forEach((item) => {
      const key = item.roomId || "UNKNOWN";
      const prev = map.get(key) || { roomId: key, bookingCount: 0, totalRevenue: 0 };
      prev.bookingCount += 1;
      prev.totalRevenue += Number(item.totalPrice || 0);
      map.set(key, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [bookings]);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Bao cao doanh thu theo phong</h1>
      <DataTable
        rows={revenueRows}
        columns={[
          { key: "roomId", label: "Room ID" },
          { key: "bookingCount", label: "So booking" },
          { key: "totalRevenue", label: "Tong doanh thu", render: (row) => <span className="mono">{row.totalRevenue}</span> }
        ]}
      />
    </section>
  );
}
