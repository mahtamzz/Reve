// src/hooks/useJoinRequestNotifications.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { useMyGroups } from "@/hooks/useGroups";
import { groupsApi, type JoinRequestsResponse } from "@/api/groups";

type LatestJoinRequest = {
  groupId: string;
  groupName: string;
  uid: number;
  createdAt: string;
};

function safeArray<T>(x: any): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

export function useJoinRequestNotifications(pollMs = 15_000) {
  const myGroupsQ = useMyGroups();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [count, setCount] = useState<number>(0);
  const [latest, setLatest] = useState<LatestJoinRequest | null>(null);

  const timerRef = useRef<number | null>(null);
  const stoppedRef = useRef<boolean>(false);

  const adminGroupIds = useMemo(() => {
    const groups = safeArray<any>(myGroupsQ.data);
    // We don't know exact shape; tolerate common ones:
    // - group.role / membershipRole
    // - group.my_role
    // - group.is_admin
    return groups
      .filter((g) => {
        const role = g?.role ?? g?.my_role ?? g?.membershipRole ?? null;
        const isAdminish =
          role === "owner" || role === "admin" || g?.is_admin === true || g?.is_owner === true;
        const visibility = g?.visibility ?? "public";
        return isAdminish && (visibility === "private" || visibility === "invite_only");
      })
      .map((g) => ({
        id: String(g.id ?? g.groupId ?? ""),
        name: String(g.name ?? g.title ?? "Group"),
      }))
      .filter((g) => Boolean(g.id));
  }, [myGroupsQ.data]);

  useEffect(() => {
    stoppedRef.current = false;

    async function tick() {
      if (stoppedRef.current) return;

      if (myGroupsQ.isLoading) {
        setLoading(true);
        return;
      }
      if (myGroupsQ.isError) {
        setLoading(false);
        setError("Failed to load groups");
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let total = 0;
        let best: LatestJoinRequest | null = null;

        // Fetch requests for each admin private group
        for (const g of adminGroupIds) {
          let res: JoinRequestsResponse | null = null;
          try {
            res = await groupsApi.listJoinRequests(g.id);
          } catch {
            // Not admin/owner or endpoint fails -> ignore this group for notifications
            continue;
          }

          const items = safeArray<any>(res?.items);
          total += items.length;

          // pick latest by created_at
          for (const it of items) {
            const createdAt = String(it?.created_at ?? it?.createdAt ?? "");
            const uid = Number(it?.uid);
            if (!createdAt || !Number.isFinite(uid)) continue;

            if (!best) {
              best = { groupId: g.id, groupName: g.name, uid, createdAt };
              continue;
            }

            const a = new Date(best.createdAt).getTime();
            const b = new Date(createdAt).getTime();
            if (Number.isFinite(b) && (Number.isNaN(a) || b > a)) {
              best = { groupId: g.id, groupName: g.name, uid, createdAt };
            }
          }
        }

        setCount(total);
        setLatest(best);
      } catch (e: any) {
        setError(e?.message || "Failed to fetch join requests");
      } finally {
        setLoading(false);
      }
    }

    // immediate tick
    tick();

    // poll
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(tick, pollMs);

    return () => {
      stoppedRef.current = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [pollMs, myGroupsQ.isLoading, myGroupsQ.isError, adminGroupIds.map((x) => x.id).join("|")]);

  return { loading, error, count, latest, adminGroupIds };
}
