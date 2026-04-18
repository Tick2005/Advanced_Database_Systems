import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import roomService from '../../../services/roomService';
import { formatVND } from '../../../utils/currency';
import Button from '../../../components/ui/Button';
import StatusBadge from '../../../components/ui/StatusBadge';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/ui/DataTable';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(()=>{ roomService.getPublicRooms().then(d=>setRooms(d||[])).finally(()=>setLoading(false)); },[]);

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa phòng này?')) return;
    setDeleting(id);
    try { await roomService.deleteRoom(id); setRooms(p=>p.filter(r=>r.id!==id)); }
    catch(e){ alert(e.message); } finally { setDeleting(null); }
  };

  const columns = [
    { key:'roomNumber', label:'Số phòng' },
    { key:'roomType', label:'Loại phòng', render: v => v?.name || '-' },
    { key:'floor', label:'Tầng' },
    { key:'capacity', label:'Sức chứa' },
    { key:'currentPrice', label:'Giá/đêm', render: v => formatVND(v) },
    { key:'status', label:'Trạng thái', render: v => <StatusBadge status={v?.toLowerCase()} label={v==='AVAILABLE'?'Trống':v==='OCCUPIED'?'Đã đặt':v} color={v==='AVAILABLE'?'success':v==='OCCUPIED'?'danger':'warning'} /> },
    { key:'id', label:'Thao tác', render: (id,row) => (
      <div style={{display:'flex',gap:8}}>
        <Link to={`/manager/rooms/${id}/edit`}><Button variant="ghost" size="sm">✏️</Button></Link>
        <Button variant="danger" size="sm" loading={deleting===id} onClick={()=>handleDelete(id)}>🗑️</Button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Danh sách phòng" subtitle={`${rooms.length} phòng`} actions={<Link to="/manager/rooms/create"><Button variant="primary" size="sm">➕ Thêm phòng</Button></Link>} />
      <DataTable columns={columns} data={rooms} loading={loading} />
    </div>
  );
};
export default RoomList;
