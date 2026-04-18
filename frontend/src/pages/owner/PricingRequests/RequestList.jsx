import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import pricingService from '../../../services/pricingService';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import Button from '../../../components/ui/Button';
import { formatDate } from '../../../utils/dateTime';

const RequestList = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ pricingService.getPricingRequests('owner').then(d=>setRequests(d||[])).finally(()=>setLoading(false)); },[]);
  const columns = [
    { key:'id', label:'Mã', render: v=>v?.slice(-8) },
    { key:'branchId', label:'Chi nhánh' },
    { key:'roomTypeId', label:'Loại phòng' },
    { key:'proposedPrice', label:'Giá đề xuất' },
    { key:'status', label:'Trạng thái', render: v=><StatusBadge status={v?.toLowerCase()} label={v} /> },
    { key:'createdAt', label:'Ngày', render: v=>formatDate(v) },
    { key:'id', label:'Thao tác', render: id=>(
      <div style={{display:'flex',gap:6}}>
        <Link to={`/owner/pricing-requests/${id}/approve`}><Button variant="success" size="sm">✅</Button></Link>
        <Link to={`/owner/pricing-requests/${id}/reject`}><Button variant="danger" size="sm">❌</Button></Link>
      </div>
    )},
  ];
  return (
    <div>
      <PageHeader title="Yêu cầu điều chỉnh giá" subtitle={`${requests.length} yêu cầu`} />
      <DataTable columns={columns} data={requests} loading={loading} />
    </div>
  );
};
export default RequestList;
