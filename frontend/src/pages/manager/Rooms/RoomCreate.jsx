import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import roomService from '../../../services/roomService';
import Button from '../../../components/ui/Button';
import FormField, { Input, Select } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const RoomCreate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ roomNumber:'', floor:'', capacity:2, area:'', branchId:'', roomTypeId:'', description:'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await roomService.createRoom(form); alert('Tạo phòng thành công!'); navigate('/manager/rooms'); }
    catch(e){ alert(e.message); } finally { setLoading(false); }
  };

  const f = (k) => (e) => setForm({...form,[k]:e.target.value});
  return (
    <div>
      <PageHeader title="Thêm phòng mới" />
      <form onSubmit={handleSubmit} style={{maxWidth:560,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <FormField label="Số phòng" required><Input value={form.roomNumber} onChange={f('roomNumber')} placeholder="VD: 101" required /></FormField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <FormField label="Tầng" required><Input type="number" value={form.floor} onChange={f('floor')} required /></FormField>
            <FormField label="Sức chứa"><Input type="number" min={1} value={form.capacity} onChange={f('capacity')} /></FormField>
          </div>
          <FormField label="Diện tích (m²)"><Input type="number" value={form.area} onChange={f('area')} /></FormField>
          <FormField label="ID Chi nhánh" required><Input value={form.branchId} onChange={f('branchId')} required /></FormField>
          <FormField label="ID Loại phòng" required><Input value={form.roomTypeId} onChange={f('roomTypeId')} required /></FormField>
          <FormField label="Mô tả"><Input value={form.description} onChange={f('description')} /></FormField>
          <div style={{display:'flex',gap:10,marginTop:8}}>
            <Button type="button" variant="secondary" onClick={()=>navigate(-1)}>Hủy</Button>
            <Button type="submit" variant="primary" loading={loading} style={{flex:1}}>Tạo phòng</Button>
          </div>
        </div>
      </form>
    </div>
  );
};
export default RoomCreate;
