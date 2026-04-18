import React from 'react';
import { Navigate } from 'react-router-dom';
import usePermission from '../../hooks/usePermission';

const RoleGuard = ({ roles, children }) => {
  const { role } = usePermission();
  if (!roles.includes(role)) return <Navigate to="/" replace />;
  return children;
};
export default RoleGuard;
