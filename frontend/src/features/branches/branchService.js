import { httpClient } from "../../services/httpClient";

export const branchService = {
  /** Public — all active branches */
  getTopBranches: () => httpClient.get("/api/public/branches"),
  getBranches:    () => httpClient.get("/api/public/branches"),

  /**
   * Manager — returns the branch assigned to the current manager token.
   * Maps to GET /api/manager/branch (added in ManagerController).
   * Returns a single BranchResponse wrapped in an array for backward compat.
   */
  getForManager: () =>
    httpClient.get("/api/manager/branch").then((b) => (b ? [b] : [])),
};
