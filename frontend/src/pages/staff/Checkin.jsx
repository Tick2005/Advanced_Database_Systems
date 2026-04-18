import React, { useEffect, useState } from 'react';
import bookingService from '../../services/bookingService';
import { formatDate } from '../../utils/dateTime';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';

const Checkin = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    bookingService.getTodayBookings().then(d => setBookings((d||[]).filter(b=>b.status==='CONFIRMED'))).finally(()=>setLoading(false));
  }, []);

  const handleCheckin = async (id) => {
    setProcessing(id);
    try {
      await bookingService.checkIn(id);
      setBookings(prev => prev.filter(b => b.id !== id));
      alert('Check-in thành công!');
    } catch (e) { alert(e.message); } finally { setProcessing(null); }
  };

  return (
    <div>
      <PageHeader title="Check-in" subtitle="Xử lý check-in cho khách hàng" />
      {loading ? <p>Đang tải...</p> : !bookings.length ? <p style={{color:'var(--color-muted)'}}>Không có đặt phòng cần check-in</p> : (
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {bookings.map(b => (
            <div key={b.id} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:'16px 20px',boxShadow:'var(--shadow-soft)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:700}}>Phòng {b.roomId}</div>
                <div style={{fontSize:13,color:'var(--color-muted)'}}>Khách: {b.customerId} · {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}</div>
              </div>
              <Button variant="success" size="sm" onClick={()=>handleCheckin(b.id)} loading={processing===b.id}>✅ Check-in</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Checkin;
