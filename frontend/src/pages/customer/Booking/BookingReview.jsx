import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bookingService from '../../../services/bookingService';
import { formatVND } from '../../../utils/currency';
import { formatDate } from '../../../utils/dateTime';
import Button from '../../../components/ui/Button';
import PageHeader from '../../../components/common/PageHeader';
import { useState } from 'react';

const BookingReview = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { form, room } = state || {};
  const [loading, setLoading] = useState(false);

  if (!form) return <div onClick={() => navigate('/customer/booking/create')}>Quay lại đặt phòng</div>;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await bookingService.createBooking(form);
      navigate('/customer/booking/success', { state: { booking: res } });
    } catch (e) {
      alert(e.message || 'Đặt phòng thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Xác nhận đặt phòng" />
      <div style={{maxWidth:560,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <h2 style={{fontFamily:'var(--font-display)',marginBottom:20}}>Thông tin đặt phòng</h2>
        {[
          ['🏠 Phòng', room ? `Phòng ${room.roomNumber} - ${room.roomType?.name}` : form.roomId],
          ['📅 Check-in', formatDate(form.checkInDate)],
          ['📅 Check-out', formatDate(form.checkOutDate)],
          ['👥 Số người', `${form.adults} người lớn${form.children ? `, ${form.children} trẻ em` : ''}`],
          ['💰 Tổng tiền', formatVND(form.totalPrice)],
        ].map(([l,v]) => (
          <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--color-border)',fontSize:14}}>
            <span style={{color:'var(--color-muted)'}}>{l}</span>
            <strong>{v}</strong>
          </div>
        ))}
        <div style={{display:'flex',gap:12,marginTop:24}}>
          <Button variant="secondary" onClick={() => navigate(-1)}>← Quay lại</Button>
          <Button variant="primary" loading={loading} onClick={handleConfirm} style={{flex:1}}>✅ Xác nhận đặt phòng</Button>
        </div>
      </div>
    </div>
  );
};
export default BookingReview;
