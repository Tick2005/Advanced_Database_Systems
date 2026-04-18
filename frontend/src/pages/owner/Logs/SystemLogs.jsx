import React from 'react';
import PageHeader from '../../../components/common/PageHeader';
const SystemLogs = () => (
  <div>
    <PageHeader title="Nhật ký hệ thống" subtitle="Lịch sử hoạt động" />
    <div style={{background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)'}}>
      <p style={{color:'var(--color-muted)'}}>Tính năng nhật ký hệ thống (Internal API /api/internal/logs).</p>
      <p style={{color:'var(--color-muted)',marginTop:8,fontSize:13}}>Endpoint: GET /api/internal/logs cần được kết nối theo yêu cầu cụ thể.</p>
    </div>
  </div>
);
export default SystemLogs;
