import React from 'react';

const mockRooms = [
  {
    id: 1,
    name: "Ocean View Suite Penthouse",
    hotel: "Da Nang Center Hotel",
    location: "Da Nang, Vietnam",
    rating: 4.9,
    reviews: 120,
    price: "4.500.000đ",
    image: "https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg?auto=compress&cs=tinysrgb&w=800",
    isBestSeller: true
  },
  {
    id: 2,
    name: "Premium Deluxe City View",
    hotel: "HCM Riverside Hotel",
    location: "Ho Chi Minh City",
    rating: 4.8,
    reviews: 85,
    price: "2.100.000đ",
    image: "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=800",
    isBestSeller: false
  },
  {
    id: 3,
    name: "Family Connecting Room",
    hotel: "Da Nang Center Hotel",
    location: "Da Nang, Vietnam",
    rating: 4.7,
    reviews: 230,
    price: "3.200.000đ",
    image: "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800",
    isBestSeller: true
  },
  {
    id: 4,
    name: "Executive River Suite",
    hotel: "HCM Riverside Hotel",
    location: "Ho Chi Minh City",
    rating: 4.9,
    reviews: 50,
    price: "3.800.000đ",
    image: "https://images.pexels.com/photos/261395/pexels-photo-261395.jpeg?auto=compress&cs=tinysrgb&w=800",
    isBestSeller: false
  }
];

export default function TopRooms() {
  return (
    <section style={{ padding: '80px 20px', backgroundColor: 'var(--color-paper)' }}>
      <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '36px', color: 'var(--color-primary)', margin: '0 0 15px 0' }}>Phòng Nổi Bật</h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
            Trải nghiệm không gian nghỉ dưỡng đẳng cấp được yêu thích nhất bởi khách hàng của LuxStay.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          {mockRooms.map(room => (
            <div key={room.id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.3s' }}>
              <div style={{ position: 'relative', height: '220px' }}>
                <img src={room.image} alt={room.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {room.isBestSeller && (
                  <div style={{ position: 'absolute', top: '15px', left: '15px', backgroundColor: 'var(--color-gold)', color: 'var(--color-primary-deep)', padding: '5px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Best Seller
                  </div>
                )}
              </div>
              
              <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '20px', color: 'var(--color-primary-deep)', fontFamily: 'var(--font-heading)' }}>{room.name}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-muted)', fontSize: '14px', marginBottom: '15px' }}>
                  <span>📍</span> {room.hotel} - {room.location}
                </div>
                
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '15px' }}>
                  <div>
                    <div style={{ color: 'var(--color-gold)', fontWeight: 'bold', fontSize: '16px' }}>
                      ★ {room.rating} <span style={{ color: 'var(--color-muted)', fontWeight: 'normal', fontSize: '14px' }}>({room.reviews} đánh giá)</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>Từ</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--color-primary)' }}>{room.price}</div>
                  </div>
                </div>

                <button style={{ 
                  marginTop: '20px', width: '100%', padding: '12px', 
                  backgroundColor: 'white', color: 'var(--color-gold-deep)', 
                  border: '1px solid var(--color-gold)', borderRadius: 'var(--radius-sm)',
                  fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-gold)'; e.currentTarget.style.color = 'white'; }}
                onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = 'var(--color-gold-deep)'; }}
                >
                  Xem phòng →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
