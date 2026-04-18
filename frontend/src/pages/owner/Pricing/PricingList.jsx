import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import pricingService from '../../../services/pricingService';
import { formatVND } from '../../../utils/currency';
import { formatDate } from '../../../utils/dateTime';
import Button from '../../../components/ui/Button';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/ui/DataTable';

const PricingList = () => {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ pricingService.getPricing().then(d=>setPricing(d||[])).finally(()=>setLoading(false)); },[]);
  const columns = [
    { key:'id', label:'Mã', render: v=>v?.slice(-8) },
    { key:'roomTypeId', label:'Loại phòng' },
    { key:'basePrice', label:'Giá cơ bản', render: v=>formatVND(v) },
    { key:'weekendMultiplier', label:'Hệ số cuối tuần', render: v=>v ? `x${v}` : '-' },
    { key:'effectiveFrom', label:'Hiệu lực từ', render: v=>formatDate(v) },
    { key:'effectiveTo', label:'Đến', render: v=>formatDate(v) },
    { key:'id', label:'Thao tác', render: id=><Link to={`/owner/pricing/${id}/edit`}><Button variant="ghost" size="sm">✏️</Button></Link> },
  ];
  return (
    <div>
      <PageHeader title="Chính sách giá" subtitle={`${pricing.length} chính sách`} actions={<Link to="/owner/pricing/create"><Button variant="primary" size="sm">➕ Tạo giá mới</Button></Link>} />
      <DataTable columns={columns} data={pricing} loading={loading} />
    </div>
  );
};
export default PricingList;
