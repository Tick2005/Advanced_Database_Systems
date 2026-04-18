import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '../../../services/bookingService';
import { formatVND } from '../../../utils/currency';
import { formatDate } from '../../../utils/dateTime';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR } from '../../../constants/bookingStatus';
import StatusBadge from '../../../components/ui/StatusBadge';
import PageHeader from '../../../components/common/PageHeader';
import EmptyState from '../../../components/common/EmptyState';

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingService.getMyBookings().then(d => setBookings(d || [])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Đặt phòng của tôi" subtitle={`${bookings.length} đặt phòng`} />
      {loading ? <p>Đang tải...</p> :
       !bookings.length ? <EmptyState icon="📋" title="Chưa có đặt phòng nào" description="Hãy đặt phòng đầu tiên của bạn!" action={<Link to="/customer/booking/create" style={{padding:'10px 20px',background:'var(--color-accent)',color:'#fff',borderRadius:'var(--radius-sm)',fontWeight:600}}>Đặt phòng ngay</Link>} /> : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {bookings.map(b => (
            <Link key={b.id} to={`/customer/bookings/${b.id}`} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:'16px 20px',boxShadow:'var(--shadow-soft)',display:'flex',justifyContent:'space-between',alignItems:'center',gap:16}}>
              <div>
                <div style={{fontWeight:700,marginBottom:4}}>Phòng {b.roomNumber || b.roomId}</div>
                <div style={{fontSize:13,color:'var(--color-muted)'}}>Check-in: {formatDate(b.checkInDate)} · Check-out: {formatDate(b.checkOutDate)}</div>
                <div style={{fontSize:13,color:'var(--color-muted)',marginTop:2}}>{b.adults} người lớn{b.children ? `, ${b.children} trẻ em` : ''}</div>
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <div style={{fontWeight:700,fontSize:16,color:'var(--color-accent)',marginBottom:6}}>{formatVND(b.totalPrice)}</div>
                <StatusBadge status={b.status} label={BOOKING_STATUS_LABEL[b.status]} color={BOOKING_STATUS_COLOR[b.status]} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
export default BookingList;
