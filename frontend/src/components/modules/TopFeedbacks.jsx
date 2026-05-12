import React from 'react';

const mockFeedbacks = [
  {
    id: 1,
    name: "Nguyễn Văn A",
    avatar: "https://i.pravatar.cc/150?u=1",
    rating: 5,
    date: "12/05/2026",
    content: "Phòng rất sạch sẽ, view biển tuyệt đẹp. Nhân viên thân thiện và hỗ trợ nhanh chóng. Chắc chắn sẽ quay lại lần sau!"
  },
  {
    id: 2,
    name: "Trần Thị B",
    avatar: "https://i.pravatar.cc/150?u=2",
    rating: 5,
    date: "10/05/2026",
    content: "Trải nghiệm 5 sao thực sự. Check-in nhanh chỉ 5 phút, phòng chuẩn bị sẵn hoa tươi và trái cây theo yêu cầu. Tuyệt vời!"
  },
  {
    id: 3,
    name: "Lê Văn C",
    avatar: "https://i.pravatar.cc/150?u=3",
    rating: 5,
    date: "05/05/2026",
    content: "Suite penthouse tuyệt đỉnh! Jacuzzi ngoài ban công với view thành phố ban đêm không thể chê. Xứng đáng từng đồng."
  }
];

export default function TopFeedbacks() {
  return (
    <section style={{ backgroundColor: 'var(--color-primary-deep)', padding: '60px 20px', color: 'white' }}>
      <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
          <div>
            <h2 style={{ color: 'var(--color-gold)', margin: 0, fontSize: '32px' }}>Khách hàng nói gì</h2>
            <p style={{ color: 'var(--color-muted)', marginTop: '10px' }}>Top phản hồi nổi bật từ những vị khách tuyệt vời của chúng tôi.</p>
          </div>
          <button style={{ background: 'transparent', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', padding: '10px 24px', borderRadius: '30px', cursor: 'pointer', transition: 'all 0.3s' }}>
            Xem lịch sử đánh giá →
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {mockFeedbacks.map(fb => (
            <div key={fb.id} className="card" style={{ 
              backgroundColor: 'white', color: 'var(--color-ink)', padding: '30px', 
              borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)', transition: 'transform 0.3s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                <img src={fb.avatar} alt={fb.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '18px' }}>{fb.name}</h4>
                  <div style={{ color: 'var(--color-muted)', fontSize: '14px' }}>{fb.date}</div>
                </div>
              </div>
              <div style={{ color: 'var(--color-gold)', marginBottom: '15px', fontSize: '20px' }}>
                {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}
              </div>
              <p style={{ fontStyle: 'italic', margin: 0, flex: 1, color: 'var(--color-primary)', lineHeight: 1.6 }}>
                "{fb.content}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
