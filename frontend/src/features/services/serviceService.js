import { httpClient } from "../../services/httpClient";

export const serviceService = {
  getPublicServicesByBranch: (branchId) =>
    httpClient.get(`/api/public/services?branchId=${encodeURIComponent(branchId)}`)
};
