import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import '../layouts/DashLayout.css';

const NAV_ITEMS = [
  { to: "/staff", label: "Dashboard", icon: "📊", end: true },
  { to: "/staff/bookings/today", label: "Đặt phòng hôm nay", icon: "📅" },
  { divider: true },
  { section: "Thao tác" },
  { to: "/staff/checkin", label: "Check-in", icon: "✅" },
  { to: "/staff/checkout", label: "Check-out", icon: "🚪" },
  { to: "/staff/rooms/status", label: "Trạng thái phòng", icon: "🏠" },
  { to: "/staff/service-usage", label: "Dịch vụ phòng", icon: "🍽️" },
];

const StaffLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={`dash-shell ${collapsed ? 'dash-shell--collapsed' : ''}`}>
      <Sidebar logo="🏨 LuxStay" items={NAV_ITEMS} />
      <div className="dash-body">
        <Topbar title="LuxStay Staff" onMenuToggle={() => setCollapsed(!collapsed)} />
        <main className="dash-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default StaffLayout;
