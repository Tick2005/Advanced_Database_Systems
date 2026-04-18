import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import serviceService from '../../../services/serviceService';
import useAuth from '../../../hooks/useAuth';
import { formatVND } from '../../../utils/currency';
import Button from '../../../components/ui/Button';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/ui/DataTable';

const ServiceList = () => {
  const { auth } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const branchId = auth?.branchId || '';
  useEffect(()=>{ if(branchId) serviceService.getByBranch(branchId).then(d=>setServices(d||[])).finally(()=>setLoading(false)); else setLoading(false); },[branchId]);
  const columns = [
    { key:'name', label:'Tên dịch vụ' },
    { key:'category', label:'Danh mục' },
    { key:'price', label:'Giá', render: v=>formatVND(v) },
    { key:'mode', label:'Chế độ' },
    { key:'available', label:'Khả dụng', render: v=><span style={{color:v?'var(--color-success)':'var(--color-danger)',fontWeight:600}}>{v?'✅ Có':'❌ Không'}</span> },
    { key:'id', label:'Thao tác', render: id=><Link to={`/manager/services/${id}/edit`}><Button variant="ghost" size="sm">✏️</Button></Link> },
  ];
  return (
    <div>
      <PageHeader title="Dịch vụ" actions={<Link to="/manager/services/create"><Button variant="primary" size="sm">➕ Thêm dịch vụ</Button></Link>} />
      {!branchId && <p style={{color:'var(--color-danger)'}}>Không xác định được chi nhánh. Vui lòng liên hệ admin.</p>}
      <DataTable columns={columns} data={services} loading={loading} />
    </div>
  );
};
export default ServiceList;
