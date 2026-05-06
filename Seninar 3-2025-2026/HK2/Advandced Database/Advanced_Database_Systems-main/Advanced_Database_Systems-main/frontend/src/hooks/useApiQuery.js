import { useQuery } from "@tanstack/react-query";

export function useApiQuery({ queryKey, queryFn, enabled = true, staleTime, gcTime, retry }) {
  return useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    gcTime,
    retry
  });
}
