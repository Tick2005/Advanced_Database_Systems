import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';
const Sidebar = ({ logo, items }) => (
  <aside className="sidebar">
    <div className="sidebar-logo">{logo}</div>
    <nav className="sidebar-nav">
      {items.map((item, i) =>
        item.divider ? <div key={i} className="sidebar-divider" /> :
        item.section ? <div key={i} className="sidebar-section">{item.section}</div> :
        <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}>
          <span className="sidebar-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      )}
    </nav>
  </aside>
);
export default Sidebar;
