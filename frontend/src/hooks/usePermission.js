import useAuth from './useAuth';
const usePermission = () => {
  const { auth } = useAuth();
  const role = auth?.role || auth?.user?.role || null;
  return {
    role,
    isOwner: role === 'OWNER',
    isManager: role === 'MANAGER',
    isStaff: role === 'STAFF',
    isCustomer: role === 'CUSTOMER',
    hasRole: (r) => role === r,
  };
};
export default usePermission;
