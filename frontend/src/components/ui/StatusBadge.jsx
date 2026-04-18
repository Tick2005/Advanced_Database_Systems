import React from 'react';
import './StatusBadge.css';
const StatusBadge = ({ status, label, color }) => (
  <span className={`badge badge-${color || status?.toLowerCase() || 'default'}`}>
    {label || status}
  </span>
);
export default StatusBadge;
