// src/hooks/useJoinRequestNotifications.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { groupsApi } from "@/api/groups";
import { useMyGroups } from "@/hooks/useGroups";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

export type JoinRequestNotifItem = {
  groupId: string;
  groupName: string;
  uid: number;
  createdAt: string;
};

function safeArray<T>(x: any): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

function toTimeMs(s: string) {
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : 0;
}

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

function isAuthish(err: NormalizedError) {
  return err.type === "auth" || err.type === "permission" || err.status === 401 || err.status === 403;
}

/** -------------------------
 * Global storm protection
 * ------------------------*/
let GLOBAL_OWNER_ID: symbol | null = null;
let GLOBAL_IN_FLIGHT = false;
let GLOBAL_BACKOFF_MS = 0;
let GLOBAL_LAST_FINISH_AT = 0;

// Role cache across mounts: groupId -> { role, at }
const ROLE_CACHE = new Map<string, { role: string | null; at: number }>();

function getCachedRole(groupId: string, ttlMs: number): string | null | undefined {
  const v = ROLE_CACHE.get(groupId);
  if (!v) return undefined;
  if (Date.now() - v.at > ttlMs) return undefined;
  return v.role;
}

function setCachedRole(groupId: string, role: string | null) {
  ROLE_CACHE.set(groupId, { role, at: Date.now() });
}

/**
 * Poll join requests for groups where user is admin/owner.
 *
 * Key: bounded requests even with many groups + multi-mount safe.
 */
export function useJoinRequestNotifications(basePollMs = 15_000, maxItems = 10) {
  const ui = useUiAdapters();
  const myGroupsQ = useMyGroups();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [count, setCount] = useState(0);
  const [latest, setLatest] = useState<JoinRequestNotifItem | null>(null);
  const [items, setItems] = useState<JoinRequestNotifItem[]>([]);

  const stoppedRef = useRef(false);
  const localInFlightRef = useRef(false);

  // This instance identity (for global ownership)
  const selfIdRef = useRef<symbol>(Symbol("join-req-poller"));

  // Round-robin cursor so we don't hit all groups every tick
  const cursorRef = useRef(0);

  // Throttle UI errors globally-ish per hook instance (and avoid repeated same error ref)
  const lastHandledRef = useRef<unknown>(null);
  const lastUiAtRef = useRef(0);
  const canShowUi = (gapMs = 15_000) => {
    const now = Date.now();
    if (now - lastUiAtRef.current < gapMs) return false;
    lastUiAtRef.current = now;
    return true;
  };

  const candidateGroups = useMemo(() => {
    const groups = safeArray<any>(myGroupsQ.data);
    return groups
      .map((g) => ({
        id: String(g?.id ?? ""),
        name: String(g?.name ?? "Group"),
        visibility: String(g?.visibility ?? "public"),
      }))
      .filter((g) => Boolean(g.id) && (g.visibility === "private" || g.visibility === "invite_only"));
  }, [myGroupsQ.data]);

  const reportErr = useCallback(
    (e: unknown) => {
      if (!e) return;
      if (lastHandledRef.current === e) return;
      lastHandledRef.current = e;

      const err = asNormalized(e);
      if (isAuthish(err)) return; // don't spam auth/permission here

      if (!canShowUi()) return;

      // IMPORTANT: do NOT pass retry: tick (avoid retry->storm)
      handleUiError(err, ui);
    },
    [ui]
  );

  const becomeOwnerIfFree = useCallback(() => {
    if (GLOBAL_OWNER_ID == null) {
      GLOBAL_OWNER_ID = selfIdRef.current;
    }
    return GLOBAL_OWNER_ID === selfIdRef.current;
  }, []);

  const releaseOwner = useCallback(() => {
    if (GLOBAL_OWNER_ID === selfIdRef.current) {
      GLOBAL_OWNER_ID = null;
    }
  }, []);

  const tick = useCallback(async () => {
    if (stoppedRef.current) return;

    // Only one mounted instance should actually do network work.
    const iAmOwner = becomeOwnerIfFree();
    if (!iAmOwner) return;

    // Global & local overlap guards
    if (GLOBAL_IN_FLIGHT) return;
    if (localInFlightRef.current) return;

    // Backpressure: if we just finished, wait a bit
    const minGap = 1_000;
    if (Date.now() - GLOBAL_LAST_FINISH_AT < minGap) return;

    // Apply global backoff on persistent errors
    if (GLOBAL_BACKOFF_MS > 0) {
      const since = Date.now() - GLOBAL_LAST_FINISH_AT;
      if (since < GLOBAL_BACKOFF_MS) return;
    }

    GLOBAL_IN_FLIGHT = true;
    localInFlightRef.current = true;

    try {
      // If groups query still loading, don't hammer anything
      if (myGroupsQ.isLoading) {
        setLoading(true);
        return;
      }

      if (myGroupsQ.isError) {
        setLoading(false);
        setError("Failed to load groups");
        reportErr(myGroupsQ.error);
        // backoff a bit
        GLOBAL_BACKOFF_MS = Math.min(60_000, Math.max(GLOBAL_BACKOFF_MS * 2, 5_000));
        return;
      }

      if (!candidateGroups.length) {
        setLoading(false);
        setError(null);
        setCount(0);
        setLatest(null);
        setItems([]);
        GLOBAL_BACKOFF_MS = 0;
        return;
      }

      setLoading(true);
      setError(null);

      // ---- Bounded fan-out knobs ----
      const ROLE_TTL_MS = 5 * 60_000; // 5 minutes
      const GROUPS_PER_TICK = 3;      // ✅ only check 3 groups per tick
      const MAX_ITEMS = Math.max(1, maxItems);

      // Pick a slice in round-robin fashion
      const n = candidateGroups.length;
      const start = cursorRef.current % n;
      const picked: Array<{ id: string; name: string }> = [];

      for (let i = 0; i < Math.min(GROUPS_PER_TICK, n); i++) {
        const idx = (start + i) % n;
        picked.push({ id: candidateGroups[idx].id, name: candidateGroups[idx].name });
      }

      cursorRef.current = (start + picked.length) % n;

      const all: JoinRequestNotifItem[] = [];

      for (const g of picked) {
        if (stoppedRef.current) return;

        // 1) role (cached)
        let role = getCachedRole(g.id, ROLE_TTL_MS);

        if (role === undefined) {
          try {
            const mem = await groupsApi.getMyMembership(g.id);
            role = mem?.role ?? null;
            setCachedRole(g.id, role);
          } catch (e) {
            // cache null briefly to avoid immediate re-hammering on failures
            setCachedRole(g.id, null);
            reportErr(e);
            continue;
          }
        }

        const isAdminish = role === "owner" || role === "admin";
        if (!isAdminish) continue;

        // 2) join requests
        try {
          const res = await groupsApi.listJoinRequests(g.id);
          const reqs = safeArray<any>(res?.items);

          for (const it of reqs) {
            const createdAt = String(it?.created_at ?? it?.createdAt ?? "");
            const uid = Number(it?.uid);
            if (!createdAt || !Number.isFinite(uid)) continue;

            all.push({
              groupId: g.id,
              groupName: g.name,
              uid,
              createdAt,
            });
          }
        } catch (e) {
          reportErr(e);
          continue;
        }
      }

      // Merge with existing items to avoid “missing” old ones when round-robin
      // Keep only newest per (groupId, uid, createdAt)
      const merged = [...all, ...items];
      const dedup = new Map<string, JoinRequestNotifItem>();
      for (const it of merged) {
        const key = `${it.groupId}:${it.uid}:${it.createdAt}`;
        if (!dedup.has(key)) dedup.set(key, it);
      }

      const finalAll = Array.from(dedup.values()).sort((a, b) => toTimeMs(b.createdAt) - toTimeMs(a.createdAt));

      setCount(finalAll.length);
      setLatest(finalAll.length ? finalAll[0] : null);
      setItems(finalAll.slice(0, MAX_ITEMS));

      // success => reset backoff
      GLOBAL_BACKOFF_MS = 0;
    } catch (e) {
      const err = asNormalized(e);
      setError(err.message || "Failed to fetch join requests");
      reportErr(e);
      GLOBAL_BACKOFF_MS = Math.min(60_000, Math.max(GLOBAL_BACKOFF_MS * 2, 5_000));
    } finally {
      setLoading(false);
      localInFlightRef.current = false;
      GLOBAL_IN_FLIGHT = false;
      GLOBAL_LAST_FINISH_AT = Date.now();
    }
  }, [
    becomeOwnerIfFree,
    candidateGroups,
    items,
    maxItems,
    myGroupsQ.isLoading,
    myGroupsQ.isError,
    myGroupsQ.error,
    reportErr,
  ]);

  // setTimeout loop (never piles up)
  useEffect(() => {
    stoppedRef.current = false;

    let t: number | null = null;

    const loop = async () => {
      await tick();

      if (stoppedRef.current) return;

      const delay = Math.max(1_000, basePollMs + GLOBAL_BACKOFF_MS);
      t = window.setTimeout(loop, delay);
    };

    loop();

    return () => {
      stoppedRef.current = true;
      if (t) window.clearTimeout(t);
      t = null;
      // if this instance was owner, release ownership
      releaseOwner();
    };
  }, [basePollMs, tick, releaseOwner]);

  return { loading, error, count, latest, items };
}
