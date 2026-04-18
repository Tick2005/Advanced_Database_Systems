import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './Topbar.css';
const Topbar = ({ title, onMenuToggle }) => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const handleLogout = () => { logout(); navigate('/login'); };
  return (
    <header className="topbar">
      <div className="topbar-left">
        {onMenuToggle && <button className="menu-toggle" onClick={onMenuToggle}>☰</button>}
        <span className="topbar-title">{title}</span>
      </div>
      <div className="topbar-right">
        <div className="user-menu" onClick={() => setOpen(!open)}>
          <div className="user-avatar">{(auth?.fullName || auth?.email || 'U')[0].toUpperCase()}</div>
          <span className="user-name">{auth?.fullName || auth?.email}</span>
          {open && (
            <div className="user-dropdown">
              <button onClick={handleLogout}>🚪 Đăng xuất</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Topbar;
