import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/api/profile";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

type PublicProfile = {
  uid: number;
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  timezone?: string | null;
  [k: string]: any;
};

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

export function usePublicProfilesBatch(uids: Array<string | number>, enabled = true) {
  const ui = useUiAdapters();
  const lastHandledRef = useRef<unknown>(null);

  const cleaned = useMemo(() => {
    return [...new Set(uids.map((x) => Number(x)).filter(Number.isFinite))];
  }, [uids]);

  const q = useQuery({
    queryKey: ["profile", "public-batch", cleaned],
    enabled: enabled && cleaned.length > 0,
    queryFn: () => profileApi.getPublicProfilesBatch(cleaned),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (!q.isError || !q.error) return;
    if (lastHandledRef.current === q.error) return;
    lastHandledRef.current = q.error;

    handleUiError(asNormalized(q.error), ui, { retry: q.refetch });
  }, [q.isError, q.error, q.refetch, ui]);

  const map = useMemo(() => {
    const m = new Map<string, PublicProfile>();
    for (const p of (q.data ?? []) as PublicProfile[]) {
      if (p?.uid == null) continue;
      m.set(String(p.uid), p);
    }
    return m;
  }, [q.data]);

  return { ...q, map, cleaned };
}
