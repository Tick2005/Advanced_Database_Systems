import React, { useState } from 'react';
import TopRooms from '../../components/modules/TopRooms';

const mockRooms = [
  { id: 1, name: "Ocean View Suite Penthouse", hotel: "Da Nang Center Hotel", loc: "Da Nang", type: "Suite", price: 4500000, rating: 4.9, img: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: 2, name: "Premium Deluxe City View", hotel: "HCM Riverside Hotel", loc: "HCM", type: "Deluxe", price: 2100000, rating: 4.8, img: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: 3, name: "Family Connecting Room", hotel: "Da Nang Center Hotel", loc: "Da Nang", type: "Family", price: 3200000, rating: 4.7, img: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: 4, name: "Executive River Suite", hotel: "HCM Riverside Hotel", loc: "HCM", type: "Suite", price: 3800000, rating: 4.9, img: "https://images.pexels.com/photos/261395/pexels-photo-261395.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: 5, name: "Standard Twin Room", hotel: "Da Nang Center Hotel", loc: "Da Nang", type: "Standard", price: 1200000, rating: 4.2, img: "https://images.pexels.com/photos/262048/pexels-photo-262048.jpeg?auto=compress&cs=tinysrgb&w=800" },
  { id: 6, name: "Presidential Suite", hotel: "HCM Riverside Hotel", loc: "HCM", type: "Suite", price: 15000000, rating: 5.0, img: "https://images.pexels.com/photos/1743226/pexels-photo-1743226.jpeg?auto=compress&cs=tinysrgb&w=800" }
];

export default function RoomList() {
  const [filterLoc, setFilterLoc] = useState('All');
  const [filterType, setFilterType] = useState('All');

  const filteredRooms = mockRooms.filter(r => 
    (filterLoc === 'All' || r.loc === filterLoc) &&
    (filterType === 'All' || r.type === filterType)
  );

  return (
    <div style={{ backgroundColor: 'var(--color-paper)', minHeight: '100vh', paddingBottom: '60px' }}>
      {/* Header Banner */}
      <div style={{ backgroundColor: 'var(--color-primary)', color: 'white', padding: '60px 20px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '42px', margin: '0 0 15px 0' }}>Tìm Phòng Hoàn Hảo Của Bạn</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
          Khám phá hệ thống phòng nghỉ sang trọng, tiện nghi cao cấp tại các thành phố lớn.
        </p>
      </div>

      <div style={{ maxWidth: 'var(--page-max)', margin: '40px auto', padding: '0 20px', display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        
        {/* Sidebar Filters */}
        <aside style={{ width: '280px', flexShrink: 0 }} className="card">
          <div style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><span>⚙️</span> Lọc kết quả</h3>
          </div>
          
          <div style={{ padding: '20px' }}>
            {/* Location */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Địa điểm</h4>
              <select 
                value={filterLoc} onChange={(e) => setFilterLoc(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--color-border)', outline: 'none' }}
              >
                <option value="All">Tất cả địa điểm</option>
                <option value="Da Nang">Đà Nẵng</option>
                <option value="HCM">Hồ Chí Minh</option>
              </select>
            </div>

            {/* Type */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Loại phòng</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['All', 'Standard', 'Deluxe', 'Family', 'Suite'].map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input 
                      type="radio" name="type" value={type} 
                      checked={filterType === type} 
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{ accentColor: 'var(--color-gold)' }}
                    />
                    {type === 'All' ? 'Tất cả loại phòng' : type}
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range (UI only) */}
            <div style={{ marginBottom: '25px' }}>
              <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Mức giá</h4>
              <input type="range" min="0" max="20000000" style={{ width: '100%', accentColor: 'var(--color-gold)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-muted)', marginTop: '5px' }}>
                <span>0đ</span>
                <span>20M+ đ</span>
              </div>
            </div>
            
            <button className="btn-gold" style={{ 
              width: '100%', padding: '12px', background: 'var(--color-gold)', 
              color: 'var(--color-primary-deep)', border: 'none', borderRadius: '4px',
              fontWeight: 'bold', cursor: 'pointer'
            }}>Áp dụng bộ lọc</button>
          </div>
        </aside>

        {/* Room List Grid */}
        <main style={{ flex: 1 }}>
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '18px' }}>Tìm thấy <strong>{filteredRooms.length}</strong> phòng phù hợp</div>
            <select style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
              <option>Sắp xếp: Giá thấp đến cao</option>
              <option>Sắp xếp: Giá cao đến thấp</option>
              <option>Sắp xếp: Đánh giá cao nhất</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
            {filteredRooms.map(room => (
              <div key={room.id} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ height: '200px' }}>
                  <img src={room.img} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-gold)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>
                    {room.type}
                  </div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>{room.name}</h3>
                  <div style={{ color: 'var(--color-muted)', fontSize: '14px', marginBottom: '15px' }}>
                    📍 {room.hotel} ({room.loc})
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>★ {room.rating}</div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: 'var(--color-primary)', fontSize: '20px', fontWeight: 'bold' }}>
                        {room.price.toLocaleString('vi-VN')}đ
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>/ đêm</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Embedded TopRooms Module */}
      <div style={{ marginTop: '60px' }}>
        <TopRooms />
      </div>
    </div>
  );
}
