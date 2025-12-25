import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Trash2 } from "lucide-react";
import { useQueries } from "@tanstack/react-query";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import CreateGroupModal from "@/components/Groups/CreateGroupModal";
import { logout } from "@/utils/authToken";
import { GroupCard } from "@/components/Groups/GroupCard";

import { useMyGroupIds } from "@/hooks/useMyGroupIds";
import { useCreateGroup, useDeleteGroup, groupByIdKey } from "@/hooks/useGroups";
import { groupsApi } from "@/api/groups";
import type { ApiGroup } from "@/api/types";

type CreateGroupPayload = {
  name: string;
  description: string;
  privacy: "public" | "private";
  goalXp: number;
  minDailyMinutes: number;
  invites: string[];
};

function mapApiGroupToCard(g: ApiGroup) {
  return {
    id: g.id,
    name: g.name,
    score: 0,
    goal: g.weekly_xp ?? 0,
  };
}

export default function Groups() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const newCardIdRef = useRef<string | null>(null);

  // ✅ ids از localStorage
  const { ids, add: addId, remove: removeId } = useMyGroupIds();

  // ✅ چندتا GET /groups/:id همزمان
  const groupQueries = useQueries({
    queries: ids.map((id) => ({
      queryKey: groupByIdKey(id),
      queryFn: () => groupsApi.getById(id),
      enabled: !!id,
      retry: false,
    })),
  });

  const isLoading = groupQueries.some((q) => q.isLoading);
  const hasError = groupQueries.some((q) => q.isError);

  const groups: ApiGroup[] = groupQueries
    .map((q) => q.data)
    .filter(Boolean) as ApiGroup[];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  const { mutate: createGroup, isPending: isCreating, error: createError } = useCreateGroup();
  const { mutate: deleteGroup, isPending: isDeleting } = useDeleteGroup();

  const handleCreateGroup = (payload: CreateGroupPayload) => {
    createGroup(
      {
        name: payload.name,
        description: payload.description || null,
        weekly_xp: payload.goalXp ?? null,
        minimum_dst_mins: payload.minDailyMinutes ?? null,
      },
      {
        onSuccess: (created) => {
          // ✅ id جدید رو ذخیره کن تا لیست صفحه داشته باشه
          addId(created.id);
          newCardIdRef.current = created.id;

          setQuery("");
          setCreateOpen(false);

          window.setTimeout(() => {
            const el = document.getElementById(`group-card-${created.id}`);
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 120);
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteGroup(id, {
      onSuccess: () => {
        // ✅ از localStorage حذفش کن تا از UI بره
        removeId(id);
      },
    });
  };

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="groups" onLogout={logout} />
        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar username={"User"} />

          <div className="mx-auto max-w-6xl px-4 py-6">
            {/* header */}
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

            {/* create error */}
            {createError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Failed to create group.
              </div>
            )}

            {/* load / error */}
            {isLoading && (
              <div className="mt-6 text-sm text-zinc-600">Loading groups…</div>
            )}

            {hasError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Some groups failed to load (maybe deleted or no access).
              </div>
            )}

            {/* empty */}
            {!filtered.length && !isLoading ? (
              <div className="mt-10 rounded-3xl border border-zinc-200 bg-white p-10 text-center">
                <p className="text-sm font-semibold text-zinc-900">No groups yet</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Create a group to see it here.
                </p>
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
                            onClick={() =>
                              navigate(`/groups/${g.id}`, {
                                state: { groupName: g.name },
                              })
                            }
                          />

                          <button
                            type="button"
                            title="Delete group"
                            disabled={isDeleting}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(g.id);
                            }}
                            className="
                              absolute right-3 top-3
                              rounded-xl border border-zinc-200 bg-white/90
                              p-2 text-zinc-600 shadow-sm
                              hover:text-rose-600 hover:border-rose-200
                              transition
                              disabled:opacity-60 disabled:cursor-not-allowed
                            "
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* floating create */}
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
