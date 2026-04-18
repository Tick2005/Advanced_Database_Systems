import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const { role } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const dashMap = { OWNER: '/owner', MANAGER: '/manager', STAFF: '/staff', CUSTOMER: '/customer' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await login(form);
      const userRole = data?.role || data?.user?.role;
      const dest = location.state?.from?.pathname || dashMap[userRole] || '/customer';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">🏨 LuxStay</div>
        <h1 className="auth-title">Đăng nhập</h1>
        <p className="auth-sub">Chào mừng trở lại!</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          <label>Mật khẩu</label>
          <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          <div style={{textAlign:'right',marginBottom:4}}>
            <Link to="/forgot-password" className="auth-link">Quên mật khẩu?</Link>
          </div>
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="auth-footer">Chưa có tài khoản? <Link to="/register" className="auth-link">Đăng ký ngay</Link></p>
      </div>
    </div>
  );
};
export default Login;
