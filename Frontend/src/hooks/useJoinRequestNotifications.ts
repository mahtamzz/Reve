// src/hooks/useJoinRequestNotifications.ts
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
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

export function useJoinRequestNotifications(pollMs = 15_000, maxItems = 10) {
  const ui = useUiAdapters();
  const myGroupsQ = useMyGroups();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [count, setCount] = useState(0);
  const [latest, setLatest] = useState<JoinRequestNotifItem | null>(null);
  const [items, setItems] = useState<JoinRequestNotifItem[]>([]);

  const timerRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  const lastHandledRef = useRef<unknown>(null);

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

  const tick = useCallback(async () => {
    if (stoppedRef.current) return;

    if (myGroupsQ.isLoading) {
      setLoading(true);
      return;
    }

    if (myGroupsQ.isError) {
      setLoading(false);
      setError("Failed to load groups");

      if (myGroupsQ.error && lastHandledRef.current !== myGroupsQ.error) {
        lastHandledRef.current = myGroupsQ.error;
        handleUiError(asNormalized(myGroupsQ.error), ui, { retry: myGroupsQ.refetch });
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const all: JoinRequestNotifItem[] = [];

      for (const g of candidateGroups) {
        let role: string | null = null;

        try {
          const mem = await groupsApi.getMyMembership(g.id);
          role = mem?.role ?? null;
        } catch (e) {
          const err = asNormalized(e);

          const authish =
            err.type === "auth" ||
            err.type === "permission" ||
            err.status === 401 ||
            err.status === 403;

          if (!authish && lastHandledRef.current !== e) {
            lastHandledRef.current = e;
            handleUiError(err, ui, { retry: tick });
          }
          continue;
        }

        const isAdminish = role === "owner" || role === "admin";
        if (!isAdminish) continue;

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
          const err = asNormalized(e);

          const authish =
            err.type === "auth" ||
            err.type === "permission" ||
            err.status === 401 ||
            err.status === 403;

          if (!authish && lastHandledRef.current !== e) {
            lastHandledRef.current = e;
            handleUiError(err, ui, { retry: tick });
          }

          continue;
        }
      }

      all.sort((a, b) => toTimeMs(b.createdAt) - toTimeMs(a.createdAt));

      setCount(all.length);
      setLatest(all.length ? all[0] : null);
      setItems(all.slice(0, Math.max(1, maxItems)));
    } catch (e) {
      const err = asNormalized(e);

      setError(err.message || "Failed to fetch join requests");

      if (lastHandledRef.current !== e) {
        lastHandledRef.current = e;
        handleUiError(err, ui, { retry: tick });
      }
    } finally {
      setLoading(false);
    }
  }, [candidateGroups, maxItems, myGroupsQ.isLoading, myGroupsQ.isError, myGroupsQ.error, myGroupsQ.refetch, ui]);

  useEffect(() => {
    stoppedRef.current = false;

    tick();

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(tick, pollMs);

    return () => {
      stoppedRef.current = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [pollMs, tick]);

  return { loading, error, count, latest, items };
}
