import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import roomService from '../../../services/roomService';
import branchService from '../../../services/branchService';
import { formatVND } from '../../../utils/currency';
import { daysBetween } from '../../../utils/dateTime';
import Button from '../../../components/ui/Button';
import FormField, { Input, Select } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const BookingCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preRoom = location.state?.room;

  const [rooms, setRooms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    roomId: preRoom?.id || '',
    branchId: preRoom?.branchId || '',
    checkInDate: '',
    checkOutDate: '',
    adults: 1,
    children: 0,
    totalPrice: preRoom?.currentPrice || 0,
  });
  const [selectedRoom, setSelectedRoom] = useState(preRoom || null);

  useEffect(() => {
    roomService.getPublicRooms().then(d => setRooms(d || []));
    branchService.getPublicBranches().then(d => setBranches(d || []));
  }, []);

  const handleRoomChange = (e) => {
    const room = rooms.find(r => r.id === e.target.value);
    setSelectedRoom(room || null);
    setForm(f => ({ ...f, roomId: e.target.value, branchId: room?.branchId || f.branchId }));
  };

  useEffect(() => {
    if (selectedRoom && form.checkInDate && form.checkOutDate) {
      const nights = daysBetween(form.checkInDate, form.checkOutDate);
      setForm(f => ({ ...f, totalPrice: (selectedRoom.currentPrice || 0) * nights }));
    }
  }, [form.checkInDate, form.checkOutDate, selectedRoom]);

  const handleNext = (e) => {
    e.preventDefault();
    if (!form.roomId || !form.branchId || !form.checkInDate || !form.checkOutDate) return alert('Vui lòng điền đầy đủ thông tin');
    if (form.checkOutDate <= form.checkInDate) return alert('Ngày check-out phải sau ngày check-in');
    navigate('/customer/booking/review', { state: { form, room: selectedRoom } });
  };

  return (
    <div>
      <PageHeader title="Đặt phòng mới" subtitle="Chọn phòng và thời gian lưu trú" />
      <form onSubmit={handleNext} style={{maxWidth:560,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <FormField label="Chọn phòng" required>
          <Select value={form.roomId} onChange={handleRoomChange} required>
            <option value="">-- Chọn phòng --</option>
            {rooms.filter(r => r.status === 'AVAILABLE').map(r => (
              <option key={r.id} value={r.id}>Phòng {r.roomNumber} - {r.roomType?.name} ({formatVND(r.currentPrice)}/đêm)</option>
            ))}
          </Select>
        </FormField>
        <FormField label="Chi nhánh" required>
          <Select value={form.branchId} onChange={e => setForm({...form, branchId: e.target.value})} required>
            <option value="">-- Chọn chi nhánh --</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </FormField>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <FormField label="Ngày check-in" required>
            <Input type="date" value={form.checkInDate} min={new Date().toISOString().split('T')[0]}
              onChange={e => setForm({...form, checkInDate: e.target.value})} required />
          </FormField>
          <FormField label="Ngày check-out" required>
            <Input type="date" value={form.checkOutDate} min={form.checkInDate || new Date().toISOString().split('T')[0]}
              onChange={e => setForm({...form, checkOutDate: e.target.value})} required />
          </FormField>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <FormField label="Người lớn">
            <Input type="number" min={1} max={10} value={form.adults} onChange={e => setForm({...form, adults: +e.target.value})} />
          </FormField>
          <FormField label="Trẻ em">
            <Input type="number" min={0} max={10} value={form.children} onChange={e => setForm({...form, children: +e.target.value})} />
          </FormField>
        </div>
        {form.totalPrice > 0 && (
          <div style={{background:'var(--color-accent-light)',borderRadius:'var(--radius-sm)',padding:'14px 16px',marginBottom:16,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontWeight:600}}>Tổng tiền dự kiến:</span>
            <span style={{fontWeight:700,fontSize:18,color:'var(--color-accent)'}}>{formatVND(form.totalPrice)}</span>
          </div>
        )}
        <Button type="submit" variant="primary" size="lg" style={{width:'100%'}}>Tiếp theo →</Button>
      </form>
    </div>
  );
};
export default BookingCreate;
