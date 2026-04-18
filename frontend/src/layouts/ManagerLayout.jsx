import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import '../layouts/DashLayout.css';

const NAV_ITEMS = [
  { to: "/manager", label: "Dashboard", icon: "📊", end: true },
  { section: "Phòng" },
  { to: "/manager/rooms", label: "Danh sách phòng", icon: "🏠" },
  { to: "/manager/rooms/create", label: "Thêm phòng", icon: "➕" },
  { divider: true },
  { section: "Đặt phòng" },
  { to: "/manager/bookings", label: "Quản lý đặt phòng", icon: "📋" },
  { divider: true },
  { section: "Dịch vụ & Phản hồi" },
  { to: "/manager/services", label: "Dịch vụ", icon: "🍽️" },
  { to: "/manager/feedbacks", label: "Phản hồi", icon: "💬" },
  { divider: true },
  { section: "Giá & Báo cáo" },
  { to: "/manager/pricing-requests", label: "Yêu cầu giá", icon: "💰" },
  { to: "/manager/reports/revenue", label: "Doanh thu", icon: "📈" },
  { to: "/manager/reports/booking", label: "Báo cáo đặt phòng", icon: "📊" },
];

const ManagerLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={`dash-shell ${collapsed ? 'dash-shell--collapsed' : ''}`}>
      <Sidebar logo="🏨 LuxStay" items={NAV_ITEMS} />
      <div className="dash-body">
        <Topbar title="LuxStay Manager" onMenuToggle={() => setCollapsed(!collapsed)} />
        <main className="dash-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default ManagerLayout;
