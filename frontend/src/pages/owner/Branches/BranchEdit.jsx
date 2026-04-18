import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import FormField, { Input } from '../../../components/ui/FormField';
import PageHeader from '../../../components/common/PageHeader';
const BranchEdit = () => {
  const navigate = useNavigate();
  return (
    <div>
      <PageHeader title="Chỉnh sửa chi nhánh" />
      <div style={{background:'#fff',borderRadius:'var(--radius-lg)',padding:28,boxShadow:'var(--shadow-soft)',maxWidth:480}}>
        <p style={{color:'var(--color-muted)'}}>Tính năng chỉnh sửa chi nhánh (API owner cần endpoint PUT branches/:id).</p>
        <Button variant="secondary" onClick={()=>navigate(-1)} style={{marginTop:16}}>Quay lại</Button>
      </div>
    </div>
  );
};
export default BranchEdit;
