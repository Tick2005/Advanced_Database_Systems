import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { formatVND } from '../../../utils/currency';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const booking = state?.booking;
  return (
    <div style={{textAlign:'center',padding:'60px 20px',maxWidth:480,margin:'0 auto'}}>
      <div style={{fontSize:64,marginBottom:16}}>🎉</div>
      <h1 style={{fontFamily:'var(--font-display)',fontSize:28,marginBottom:12}}>Đặt phòng thành công!</h1>
      <p style={{color:'var(--color-muted)',marginBottom:24}}>Chúng tôi đã nhận đặt phòng của bạn và sẽ liên hệ sớm để xác nhận.</p>
      {booking && <div style={{background:'var(--color-accent-light)',borderRadius:'var(--radius-md)',padding:'16px 20px',marginBottom:24,textAlign:'left'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <span>Mã đặt phòng:</span><strong>{booking.id}</strong>
        </div>
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <span>Tổng tiền:</span><strong style={{color:'var(--color-accent)'}}>{formatVND(booking.totalPrice)}</strong>
        </div>
      </div>}
      <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
        <button style={{padding:'10px 24px',background:'var(--color-accent)',color:'#fff',border:'none',borderRadius:'var(--radius-sm)',fontWeight:600,cursor:'pointer'}} onClick={() => navigate('/customer/bookings')}>Xem đặt phòng</button>
        <button style={{padding:'10px 24px',background:'var(--color-border)',border:'none',borderRadius:'var(--radius-sm)',fontWeight:600,cursor:'pointer'}} onClick={() => navigate('/customer')}>Về trang chủ</button>
      </div>
    </div>
  );
};
export default BookingSuccess;
