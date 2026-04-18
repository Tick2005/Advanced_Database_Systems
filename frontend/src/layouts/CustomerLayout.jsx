import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import '../layouts/DashLayout.css';

const NAV_ITEMS = [
  { to: "/customer", label: "Trang chủ", icon: "🏠", end: true },
  { to: "/customer/search", label: "Tìm phòng", icon: "🔍" },
  { divider: true },
  { section: "Đặt phòng" },
  { to: "/customer/bookings", label: "Đặt phòng của tôi", icon: "📋" },
  { to: "/customer/booking/create", label: "Đặt phòng mới", icon: "➕" },
  { divider: true },
  { section: "Tài khoản" },
  { to: "/customer/feedbacks", label: "Đánh giá của tôi", icon: "💬" },
  { to: "/customer/profile", label: "Hồ sơ", icon: "👤" },
  { to: "/customer/settings/password", label: "Đổi mật khẩu", icon: "🔒" },
];

const CustomerLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={`dash-shell ${collapsed ? 'dash-shell--collapsed' : ''}`}>
      <Sidebar logo="🏨 LuxStay" items={NAV_ITEMS} />
      <div className="dash-body">
        <Topbar title="LuxStay Customer" onMenuToggle={() => setCollapsed(!collapsed)} />
        <main className="dash-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default CustomerLayout;
