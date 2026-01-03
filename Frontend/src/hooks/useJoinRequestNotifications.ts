// src/hooks/useJoinRequestNotifications.ts
import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import { groupsApi } from "@/api/groups";
import type { ApiGroup, ApiJoinRequest } from "@/api/types";

export function useJoinRequestNotifications() {
  const myGroupsQ = useQuery({
    queryKey: ["groups", "me"],
    queryFn: () => groupsApi.listMine(),
    retry: false,
  });

  const groups: ApiGroup[] = myGroupsQ.data ?? [];

  const membershipQueries = useQueries({
    queries: groups.map((g) => ({
      queryKey: ["groups", "membership", g.id],
      queryFn: () => groupsApi.getMyMembership(g.id),
      enabled: !!g?.id,
      retry: false,
    })),
  });

  const adminGroups = useMemo(() => {
    const out: Array<{ id: string; name: string; role: string }> = [];
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const mq = membershipQueries[i];
      const role = (mq.data as any)?.role as string | undefined;
      if (role === "owner" || role === "admin") out.push({ id: g.id, name: g.name, role });
    }
    return out;
  }, [groups, membershipQueries]);

  const requestsQueries = useQueries({
    queries: adminGroups.map((g) => ({
      queryKey: ["groups", "join-requests", g.id],
      queryFn: () => groupsApi.listJoinRequests(g.id),
      enabled: !!g?.id,
      retry: false,
      refetchInterval: 15000,
      refetchIntervalInBackground: true,
    })),
  });

  const pending = useMemo(() => {
    const items: Array<{
      groupId: string;
      groupName: string;
      uid: string | number;
      created_at: string;
    }> = [];

    for (let i = 0; i < adminGroups.length; i++) {
      const g = adminGroups[i];
      const rq = requestsQueries[i];

      const rows: ApiJoinRequest[] = rq.data ?? [];

      for (const r of rows) {
        items.push({
          groupId: g.id,
          groupName: g.name,
          uid: r.uid,
          created_at: r.created_at,
        });
      }
    }

    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return items;
  }, [adminGroups, requestsQueries]);

  const count = pending.length;
  const latest = pending[0] ?? null;

  const loading =
    myGroupsQ.isLoading ||
    membershipQueries.some((q) => q.isLoading) ||
    requestsQueries.some((q) => q.isLoading);

  const error =
    myGroupsQ.isError ||
    membershipQueries.some((q) => q.isError) ||
    requestsQueries.some((q) => q.isError);

  return { count, latest, pending, loading, error };
}
