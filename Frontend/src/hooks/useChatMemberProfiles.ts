// src/hooks/useChatMemberProfiles.ts
import { useEffect, useMemo } from "react";
import type { ApiGroupMember } from "@/api/types";
import { useAuthMeLite } from "@/hooks/useAuthMeLite";
import { usePublicProfilesBatch } from "@/hooks/usePublicProfilesBatch";
import { getUserAvatarUrl } from "@/api/media";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

function pickUid(m: ApiGroupMember): string | number | null {
  return (m?.uid ?? m?.userId ?? (m as any)?.user_id ?? m?.id ?? null) as any;
}

function memberLocalName(m: ApiGroupMember): string | null {
  const p: any = m?.profile || {};
  const dn =
    p.display_name ?? p.displayName ?? p.name ?? m?.displayName ?? m?.name ?? m?.username ?? null;
  return typeof dn === "string" && dn.trim() ? dn.trim() : null;
}

export type ChatMemberProfile = {
  uid: string;
  fullName: string;
  username?: string;
  avatarUrl: string | null;
};

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

export function useChatMemberProfiles(members: ApiGroupMember[], enabled = true) {
  const ui = useUiAdapters();
  const { me } = useAuthMeLite();

  const memberUids = useMemo(() => {
    const set = new Set<string>();
    for (const m of members || []) {
      const uid = pickUid(m);
      if (uid == null) continue;
      set.add(String(uid));
    }
    return Array.from(set);
  }, [members]);

  const others = useMemo(() => {
    const myUid = me?.uid != null ? String(me.uid) : null;
    return memberUids.filter((u) => (myUid ? u !== myUid : true));
  }, [memberUids, me?.uid]);

  const batch = usePublicProfilesBatch(others, enabled);

  useEffect(() => {
    if (batch.isError && batch.error) {
      const err = asNormalized(batch.error);
      handleUiError(err, ui, { retry: batch.refetch });
    }
  }, [batch.isError, batch.error, batch.refetch, ui]);

  const map = useMemo(() => {
    const out = new Map<string, ChatMemberProfile>();

    const myUid = me?.uid != null ? String(me.uid) : null;

    for (const uid of memberUids) {
      if (myUid && uid === myUid && me) {
        out.set(uid, {
          uid,
          fullName: me.fullName,
          username: me.username,
          avatarUrl: me.avatarUrl,
        });
        continue;
      }

      const member = (members || []).find((m) => String(pickUid(m)) === uid);
      const local = member ? memberLocalName(member) : null;

      const p = batch.map.get(uid);

      const username =
        (typeof p?.username === "string" && p.username.trim() ? p.username.trim() : undefined) ??
        undefined;

      const fullName =
        local ??
        (typeof p?.display_name === "string" && p.display_name.trim() ? p.display_name.trim() : "") ??
        (username ? username : "") ??
        `User #${uid}`;

      const avatarUrl =
        (typeof p?.avatar_url === "string" && p.avatar_url.trim() ? p.avatar_url.trim() : null) ??
        getUserAvatarUrl(uid);

      out.set(uid, { uid, fullName, username, avatarUrl });
    }

    return out;
  }, [memberUids, members, me, batch.map]);

  return {
    map,
    loading: batch.isLoading,
    error: batch.isError ? ((batch.error as any)?.message ?? true) : null,
  };
}
