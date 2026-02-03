// src/hooks/useChatInbox.ts
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/api/chat";

export function useChatInbox(pollMs = 15_000) {
  const q = useQuery({
    queryKey: ["chat-inbox"],
    queryFn: async () => {
      const data = await chatApi.listInbox();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: pollMs,
    staleTime: 10_000,
    retry: 1,
  });

  return {
    items: q.data ?? [],
    count: (q.data ?? []).length,
    loading: q.isLoading,
    error: q.isError ? (q.error as any)?.message ?? "Failed to load inbox." : null,
    refetch: q.refetch,
  };
}
