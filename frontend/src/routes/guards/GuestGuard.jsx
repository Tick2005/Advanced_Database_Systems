import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';

const GuestGuard = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { role } = usePermission();
  if (isAuthenticated) {
    const redirectMap = { OWNER: '/owner', MANAGER: '/manager', STAFF: '/staff', CUSTOMER: '/customer' };
    return <Navigate to={redirectMap[role] || '/customer'} replace />;
  }
  return children;
};
export default GuestGuard;
