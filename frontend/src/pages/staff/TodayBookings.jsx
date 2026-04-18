import React, { useEffect, useState } from 'react';
import bookingService from '../../services/bookingService';
import { formatVND } from '../../utils/currency';
import { formatDate } from '../../utils/dateTime';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR } from '../../constants/bookingStatus';
import StatusBadge from '../../components/ui/StatusBadge';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/ui/DataTable';

const TodayBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ bookingService.getTodayBookings().then(d=>setBookings(d||[])).catch(()=>{}).finally(()=>setLoading(false)); },[]);
  const columns = [
    { key:'roomId', label:'Phòng' },
    { key:'customerId', label:'Khách hàng' },
    { key:'checkInDate', label:'Check-in', render: v => formatDate(v) },
    { key:'checkOutDate', label:'Check-out', render: v => formatDate(v) },
    { key:'totalPrice', label:'Tổng tiền', render: v => formatVND(v) },
    { key:'status', label:'Trạng thái', render: v => <StatusBadge status={v} label={BOOKING_STATUS_LABEL[v]} color={BOOKING_STATUS_COLOR[v]} /> },
  ];
  return (
    <div>
      <PageHeader title="Đặt phòng hôm nay" subtitle={`${bookings.length} đặt phòng`} />
      <DataTable columns={columns} data={bookings} loading={loading} />
    </div>
  );
};
export default TodayBookings;
