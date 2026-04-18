import React, { useEffect, useState } from 'react';
import bookingService from '../../services/bookingService';
import { formatDate } from '../../utils/dateTime';
import { formatVND } from '../../utils/currency';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const Checkout = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    bookingService.getTodayBookings().then(d => setBookings((d||[]).filter(b=>b.status==='CHECKED_IN'))).finally(()=>setLoading(false));
  }, []);

  const handleCheckout = async (id) => {
    setProcessing(id);
    try {
      await bookingService.checkOut(id);
      setBookings(prev => prev.filter(b => b.id !== id));
      alert('Check-out thành công!');
    } catch (e) { alert(e.message); } finally { setProcessing(null); }
  };

  return (
    <div>
      <PageHeader title="Check-out" subtitle="Xử lý check-out cho khách hàng" />
      {loading ? <p>Đang tải...</p> : !bookings.length ? <p style={{color:'var(--color-muted)'}}>Không có đặt phòng cần check-out</p> : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {bookings.map(b => (
            <div key={b.id} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:'16px 20px',boxShadow:'var(--shadow-soft)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:700}}>Phòng {b.roomId}</div>
                <div style={{fontSize:13,color:'var(--color-muted)'}}>Khách: {b.customerId} · Trả phòng: {formatDate(b.checkOutDate)}</div>
                <div style={{fontSize:14,fontWeight:600,color:'var(--color-accent)',marginTop:4}}>{formatVND(b.totalPrice)}</div>
              </div>
              <Button variant="primary" size="sm" onClick={()=>handleCheckout(b.id)} loading={processing===b.id}>🚪 Check-out</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Checkout;
