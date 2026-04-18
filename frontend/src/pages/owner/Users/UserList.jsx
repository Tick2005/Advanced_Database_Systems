import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import userService from '../../../services/userService';
import PageHeader from '../../../components/common/PageHeader';
import DataTable from '../../../components/ui/DataTable';
import StatusBadge from '../../../components/ui/StatusBadge';
import Button from '../../../components/ui/Button';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ userService.getUsers().then(d=>setUsers(d||[])).finally(()=>setLoading(false)); },[]);
  const columns = [
    { key:'email', label:'Email' },
    { key:'fullName', label:'Họ tên' },
    { key:'role', label:'Vai trò', render: v=><StatusBadge status={v?.toLowerCase()} label={v} /> },
    { key:'branchId', label:'Chi nhánh', render: v=>v||'—' },
    { key:'id', label:'Thao tác', render: id=><Link to={`/owner/users/roles?userId=${id}`}><Button variant="ghost" size="sm">🔑 Phân quyền</Button></Link> },
  ];
  return (
    <div>
      <PageHeader title="Quản lý người dùng" subtitle={`${users.length} tài khoản`} />
      <DataTable columns={columns} data={users} loading={loading} />
    </div>
  );
};
export default UserList;
