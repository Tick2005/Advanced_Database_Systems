const ROLE_RANK = {
  CUSTOMER: 1,
  STAFF: 2,
  MANAGER: 3,
  OWNER: 4
};

function getRank(role) {
  return ROLE_RANK[role] || 0;
}

export function hasRequiredRole(userRole, allowedRoles = [], { allowHierarchy = false } = {}) {
  if (!userRole || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return false;
  }

  if (allowedRoles.includes(userRole)) {
    return true;
  }

  if (!allowHierarchy) {
    return false;
  }

  const requiredRank = Math.min(...allowedRoles.map((role) => getRank(role)).filter((rank) => rank > 0));
  return requiredRank > 0 && getRank(userRole) >= requiredRank;
}
