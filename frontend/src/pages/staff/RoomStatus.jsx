import React, { useEffect, useState } from 'react';
import roomService from '../../services/roomService';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/common/PageHeader';
import { formatVND } from '../../utils/currency';

const STATUS_OPTIONS = ['AVAILABLE','OCCUPIED','CLEANING','MAINTENANCE'];
const STATUS_LABELS = { AVAILABLE:'Trống', OCCUPIED:'Đã đặt', CLEANING:'Đang dọn', MAINTENANCE:'Bảo trì' };
const STATUS_COLORS = { AVAILABLE:'var(--color-success)', OCCUPIED:'var(--color-danger)', CLEANING:'var(--color-warning)', MAINTENANCE:'var(--color-muted)' };

const RoomStatus = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => { roomService.getRoomStatus().then(d=>setRooms(d||[])).finally(()=>setLoading(false)); }, []);

  const handleUpdate = async (id, status) => {
    setUpdating(id);
    try { const updated = await roomService.updateRoomStatus(id, status); setRooms(prev => prev.map(r => r.id===id ? updated : r)); }
    catch (e) { alert(e.message); } finally { setUpdating(null); }
  };

  return (
    <div>
      <PageHeader title="Trạng thái phòng" subtitle={`${rooms.length} phòng`} />
      {loading ? <p>Đang tải...</p> : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
          {rooms.map(r => (
            <div key={r.id} style={{background:'#fff',borderRadius:'var(--radius-md)',padding:'16px 18px',boxShadow:'var(--shadow-soft)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <strong>Phòng {r.roomNumber}</strong>
                <span style={{fontSize:12,padding:'3px 8px',borderRadius:99,background:STATUS_COLORS[r.status]+'22',color:STATUS_COLORS[r.status],fontWeight:600}}>{STATUS_LABELS[r.status]||r.status}</span>
              </div>
              <div style={{fontSize:13,color:'var(--color-muted)',marginBottom:12}}>{r.roomType?.name} · Tầng {r.floor}</div>
              <select style={{width:'100%',padding:'8px 10px',border:'1.5px solid var(--color-border)',borderRadius:'var(--radius-sm)',fontSize:13}} value={r.status} onChange={e=>handleUpdate(r.id,e.target.value)} disabled={updating===r.id}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default RoomStatus;
