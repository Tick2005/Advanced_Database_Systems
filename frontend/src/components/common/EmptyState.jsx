import React from 'react';
import './EmptyState.css';
const EmptyState = ({ icon = '📭', title = 'Trống', description, action }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <h3 className="empty-title">{title}</h3>
    {description && <p className="empty-desc">{description}</p>}
    {action && <div className="empty-action">{action}</div>}
  </div>
);
export default EmptyState;


