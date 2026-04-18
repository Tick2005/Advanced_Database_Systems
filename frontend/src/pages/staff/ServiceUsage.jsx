import React, { useState } from 'react';
import bookingService from '../../services/bookingService';
import Button from '../../components/ui/Button';
import FormField, { Input } from '../../components/ui/FormField';
import PageHeader from '../../components/common/PageHeader';

const ServiceUsage = () => {
  const [bookingId, setBookingId] = useState('');
  const [services, setServices] = useState([{ serviceId:'', quantity:1, note:'' }]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bookingId.trim()) return alert('Nhập mã đặt phòng');
    setLoading(true);
    try {
      await bookingService.updateBookingServices(bookingId, { services });
      alert('Cập nhật dịch vụ thành công!');
      setBookingId(''); setServices([{ serviceId:'', quantity:1, note:'' }]);
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Cập nhật dịch vụ phòng" subtitle="Thêm dịch vụ cho đặt phòng hiện tại" />
      <form onSubmit={handleSubmit} style={{maxWidth:560,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        <FormField label="Mã đặt phòng" required style={{marginBottom:20}}>
          <Input value={bookingId} onChange={e=>setBookingId(e.target.value)} placeholder="Nhập booking ID" required />
        </FormField>
        <h3 style={{fontSize:15,fontWeight:600,marginBottom:12}}>Dịch vụ</h3>
        {services.map((s,i) => (
          <div key={i} style={{border:'1px solid var(--color-border)',borderRadius:'var(--radius-sm)',padding:14,marginBottom:12,display:'grid',gridTemplateColumns:'1fr 80px 1fr',gap:10,alignItems:'end'}}>
            <FormField label="Mã dịch vụ"><Input value={s.serviceId} onChange={e=>{const ns=[...services];ns[i]={...ns[i],serviceId:e.target.value};setServices(ns);}} placeholder="Service ID" /></FormField>
            <FormField label="Số lượng"><Input type="number" min={1} value={s.quantity} onChange={e=>{const ns=[...services];ns[i]={...ns[i],quantity:+e.target.value};setServices(ns);}} /></FormField>
            <FormField label="Ghi chú"><Input value={s.note} onChange={e=>{const ns=[...services];ns[i]={...ns[i],note:e.target.value};setServices(ns);}} placeholder="(Tuỳ chọn)" /></FormField>
          </div>
        ))}
        <button type="button" style={{width:'100%',padding:'8px',border:'1.5px dashed var(--color-border)',borderRadius:'var(--radius-sm)',background:'none',cursor:'pointer',color:'var(--color-muted)',marginBottom:16}} onClick={()=>setServices([...services,{serviceId:'',quantity:1,note:''}])}>+ Thêm dịch vụ</button>
        <Button type="submit" variant="primary" loading={loading} style={{width:'100%'}}>Cập nhật dịch vụ</Button>
      </form>
    </div>
  );
};
export default ServiceUsage;
