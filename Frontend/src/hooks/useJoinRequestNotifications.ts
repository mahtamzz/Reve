// src/hooks/useJoinRequestNotifications.ts
import { useEffect, useMemo, useRef, useState } from "react";
import { groupsApi } from "@/api/groups";
import { useMyGroups } from "@/hooks/useGroups";

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

export function useJoinRequestNotifications(pollMs = 15_000, maxItems = 10) {
  const myGroupsQ = useMyGroups();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [count, setCount] = useState(0);
  const [latest, setLatest] = useState<JoinRequestNotifItem | null>(null);
  const [items, setItems] = useState<JoinRequestNotifItem[]>([]);

  const timerRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  // فقط گروه‌هایی که ممکنه join request داشته باشن
  // (private / invite_only)
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

        const all: JoinRequestNotifItem[] = [];

        for (const g of candidateGroups) {
          let role: string | null = null;
          try {
            const mem = await groupsApi.getMyMembership(g.id);
            role = mem?.role ?? null;
          } catch {
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
          } catch {
            // اگر 403 یا هرچیزی شد یعنی دسترسی نداری یا بک‌اند محدود کرده
            continue;
          }
        }

        all.sort((a, b) => toTimeMs(b.createdAt) - toTimeMs(a.createdAt));

        setCount(all.length);
        setLatest(all.length ? all[0] : null);
        setItems(all.slice(0, Math.max(1, maxItems)));
      } catch (e: any) {
        setError(e?.message || "Failed to fetch join requests");
      } finally {
        setLoading(false);
      }
    }

    tick();

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(tick, pollMs);

    return () => {
      stoppedRef.current = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [
    pollMs,
    maxItems,
    myGroupsQ.isLoading,
    myGroupsQ.isError,
    candidateGroups.map((x) => x.id).join("|"),
  ]);

  return { loading, error, count, latest, items };
}
