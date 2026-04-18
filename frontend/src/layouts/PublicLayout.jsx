import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import usePermission from '../hooks/usePermission';
import './PublicLayout.css';

const PublicLayout = () => {
  const { isAuthenticated, logout } = useAuth();
  const { role } = usePermission();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardMap = { OWNER: '/owner', MANAGER: '/manager', STAFF: '/staff', CUSTOMER: '/customer' };

  return (
    <div className="public-shell">
      <header className="pub-header">
        <NavLink to="/" className="pub-logo">🏨 LuxStay</NavLink>
        <button className="pub-hamburger" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
        <nav className={`pub-nav ${menuOpen ? 'pub-nav--open' : ''}`}>
          <NavLink to="/" end className={({isActive}) => isActive ? 'pub-link active' : 'pub-link'}>Trang chủ</NavLink>
          <NavLink to="/rooms" className={({isActive}) => isActive ? 'pub-link active' : 'pub-link'}>Phòng</NavLink>
          <NavLink to="/about" className={({isActive}) => isActive ? 'pub-link active' : 'pub-link'}>Giới thiệu</NavLink>
          <NavLink to="/contact" className={({isActive}) => isActive ? 'pub-link active' : 'pub-link'}>Liên hệ</NavLink>
          {isAuthenticated ? (
            <>
              <button className="pub-btn-outline" onClick={() => navigate(dashboardMap[role] || '/customer')}>Dashboard</button>
              <button className="pub-btn-outline" onClick={() => { logout(); navigate('/'); }}>Đăng xuất</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="pub-btn-outline">Đăng nhập</NavLink>
              <NavLink to="/register" className="pub-btn-solid">Đăng ký</NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="pub-main"><Outlet /></main>
      <footer className="pub-footer">
        <div className="pub-footer-inner">
          <p>🏨 <strong>LuxStay Hotel</strong> — Dịch vụ lưu trú đẳng cấp</p>
          <p style={{color:'var(--color-muted)',fontSize:13}}>© {new Date().getFullYear()} LuxStay. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
export default PublicLayout;
