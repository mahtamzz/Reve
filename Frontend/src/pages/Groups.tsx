// src/pages/Groups.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Trash2 } from "lucide-react";
import { useQueries } from "@tanstack/react-query";

import { ApiError } from "@/api/client";
import type { ApiGroup } from "@/api/types";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import CreateGroupModal from "@/components/Groups/CreateGroupModal";
import { logout } from "@/utils/authToken";
import { GroupCard } from "@/components/Groups/GroupCard";

import { useMyGroupIds } from "@/hooks/useMyGroupIds";
import { useCreateGroup, useDeleteGroup, groupDetailsKey } from "@/hooks/useGroups";
import { groupsApi } from "@/api/groups";

type CreateGroupPayload = {
  name: string;
  description: string;
  privacy: "public" | "private";
  goalXp: number;
  minDailyMinutes: number;
  invites: string[];
};

function getWeeklyXp(g: ApiGroup): number {
  const anyG = g as any;
  return (anyG.weeklyXp ?? anyG.weekly_xp ?? 0) as number;
}

function mapApiGroupToCard(g: ApiGroup) {
  const goal = getWeeklyXp(g);
  return {
    id: g.id,
    name: g.name,
    score: 0,
    goal,
  };
}

function getHttpStatus(err: unknown): number | undefined {
  return err instanceof ApiError ? err.status : (err as any)?.status;
}

export default function Groups() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const newCardIdRef = useRef<string | null>(null);

  const { ids, add: addId, remove: removeId } = useMyGroupIds();

  // برای جلوگیری از remove چندباره یک id (در رندرهای متعدد)
  const cleanedIdsRef = useRef<Set<string>>(new Set());

  // ✅ هر id -> getDetails (برمی‌گردونه {group, members})
  const groupQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: groupDetailsKey(id),
      queryFn: () => groupsApi.getDetails(id),
      enabled: Boolean(id),
      retry: false,
    })),
  });

  // یک snapshot پایدار از errorها بسازیم تا useEffect بی‌دلیل روی هر رندر تریگر نشه
  const errorPairs = useMemo(() => {
    return groupQueries
      .map((q, idx) => {
        if (!q.isError) return null;
        const id = ids[idx];
        if (!id) return null;
        const status = getHttpStatus(q.error);
        return { id, status };
      })
      .filter(Boolean) as Array<{ id: string; status?: number }>;
  }, [groupQueries, ids]);

  useEffect(() => {
    for (const { id, status } of errorPairs) {
      // گروه حذف شده یا دسترسی نداری → از localStorage پاکش کن
      if (status === 404 || status === 403) {
        // فقط یک‌بار برای هر id
        if (!cleanedIdsRef.current.has(id)) {
          cleanedIdsRef.current.add(id);
          removeId(id);
        }
      }
    }
  }, [errorPairs, removeId]);

  const isLoading = groupQueries.some((q) => q.isLoading);

  // خطاهای “واقعی” (نه 403/404هایی که داریم پاک می‌کنیم)
  const realErrors = useMemo(() => {
    return groupQueries
      .map((q) => {
        if (!q.isError) return null;
        const status = getHttpStatus(q.error);
        if (status === 403 || status === 404) return null;
        return { status, error: q.error };
      })
      .filter(Boolean) as Array<{ status?: number; error: unknown }>;
  }, [groupQueries]);

  const hasRealError = realErrors.length > 0;

  const groups: ApiGroup[] = groupQueries
    .map((q) => q.data?.group)
    .filter(Boolean) as ApiGroup[];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  const createMutation = useCreateGroup();
  const deleteMutation = useDeleteGroup();

  const isCreating = createMutation.isPending;
  const createError = createMutation.error;

  const isDeleting = deleteMutation.isPending;

  const handleCreateGroup = async (payload: CreateGroupPayload) => {
    // ✅ invites فعلاً به بک نفرست (در بک endpointش نداریم)
    const created = await createMutation.mutateAsync({
      name: payload.name,
      description: payload.description || null,
      visibility: payload.privacy,
      weeklyXp: payload.goalXp ?? null,
      minimumDstMins: payload.minDailyMinutes ?? null,
    });

    addId(created.id);
    newCardIdRef.current = created.id;
    setQuery("");

    window.setTimeout(() => {
      const el = document.getElementById(`group-card-${created.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => removeId(id),
    });
  };

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="groups" onLogout={logout} />
        <div className="flex-1 min-w-0 md:ml-64">

          <div className="mx-auto max-w-6xl px-4 py-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500">My Groups</p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                  Groups
                </h1>
                <p className="mt-1 text-sm text-zinc-600">
                  Find a group to study with and stay accountable.
                </p>
              </div>

              <div className="w-full sm:w-[420px]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search groups..."
                    className="w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 py-3 text-sm text-zinc-700 shadow-sm outline-none focus:ring-2 focus:ring-yellow-300/60"
                  />
                </div>
              </div>
            </div>

            {createError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Failed to create group.
              </div>
            )}

            {isLoading && <div className="mt-6 text-sm text-zinc-600">Loading groups…</div>}

            {hasRealError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Some groups failed to load due to a server/network error.
              </div>
            )}

            {!filtered.length && !isLoading ? (
              <div className="mt-10 rounded-3xl border border-zinc-200 bg-white p-10 text-center">
                <p className="text-sm font-semibold text-zinc-900">No groups yet</p>
                <p className="mt-1 text-sm text-zinc-600">Create a group to see it here.</p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {filtered.map((g) => {
                    const uiGroup = mapApiGroupToCard(g);

                    return (
                      <motion.div
                        key={g.id}
                        layout
                        id={`group-card-${g.id}`}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={
                          newCardIdRef.current === g.id
                            ? "ring-2 ring-yellow-300/60 rounded-3xl"
                            : ""
                        }
                      >
                        <div className="relative">
                        <GroupCard
                          group={uiGroup as any}
                          onClick={() => navigate(`/groups/${g.id}`, { state: { groupName: g.name } })}
                          onDelete={() => handleDelete(g.id)}
                          deleteDisabled={isDeleting}
                        />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              disabled={isCreating}
              className="
                group fixed right-6 bottom-6 z-50 rounded-2xl
                border border-zinc-200 bg-white shadow-lg
                px-4 py-3 flex items-center gap-3
                hover:-translate-y-0.5 hover:shadow-xl hover:border-yellow-300
                transition
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              <span className="h-10 w-10 rounded-xl bg-yellow-100 border border-yellow-200 flex items-center justify-center">
                <Plus className="h-5 w-5 text-yellow-700" />
              </span>
              <div className="text-left leading-tight">
                <div className="text-sm font-semibold text-zinc-900">
                  {isCreating ? "Creating..." : "New group"}
                </div>
                <div className="text-xs text-zinc-500">Create and invite</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateGroup}
      />
    </div>
  );
}
