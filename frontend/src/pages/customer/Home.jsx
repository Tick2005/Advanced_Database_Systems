import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import bookingService from '../../services/bookingService';
import { formatVND } from '../../utils/currency';
import { formatDate } from '../../utils/dateTime';
import { BOOKING_STATUS_LABEL, BOOKING_STATUS_COLOR } from '../../constants/bookingStatus';
import StatusBadge from '../../components/ui/StatusBadge';
import './CustomerHome.css';

const CustomerHome = () => {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    bookingService.getMyBookings().then(d => setBookings((d || []).slice(0,3))).catch(() => {});
  }, []);

  return (
    <div className="ch-page">
      <div className="ch-hero">
        <h1>Xin chào, {auth?.fullName || auth?.email}! 👋</h1>
        <p>Quản lý đặt phòng và trải nghiệm lưu trú của bạn</p>
        <button onClick={() => navigate('/customer/booking/create')} className="ch-cta">🛎️ Đặt phòng mới</button>
      </div>
      <div className="ch-grid">
        {[
          {icon:'🔍',label:'Tìm phòng',to:'/customer/search',desc:'Tìm phòng phù hợp'},
          {icon:'📋',label:'Đặt phòng của tôi',to:'/customer/bookings',desc:'Xem lịch sử đặt phòng'},
          {icon:'💬',label:'Đánh giá',to:'/customer/feedbacks',desc:'Xem đánh giá của tôi'},
          {icon:'👤',label:'Hồ sơ',to:'/customer/profile',desc:'Cập nhật thông tin cá nhân'},
        ].map(item => (
          <Link key={item.to} to={item.to} className="ch-quick-card">
            <span className="ch-qc-icon">{item.icon}</span>
            <span className="ch-qc-label">{item.label}</span>
            <span className="ch-qc-desc">{item.desc}</span>
          </Link>
        ))}
      </div>
      {bookings.length > 0 && (
        <div className="ch-recent">
          <div className="ch-section-header">
            <h2>Đặt phòng gần đây</h2>
            <Link to="/customer/bookings">Xem tất cả →</Link>
          </div>
          {bookings.map(b => (
            <Link key={b.id} to={`/customer/bookings/${b.id}`} className="ch-booking-item">
              <div>
                <strong>Phòng {b.roomNumber || b.roomId}</strong>
                <p>{formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}</p>
              </div>
              <div style={{textAlign:'right'}}>
                <div>{formatVND(b.totalPrice)}</div>
                <StatusBadge status={b.status} label={BOOKING_STATUS_LABEL[b.status]} color={BOOKING_STATUS_COLOR[b.status]} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
export default CustomerHome;
