import React, { useEffect, useState } from 'react';
import reportService from '../../../services/reportService';
import { formatVND } from '../../../utils/currency';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/ui/DataTable';

const GlobalRevenue = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ reportService.getOwnerReports().then(d=>setData(d||[])).finally(()=>setLoading(false)); },[]);
  const total = data.reduce((s,d)=>s+(d.totalRevenue||0),0);
  const columns = [
    { key:'roomTypeName', label:'Loại phòng' },
    { key:'totalRevenue', label:'Doanh thu', render: v=>formatVND(v) },
    { key:'totalBookings', label:'Số đặt phòng' },
    { key:'averageOccupancy', label:'Tỷ lệ lấp đầy', render: v=>v?`${(v*100).toFixed(1)}%`:'-' },
  ];
  return (
    <div>
      <PageHeader title="Báo cáo doanh thu tổng" subtitle={`Tổng doanh thu: ${formatVND(total)}`} />
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
};
export default GlobalRevenue;
