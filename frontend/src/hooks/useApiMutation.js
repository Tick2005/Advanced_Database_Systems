import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useApiMutation({ mutationFn, onSuccess, invalidateKeys = [] }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async (data, variables, context) => {
      if (invalidateKeys.length > 0) {
        await Promise.all(
          invalidateKeys.map((key) => queryClient.invalidateQueries({ queryKey: key }))
        );
      }
      if (onSuccess) {
        await onSuccess(data, variables, context);
      }
    }
  });
}
