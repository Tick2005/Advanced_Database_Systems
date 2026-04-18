import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import roomService from '../../../services/roomService';
import Button from '../../../components/ui/Button';
import FormField, { Input, Select } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const RoomEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ description:'', capacity:2, area:'' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    roomService.getPublicRoomDetail(id).then(d => d && setForm({ description: d.description||'', capacity: d.capacity||2, area: d.area||'' })).catch(()=>{});
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await roomService.updateRoom(id, form); alert('Cập nhật thành công!'); navigate('/manager/rooms'); }
    catch(e){ alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Chỉnh sửa phòng" />
      <form onSubmit={handleSubmit} style={{maxWidth:480,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <FormField label="Sức chứa"><Input type="number" min={1} value={form.capacity} onChange={e=>setForm({...form,capacity:+e.target.value})} /></FormField>
          <FormField label="Diện tích (m²)"><Input type="number" value={form.area} onChange={e=>setForm({...form,area:e.target.value})} /></FormField>
          <FormField label="Mô tả"><Input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></FormField>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Button type="button" variant="secondary" onClick={()=>navigate(-1)}>Hủy</Button>
            <Button type="submit" variant="primary" loading={loading} style={{flex:1}}>Lưu thay đổi</Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default RoomEdit;
