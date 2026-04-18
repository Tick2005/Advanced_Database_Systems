import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import roomService from '../../services/roomService';
import { formatVND } from '../../utils/currency';
import './Home.css';

const Home = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    roomService.getPublicRooms().then(d => setRooms((d || []).slice(0, 6))).finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <h1>Trải nghiệm lưu trú <span className="hero-highlight">đẳng cấp</span></h1>
          <p>Hàng trăm phòng chất lượng cao, dịch vụ 5 sao, vị trí đắc địa</p>
          <div className="hero-actions">
            <button className="hero-btn-primary" onClick={() => navigate('/rooms')}>Xem tất cả phòng</button>
            <button className="hero-btn-outline" onClick={() => navigate('/login')}>Đặt phòng ngay</button>
          </div>
        </div>
        <div className="hero-stats">
          {[['500+','Phòng chất lượng'],['50+','Chi nhánh'],['10k+','Khách hàng hài lòng'],['5⭐','Đánh giá']].map(([n,l]) => (
            <div key={l} className="hero-stat"><span className="stat-num">{n}</span><span className="stat-label">{l}</span></div>
          ))}
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="home-section">
        <div className="home-section-inner">
          <h2 className="section-heading">Phòng nổi bật</h2>
          {loading ? (
            <div className="rooms-loading">Đang tải...</div>
          ) : (
            <div className="rooms-grid">
              {rooms.map(room => (
                <Link to={`/rooms/${room.id}`} key={room.id} className="room-card">
                  <div className="room-img-wrap">
                    <img src={room.imageUrls?.[0] || '/placeholder-room.jpg'} alt={room.roomNumber} onError={e => e.target.src='https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'} />
                  </div>
                  <div className="room-info">
                    <h3>Phòng {room.roomNumber}</h3>
                    <p>{room.roomType?.name || 'Phòng tiêu chuẩn'} · Tầng {room.floor}</p>
                    <div className="room-footer">
                      <span className="room-price">{formatVND(room.currentPrice)}<small>/đêm</small></span>
                      <span className={`room-status room-status--${room.status?.toLowerCase()}`}>{room.status === 'AVAILABLE' ? 'Còn trống' : 'Đã đặt'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div style={{textAlign:'center',marginTop:32}}>
            <Link to="/rooms" className="see-all-btn">Xem tất cả phòng →</Link>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="home-section home-section--alt">
        <div className="home-section-inner">
          <h2 className="section-heading">Tại sao chọn LuxStay?</h2>
          <div className="features-grid">
            {[
              ['🛎️','Dịch vụ 24/7','Đội ngũ phục vụ chuyên nghiệp sẵn sàng hỗ trợ bất kỳ lúc nào'],
              ['💳','Thanh toán an toàn','Hỗ trợ VNPay và nhiều phương thức thanh toán bảo mật'],
              ['🌟','Phòng chất lượng cao','Thiết kế hiện đại, nội thất sang trọng, đầy đủ tiện nghi'],
              ['📱','Đặt phòng dễ dàng','Đặt phòng nhanh chóng chỉ trong vài bước trên website'],
            ].map(([icon,title,desc]) => (
              <div key={title} className="feature-card">
                <div className="feature-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
export default Home;
