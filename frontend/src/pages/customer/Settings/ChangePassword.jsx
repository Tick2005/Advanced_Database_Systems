import React, { useState } from 'react';
import authService from '../../../services/authService';
import useAuth from '../../../hooks/useAuth';
import Button from '../../../components/ui/Button';
import FormField, { Input } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';

const ChangePassword = () => {
  const { auth } = useAuth();
  const [form, setForm] = useState({ email: auth?.email||'', token:'', newPassword:'' });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const sendReset = async () => {
    setLoading(true);
    try { await authService.forgotPassword(form.email); setStep(2); setMsg('Đã gửi email đặt lại mật khẩu'); }
    catch (e) { setMsg(e.message); } finally { setLoading(false); }
  };

  const resetPwd = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await authService.resetPassword(form); setMsg('Đổi mật khẩu thành công!'); setStep(3); }
    catch (e) { setMsg(e.message); } finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Đổi mật khẩu" />
      <div style={{maxWidth:440,background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
        {msg && <div style={{padding:'10px 14px',borderRadius:'var(--radius-sm)',background:step===3?'var(--color-success-light)':'var(--color-warning-light)',color:step===3?'var(--color-success)':'var(--color-warning)',marginBottom:16,fontSize:14}}>{msg}</div>}
        {step === 1 && (<>
          <p style={{color:'var(--color-muted)',marginBottom:16,fontSize:14}}>Gửi email đặt lại mật khẩu đến {form.email}</p>
          <Button variant="primary" loading={loading} onClick={sendReset} style={{width:'100%'}}>Gửi email đặt lại mật khẩu</Button>
        </>)}
        {step === 2 && (
          <form onSubmit={resetPwd} style={{display:'flex',flexDirection:'column',gap:16}}>
            <FormField label="Mã xác nhận (từ email)"><Input value={form.token} onChange={e=>setForm({...form,token:e.target.value})} required /></FormField>
            <FormField label="Mật khẩu mới"><Input type="password" value={form.newPassword} onChange={e=>setForm({...form,newPassword:e.target.value})} required /></FormField>
            <Button type="submit" variant="primary" loading={loading}>Đổi mật khẩu</Button>
          </form>
        )}
        {step === 3 && <p style={{color:'var(--color-success)',textAlign:'center'}}>✅ Mật khẩu đã được đổi thành công!</p>}
      </div>
    </div>
  );
};
export default ChangePassword;
