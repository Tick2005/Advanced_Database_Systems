import React, { useEffect, useMemo, useState } from 'react';
import { roomService } from '../../features/rooms/roomService';
import { useCustomerSettings } from '../../hooks/useCustomerSettings';
import { useAuth } from '../../features/auth/useAuth';
import { loadLocationFromStorage } from '../../services/geo';

const FALLBACK_IMAGE = "https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800";

export default function TopRooms() {
  const { isAuthenticated, role } = useAuth();
  const { settings, loading: settingsLoading } = useCustomerSettings();
  const [userLocation, setUserLocation] = useState(() => loadLocationFromStorage());
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canUseLocation = useMemo(() => {
    if (settingsLoading) return false;
    return Boolean(isAuthenticated && role === "CUSTOMER" && settings.allowLocation && userLocation?.latitude && userLocation?.longitude);
  }, [settingsLoading, isAuthenticated, role, settings.allowLocation, userLocation]);

  useEffect(() => {
    const handleLocationUpdate = (event) => {
      setUserLocation(event?.detail || loadLocationFromStorage());
    };

    window.addEventListener("user_location_updated", handleLocationUpdate);
    return () => window.removeEventListener("user_location_updated", handleLocationUpdate);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    roomService.getTopRooms({
      latitude: canUseLocation ? userLocation.latitude : undefined,
      longitude: canUseLocation ? userLocation.longitude : undefined,
      limit: 4,
    })
      .then((data) => {
        if (!mounted) return;
        setRooms(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err?.message || "Không thể tải phòng nổi bật.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [canUseLocation, userLocation?.latitude, userLocation?.longitude]);

  const renderedRooms = useMemo(() => rooms.map((room, index) => ({
    id: room.roomId || room.id,
    name: room.roomTypeName ? `${room.roomTypeName} ${room.roomNumber}` : room.roomNumber,
    hotel: room.branchName,
    location: room.branchCity,
    rating: Number(room.averageRating || 0).toFixed(1),
    reviews: room.reviewCount || 0,
    price: `${Number(room.rate || 0).toLocaleString("vi-VN")}đ`,
    image: room.imageUrl || FALLBACK_IMAGE,
    isBestSeller: index === 0,
  })), [rooms]);

  return (
    <section style={{ padding: '80px 20px', backgroundColor: 'var(--color-paper)' }}>
      <div style={{ maxWidth: 'var(--page-max)', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '36px', color: 'var(--color-primary)', margin: '0 0 15px 0' }}>Phòng Nổi Bật</h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
            Trải nghiệm không gian nghỉ dưỡng đẳng cấp được sắp xếp theo đánh giá và vị trí thực tế của bạn.
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: 12, background: '#fee2e2', color: '#b91c1c' }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-muted)' }}>Đang tải phòng nổi bật...</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          {renderedRooms.map(room => (
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
