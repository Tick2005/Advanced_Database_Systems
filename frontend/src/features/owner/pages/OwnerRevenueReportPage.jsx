import { useEffect, useState } from "react";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";

export default function OwnerRevenueReportPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    dashboardService.getOwnerReports().then((data) => setRows(data || []));
  }, []);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>Bao cao doanh thu toan he thong</h1>
      <DataTable
        rows={rows}
        keyField="roomTypeId"
        columns={[
          { key: "roomTypeName", label: "Loai phong" },
          { key: "branchName", label: "Chi nhanh" },
          { key: "revenueQuarter", label: "Quy" },
          { key: "totalRevenue", label: "Tong doanh thu", render: (row) => <span className="mono">{row.totalRevenue}</span> },
          { key: "profitRank", label: "Xep hang" }
        ]}
      />
    </section>
  );
}
