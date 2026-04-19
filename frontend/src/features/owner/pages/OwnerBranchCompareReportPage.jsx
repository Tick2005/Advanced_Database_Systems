import { useEffect, useMemo, useState } from "react";
import { branchService } from "../../branches/branchService";
import { dashboardService } from "../../dashboard/dashboardService";
import DataTable from "../../../components/common/DataTable";

export default function OwnerBranchCompareReportPage() {
  const [branches, setBranches] = useState([]);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    Promise.all([
      branchService.getBranches(),
      dashboardService.getOwnerReports()
    ]).then(([branchData, reportData]) => {
      setBranches(branchData || []);
      setReports(reportData || []);
    });
  }, []);

  const rows = useMemo(() => {
    const map = new Map();

    branches.forEach((branch) => {
      map.set(branch.name, { branchName: branch.name, city: branch.city, totalRevenue: 0, reportLines: 0 });
    });

    reports.forEach((item) => {
      const key = item.branchName || "Unknown";
      const prev = map.get(key) || { branchName: key, city: "-", totalRevenue: 0, reportLines: 0 };
      prev.totalRevenue += Number(item.totalRevenue || 0);
      prev.reportLines += 1;
      map.set(key, prev);
    });

    return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [branches, reports]);

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <h1 style={{ margin: 0 }}>So sanh chi nhanh</h1>
      <DataTable
        rows={rows}
        keyField="branchName"
        columns={[
          { key: "branchName", label: "Chi nhanh" },
          { key: "city", label: "Thanh pho" },
          { key: "reportLines", label: "So dong du lieu" },
          { key: "totalRevenue", label: "Tong doanh thu", render: (row) => <span className="mono">{row.totalRevenue}</span> }
        ]}
      />
    </section>
  );
}
