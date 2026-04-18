import React, { useEffect, useState } from 'react';
import bookingService from '../../../services/bookingService';
import { formatVND } from '../../../utils/currency';
import { formatDate } from '../../../utils/dateTime';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR } from '../../../constants/bookingStatus';
import StatusBadge from '../../../components/ui/StatusBadge';

const BookingReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ bookingService.getManagerBookings().then(d=>setData(d||[])).finally(()=>setLoading(false)); },[]);
  const totalRevenue = data.filter(b=>b.status==='CHECKED_OUT').reduce((s,b)=>s+(b.totalPrice||0),0);
  const columns = [
    { key:'id', label:'Mã ĐP', render: v=>v?.slice(-8) },
    { key:'roomId', label:'Phòng' },
    { key:'checkInDate', label:'Check-in', render: v=>formatDate(v) },
    { key:'checkOutDate', label:'Check-out', render: v=>formatDate(v) },
    { key:'totalPrice', label:'Tổng tiền', render: v=>formatVND(v) },
    { key:'status', label:'Trạng thái', render: v=><StatusBadge status={v} label={BOOKING_STATUS_LABEL[v]} color={BOOKING_STATUS_COLOR[v]} /> },
  ];
  return (
    <div>
      <PageHeader title="Báo cáo đặt phòng" subtitle={`${data.length} đặt phòng · Doanh thu: ${formatVND(totalRevenue)}`} />
      <DataTable columns={columns} data={data} loading={loading} />
    </div>
  );
};
export default BookingReport;
