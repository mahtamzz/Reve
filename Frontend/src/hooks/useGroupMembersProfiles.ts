// src/hooks/useGroupMembersProfiles.ts
import { useEffect, useMemo } from "react";
import type { ApiGroupMember } from "@/api/types";
import { usePublicProfilesBatch } from "@/hooks/usePublicProfilesBatch";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

function pickUid(m: ApiGroupMember): string | number | null {
  return (m?.uid ?? m?.userId ?? (m as any)?.user_id ?? m?.id ?? null) as any;
}

function hasSomeProfile(m: ApiGroupMember) {
  const p: any = m?.profile || {};
  const dn = p.display_name ?? p.displayName ?? p.name ?? null;
  const un = p.username ?? null;
  const av = p.avatar_url ?? p.avatarUrl ?? null;
  return Boolean(
    (typeof dn === "string" && dn.trim()) ||
      (typeof un === "string" && un.trim()) ||
      (typeof av === "string" && av.trim())
  );
}

export type MemberProfileLite = {
  name: string;
  username?: string;
  avatar_url?: string;
};

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

export function useGroupMembersProfiles(members: ApiGroupMember[], enabled = true) {
  const ui = useUiAdapters();

  const uids = useMemo(() => {
    const set = new Set<string>();

    for (const m of members || []) {
      const uid = pickUid(m);
      if (uid == null) continue;

      if (!hasSomeProfile(m)) set.add(String(uid));
    }

    return Array.from(set);
  }, [members]);

  const batch = usePublicProfilesBatch(uids, enabled);

  useEffect(() => {
    if (batch.isError && batch.error) {
      handleUiError(asNormalized(batch.error), ui, { retry: batch.refetch });
    }
  }, [batch.isError, batch.error, batch.refetch, ui]);

  const profileMap = useMemo(() => {
    const out = new Map<string, MemberProfileLite>();

    for (const uid of uids) {
      const p = batch.map.get(String(uid));
      if (!p) continue;

      const name =
        (typeof p.display_name === "string" && p.display_name.trim() ? p.display_name.trim() : null) ||
        (typeof p.username === "string" && p.username.trim() ? `@${p.username.replace(/^@/, "")}` : null) ||
        `User #${uid}`;

      out.set(String(uid), {
        name,
        username: typeof p.username === "string" && p.username.trim() ? p.username.trim() : undefined,
        avatar_url: typeof p.avatar_url === "string" && p.avatar_url.trim() ? p.avatar_url.trim() : undefined,
      });
    }

    return out;
  }, [uids, batch.map]);

  return {
    profileMap,
    isLoading: batch.isLoading,
    hasError: batch.isError,
  };
}
