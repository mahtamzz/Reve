// src/hooks/useGroupMembersProfiles.ts
import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import type { ApiGroupMember, User } from "@/api/types";
import { profileClient } from "@/api/client";

function pickUid(m: ApiGroupMember): string | number | null {
  return (m?.uid ?? m?.userId ?? (m as any)?.user_id ?? null) as any;
}

// ✅ اگر endpoint پروفایل شما چیز دیگری است فقط این را عوض کن:
async function fetchUserByUid(uid: string | number): Promise<User> {
  return profileClient.get<User>(`/users/${uid}`);
}

export function useGroupMembersProfiles(members: ApiGroupMember[]) {
  const uids = useMemo(() => {
    const set = new Set<string>();
    for (const m of members || []) {
      const uid = pickUid(m);
      if (uid == null) continue;
      set.add(String(uid));
    }
    return Array.from(set);
  }, [members]);

  const queries = useQueries({
    queries: uids.map((uid) => ({
      queryKey: ["profile", "user", uid] as const,
      queryFn: () => fetchUserByUid(uid),
      staleTime: 60_000,
      retry: false,
      enabled: Boolean(uid),
    })),
  });

  const map = useMemo(() => {
    const out = new Map<string, { name: string; username?: string; avatar_url?: string }>();
    for (let i = 0; i < uids.length; i++) {
      const uid = uids[i];
      const q = queries[i];
      const u = q.data as any;

      if (!u) continue;

      const name =
        u.name ||
        u.username ||
        u.email ||
        `User #${uid}`;

      out.set(String(uid), {
        name: String(name),
        username: u.username ? String(u.username) : undefined,
        avatar_url: u.avatar_url ? String(u.avatar_url) : undefined,
      });
    }
    return out;
  }, [queries, uids]);

  const isLoading = queries.some((q) => q.isLoading);
  const hasError = queries.some((q) => q.isError);

  return { profileMap: map, isLoading, hasError };
}
