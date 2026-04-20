import { useApiQuery } from "./useApiQuery";
import { useApiMutation } from "./useApiMutation";

export function useApi(options) {
  return useApiQuery(options);
}

export { useApiQuery, useApiMutation };
