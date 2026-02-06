// src/hooks/useChatInbox.ts
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/api/chat";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

export function useChatInbox(pollMs = 15_000) {
  const ui = useUiAdapters();

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

  useEffect(() => {
    if (q.isError && q.error) {
      handleUiError(asNormalized(q.error), ui, { retry: q.refetch });
    }
  }, [q.isError, q.error, ui, q.refetch]);

  return {
    items: q.data ?? [],
    count: (q.data ?? []).length,
    loading: q.isLoading,
    error: q.isError ? (q.error as any)?.message ?? "Failed to load inbox." : null,
    refetch: q.refetch,
  };
}
