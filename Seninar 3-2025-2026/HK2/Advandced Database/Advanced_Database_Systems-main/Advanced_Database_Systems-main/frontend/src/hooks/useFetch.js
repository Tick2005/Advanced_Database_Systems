import { useApiQuery } from "./useApiQuery";

export function useFetch({ key, fetcher, enabled = true, staleTime = 30 * 1000 }) {
  return useApiQuery({
    queryKey: key,
    queryFn: fetcher,
    enabled,
    staleTime
  });
}
