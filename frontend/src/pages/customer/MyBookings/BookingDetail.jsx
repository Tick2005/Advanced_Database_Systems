import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import bookingService from '../../../services/bookingService';
import { formatVND } from '../../../utils/currency';
import { formatDate } from '../../../utils/dateTime';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR } from '../../../constants/bookingStatus';
import StatusBadge from '../../../components/ui/StatusBadge';
import Button from '../../../components/ui/Button';
import PageHeader from '../../../components/common/PageHeader';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    bookingService.getMyBookingDetail(id).then(setBooking).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy đặt phòng này?')) return;
    setCancelling(true);
    try {
      await bookingService.cancelBooking(id, 'Khách hàng yêu cầu hủy');
      setBooking(prev => ({ ...prev, status: 'CANCELLED' }));
    } catch (e) { alert(e.message); }
    finally { setCancelling(false); }
  };

  if (loading) return <p>Đang tải...</p>;
  if (!booking) return <p>Không tìm thấy đặt phòng</p>;

  return (
    <div>
      <PageHeader title="Chi tiết đặt phòng" actions={<Button variant="secondary" size="sm" onClick={() => navigate(-1)}>← Quay lại</Button>} />
      <div style={{background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)',maxWidth:640}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontFamily:'var(--font-display)'}}>Phòng {booking.roomNumber || booking.roomId}</h2>
          <StatusBadge status={booking.status} label={BOOKING_STATUS_LABEL[booking.status]} color={BOOKING_STATUS_COLOR[booking.status]} />
        </div>
        {[
          ['📅 Check-in', formatDate(booking.checkInDate)],
          ['📅 Check-out', formatDate(booking.checkOutDate)],
          ['👥 Số người', `${booking.adults} người lớn${booking.children ? `, ${booking.children} trẻ em` : ''}`],
          ['💰 Tổng tiền', formatVND(booking.totalPrice)],
          ['🏢 Chi nhánh', booking.branchId],
        ].map(([label, value]) => (
          <div key={label} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--color-border)',fontSize:14}}>
            <span style={{color:'var(--color-muted)'}}>{label}</span>
            <strong>{value || '-'}</strong>
          </div>
        ))}
        {['PENDING','CONFIRMED'].includes(booking.status) && (
          <div style={{marginTop:20,display:'flex',gap:10}}>
            <Button variant="danger" onClick={handleCancel} loading={cancelling}>Hủy đặt phòng</Button>
          </div>
        )}
      </div>
    </div>
  );
};
export default BookingDetail;
