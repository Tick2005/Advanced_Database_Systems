import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', phoneNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authService.register(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    } finally { setLoading(false); }
  };

  if (success) return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{fontSize:48,textAlign:'center'}}>✉️</div>
        <h2 style={{textAlign:'center',marginTop:12}}>Kiểm tra email</h2>
        <p style={{textAlign:'center',color:'var(--color-muted)'}}>Chúng tôi đã gửi link xác minh đến <strong>{form.email}</strong></p>
        <button className="auth-submit" style={{marginTop:20}} onClick={() => navigate('/login')}>Về đăng nhập</button>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">🏨 LuxStay</div>
        <h1 className="auth-title">Đăng ký tài khoản</h1>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Họ tên</label>
          <input placeholder="Nguyễn Văn A" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required />
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <label>Số điện thoại</label>
          <input placeholder="0901234567" value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} />
          <label>Mật khẩu</label>
          <input type="password" placeholder="Tối thiểu 8 ký tự" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p className="auth-footer">Đã có tài khoản? <Link to="/login" className="auth-link">Đăng nhập</Link></p>
      </div>
    </div>
  );
};
export default Register;
