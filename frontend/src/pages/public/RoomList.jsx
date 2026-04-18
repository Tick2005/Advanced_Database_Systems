import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import roomService from '../../services/roomService';
import { formatVND } from '../../utils/currency';
import './RoomList.css';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    roomService.getPublicRooms().then(d => setRooms(d || [])).finally(() => setLoading(false));
  }, []);

  const filtered = rooms.filter(r =>
    !search || r.roomNumber?.toLowerCase().includes(search.toLowerCase()) ||
    r.roomType?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="room-list-page">
      <div className="room-list-inner">
        <div className="room-list-header">
          <h1>Danh sách phòng</h1>
          <input className="room-search" placeholder="🔍 Tìm kiếm phòng..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? <div style={{textAlign:'center',padding:60,color:'var(--color-muted)'}}>Đang tải...</div> :
         !filtered.length ? <div style={{textAlign:'center',padding:60,color:'var(--color-muted)'}}>Không tìm thấy phòng nào</div> : (
          <div className="rooms-grid">
            {filtered.map(room => (
              <Link to={`/rooms/${room.id}`} key={room.id} className="room-card">
                <div className="room-img-wrap">
                  <img src={room.imageUrls?.[0]} alt={room.roomNumber} onError={e => e.target.src='https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'} />
                </div>
                <div className="room-info">
                  <h3>Phòng {room.roomNumber}</h3>
                  <p>{room.roomType?.name} · Tầng {room.floor} · {room.capacity} người</p>
                  <div className="room-footer">
                    <span className="room-price">{formatVND(room.currentPrice)}<small>/đêm</small></span>
                    <span className={`room-status room-status--${room.status?.toLowerCase()}`}>{room.status === 'AVAILABLE' ? 'Còn trống' : 'Đã đặt'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default RoomList;
