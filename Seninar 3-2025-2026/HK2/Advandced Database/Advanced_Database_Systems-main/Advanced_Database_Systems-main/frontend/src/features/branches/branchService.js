import { httpClient } from "../../services/httpClient";

export const branchService = {
  getTopBranches: () => httpClient.get("/api/public/branches"),
  getBranches: () => httpClient.get("/api/public/branches")
};
