export const ACTIONS = {
  ROOM_CREATE: "ROOM_CREATE",
  ROOM_EDIT: "ROOM_EDIT",
  SERVICE_CREATE: "SERVICE_CREATE",
  SERVICE_EDIT: "SERVICE_EDIT",
  PRICING_REQUEST_CREATE: "PRICING_REQUEST_CREATE",
  PRICING_CREATE: "PRICING_CREATE",
  PRICING_UPDATE: "PRICING_UPDATE",
  PRICING_REQUEST_APPROVE: "PRICING_REQUEST_APPROVE",
  PRICING_REQUEST_REJECT: "PRICING_REQUEST_REJECT",
  BRANCH_CREATE: "BRANCH_CREATE",
  BRANCH_UPDATE: "BRANCH_UPDATE",
  BRANCH_DELETE: "BRANCH_DELETE",
  USER_ROLE_UPDATE: "USER_ROLE_UPDATE"
};

function isManager(role) {
  return role === "MANAGER";
}

function isOwner(role) {
  return role === "OWNER";
}

export function canPerformAction(role, action, context = {}) {
  if (!role || !action) return false;

  switch (action) {
    case ACTIONS.ROOM_CREATE:
    case ACTIONS.ROOM_EDIT:
    case ACTIONS.SERVICE_CREATE:
    case ACTIONS.SERVICE_EDIT:
      return isManager(role) || isOwner(role);

    case ACTIONS.PRICING_REQUEST_CREATE:
      return isManager(role);

    case ACTIONS.PRICING_CREATE:
    case ACTIONS.PRICING_UPDATE:
    case ACTIONS.BRANCH_CREATE:
      return isOwner(role);

    case ACTIONS.PRICING_REQUEST_APPROVE:
    case ACTIONS.PRICING_REQUEST_REJECT:
      return isOwner(role) && context.status === "PENDING";

    case ACTIONS.BRANCH_UPDATE:
    case ACTIONS.BRANCH_DELETE:
      return isOwner(role);

    case ACTIONS.USER_ROLE_UPDATE:
      return isOwner(role)
        && Boolean(context.targetEmail)
        && context.targetEmail !== context.currentEmail
        && context.nextRole !== "OWNER";

    default:
      return false;
  }
}
