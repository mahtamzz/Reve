import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { profileApi } from "@/api/profile"; // همون فایلی که getPublicProfilesBatch داره

type PublicProfile = {
  uid: number;
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  timezone?: string | null;
  [k: string]: any;
};

export function usePublicProfilesBatch(uids: Array<string | number>, enabled = true) {
  const cleaned = useMemo(() => {
    const arr = [...new Set(uids.map((x) => Number(x)).filter(Number.isFinite))];
    return arr;
  }, [uids]);

  const q = useQuery({
    queryKey: ["profile", "public-batch", cleaned],
    enabled: enabled && cleaned.length > 0,
    queryFn: () => profileApi.getPublicProfilesBatch(cleaned),
    staleTime: 60_000,
    retry: false,
  });

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
