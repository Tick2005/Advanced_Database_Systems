import React from 'react';
import './Toast.css';
const Toast = ({ toasts, remove }) => (
  <div className="toast-container">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`}>
        <span>{t.message}</span>
        <button onClick={() => remove(t.id)}>✕</button>
      </div>
    ))}
  </div>
);
export default Toast;
