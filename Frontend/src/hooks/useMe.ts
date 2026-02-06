import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/api/auth";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

export const meQueryKey = ["auth", "me"] as const;

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

export function useMe() {
  const ui = useUiAdapters();
  const lastHandledRef = useRef<unknown>(null);

  const q = useQuery({
    queryKey: meQueryKey,
    queryFn: authApi.me,
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!q.isError || !q.error) return;
    if (lastHandledRef.current === q.error) return;
    lastHandledRef.current = q.error;

    const err = asNormalized(q.error);
    const authish = err.type === "auth" || err.type === "permission" || err.status === 401 || err.status === 403;

    if (!authish) {
      handleUiError(err, ui, { retry: q.refetch });
    }
  }, [q.isError, q.error, q.refetch, ui]);

  return q;
}
