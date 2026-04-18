import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import paymentService from '../../../services/paymentService';
import Button from '../../../components/ui/Button';
import { formatVND } from '../../../utils/currency';

const BookingPayment = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const booking = state?.booking;
  const [loading, setLoading] = useState(false);

  if (!booking) return <div style={{padding:40}}>Không có thông tin đặt phòng</div>;

  const handleVNPay = async () => {
    setLoading(true);
    try {
      const res = await paymentService.createVNPayCheckout({ bookingId: booking.id, amount: booking.totalPrice, returnUrl: window.location.origin + '/customer/bookings' });
      if (res?.paymentUrl) window.location.href = res.paymentUrl;
    } catch (e) { alert(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{maxWidth:480,margin:'0 auto'}}>
      <h1 style={{fontFamily:'var(--font-display)',marginBottom:24}}>Thanh toán</h1>
      <div style={{background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)',marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:16}}>
          <span>Tổng tiền</span><strong style={{fontSize:20,color:'var(--color-accent)'}}>{formatVND(booking.totalPrice)}</strong>
        </div>
        <Button variant="primary" size="lg" style={{width:'100%'}} loading={loading} onClick={handleVNPay}>Thanh toán qua VNPay</Button>
        <Button variant="secondary" size="lg" style={{width:'100%',marginTop:10}} onClick={() => navigate('/customer/bookings')}>Thanh toán sau</Button>
      </div>
    </div>
  );
};
export default BookingPayment;
