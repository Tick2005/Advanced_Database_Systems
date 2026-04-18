import React, { useEffect, useState } from 'react';
import reportService from '../../../services/reportService';
import { formatVND } from '../../../utils/currency';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/ui/DataTable';

const RevenueReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ reportService.getTopRoomTypes().then(d=>setData(d||[])).finally(()=>setLoading(false)); },[]);
  const columns = [
    { key:'roomTypeId', label:'Loại phòng' },
    { key:'roomTypeName', label:'Tên' },
    { key:'totalRevenue', label:'Doanh thu', render: v=>formatVND(v) },
    { key:'totalBookings', label:'Tổng đặt phòng' },
    { key:'averageOccupancy', label:'Tỷ lệ lấp đầy', render: v=>v?`${(v*100).toFixed(1)}%`:'-' },
  ];
  return (
    <div>
      <PageHeader title="Báo cáo doanh thu" subtitle="Top loại phòng theo doanh thu" />
      <DataTable columns={columns} data={data} loading={loading} emptyText="Không có dữ liệu báo cáo" />
    </div>
  );
};
export default RevenueReport;
