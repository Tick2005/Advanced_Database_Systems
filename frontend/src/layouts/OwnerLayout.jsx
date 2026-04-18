import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import '../layouts/DashLayout.css';

const NAV_ITEMS = [
  { to: "/owner", label: "Dashboard", icon: "📊", end: true },
  { section: "Quản lý" },
  { to: "/owner/branches", label: "Chi nhánh", icon: "🏢" },
  { to: "/owner/users", label: "Người dùng", icon: "👥" },
  { divider: true },
  { section: "Giá & Yêu cầu" },
  { to: "/owner/pricing", label: "Chính sách giá", icon: "💰" },
  { to: "/owner/pricing-requests", label: "Yêu cầu giá", icon: "📝" },
  { divider: true },
  { section: "Báo cáo" },
  { to: "/owner/reports/revenue", label: "Doanh thu tổng", icon: "📈" },
  { to: "/owner/reports/branches", label: "So sánh chi nhánh", icon: "🏢" },
  { to: "/owner/logs", label: "Nhật ký hệ thống", icon: "📜" },
];

const OwnerLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className={`dash-shell ${collapsed ? 'dash-shell--collapsed' : ''}`}>
      <Sidebar logo="🏨 LuxStay" items={NAV_ITEMS} />
      <div className="dash-body">
        <Topbar title="LuxStay Owner" onMenuToggle={() => setCollapsed(!collapsed)} />
        <main className="dash-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
export default OwnerLayout;
