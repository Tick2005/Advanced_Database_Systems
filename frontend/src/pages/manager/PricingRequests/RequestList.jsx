import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import pricingService from '../../../services/pricingService';
import PageHeader from '../../../components/common/PageHeader';
import Button from '../../../components/ui/Button';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import { formatDate } from '../../../utils/dateTime';

const RequestList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ pricingService.getPricingRequests('manager').then(d=>setRequests(d||[])).finally(()=>setLoading(false)); },[]);
  const columns = [
    { key:'id', label:'Mã', render: v=>v?.slice(-8) },
    { key:'roomTypeId', label:'Loại phòng' },
    { key:'proposedPrice', label:'Giá đề xuất' },
    { key:'reason', label:'Lý do', render: v=>v?.slice(0,50)+'...' },
    { key:'status', label:'Trạng thái', render: v=><StatusBadge status={v?.toLowerCase()} label={v} /> },
    { key:'createdAt', label:'Ngày tạo', render: v=>formatDate(v) },
  ];
  return (
    <div>
      <PageHeader title="Yêu cầu điều chỉnh giá" actions={<Link to="/manager/pricing-requests/create"><Button variant="primary" size="sm">➕ Tạo yêu cầu</Button></Link>} />
      <DataTable columns={columns} data={requests} loading={loading} />
    </div>
  );
};
export default RequestList;
