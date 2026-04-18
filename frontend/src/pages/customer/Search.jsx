import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import roomService from '../../services/roomService';
import { formatVND } from '../../utils/currency';
import PageHeader from '../../components/common/PageHeader';

const Search = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    roomService.getPublicRooms().then(d => setRooms(d || [])).finally(() => setLoading(false));
  }, []);

  const filtered = rooms.filter(r => !search || r.roomNumber?.includes(search) || r.roomType?.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Tìm kiếm phòng" subtitle="Tìm phòng phù hợp với nhu cầu của bạn" />
      <input style={{width:'100%',padding:'12px 16px',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-sm)',fontSize:14,marginBottom:24,outline:'none'}}
        placeholder="🔍 Nhập số phòng hoặc loại phòng..." value={search} onChange={e => setSearch(e.target.value)} />
      {loading ? <p>Đang tải...</p> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
          {filtered.map(room => (
            <Link to={`/rooms/${room.id}`} key={room.id} style={{background:'#fff',borderRadius:'var(--radius-md)',overflow:'hidden',boxShadow:'var(--shadow-soft)',display:'block'}}>
              <img src={room.imageUrls?.[0]} alt="" style={{width:'100%',height:160,objectFit:'cover'}} onError={e => e.target.src='https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400'} />
              <div style={{padding:'14px 16px'}}>
                <div style={{fontWeight:700}}>Phòng {room.roomNumber}</div>
                <div style={{fontSize:13,color:'var(--color-muted)',margin:'4px 0 10px'}}>{room.roomType?.name} · {room.capacity} người</div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontWeight:700,color:'var(--color-accent)'}}>{formatVND(room.currentPrice)}/đêm</span>
                  <span style={{fontSize:12,padding:'2px 8px',borderRadius:99,background:room.status==='AVAILABLE'?'var(--color-success-light)':'var(--color-danger-light)',color:room.status==='AVAILABLE'?'var(--color-success)':'var(--color-danger)',fontWeight:600}}>
                    {room.status === 'AVAILABLE' ? 'Còn trống' : 'Đã đặt'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
export default Search;
