import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileSocialApi } from "@/api/profileSocial";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

export function useSearchUsers(
  q: string,
  opts?: { limit?: number; offset?: number; enabled?: boolean }
) {
  const ui = useUiAdapters();
  const lastHandledRef = useRef<unknown>(null);

  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;
  const enabled = opts?.enabled ?? true;

  const qq = (q ?? "").trim();

  const query = useQuery({
    queryKey: ["profile.searchUsers", qq, limit, offset],
    enabled: enabled && qq.length > 0,
    queryFn: () => profileSocialApi.searchUsers({ q: qq, limit, offset }),
    staleTime: 15_000,
    retry: false,
  });

  useEffect(() => {
    if (!query.isError || !query.error) return;
    if (lastHandledRef.current === query.error) return;
    lastHandledRef.current = query.error;

    handleUiError(asNormalized(query.error), ui, { retry: query.refetch });
  }, [query.isError, query.error, query.refetch, ui]);

  return query;
}
