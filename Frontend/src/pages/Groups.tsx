// src/pages/Groups.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Hash } from "lucide-react";

import { groupsClient } from "@/api/client";
import type { ApiGroup, GroupVisibility } from "@/api/types";
import type { CreateGroupPayload } from "@/components/Groups/CreateGroupModal";


import Sidebar from "@/components/Dashboard/SidebarIcon";
import CreateGroupModal from "@/components/Groups/CreateGroupModal";
import { logout } from "@/utils/authToken";
import { GroupCard } from "@/components/Groups/GroupCard";

import { useCreateGroup, useDeleteGroup, useDiscoverGroups, useMyGroups } from "@/hooks/useGroups";



function mapApiGroupToCard(g: ApiGroup) {
  return {
    id: g.id,
    name: g.name,
    // backend does not provide score yet => keep 0
    score: 0,
  };
}

function matchLoose(g: ApiGroup, q: string) {
  const qq = q.trim().toLowerCase();
  if (!qq) return true;
  const name = (g.name || "").toLowerCase();
  const desc = (g.description || "").toLowerCase();
  return name.includes(qq) || desc.includes(qq);
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, q }: { text: string; q: string }) {
  const qq = q.trim();
  if (!qq) return <>{text}</>;

  const re = new RegExp(escapeRegExp(qq), "ig");
  const parts = text.split(re);
  const matches = text.match(re) ?? [];

  if (matches.length === 0) return <>{text}</>;

  const out: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    out.push(<span key={`p-${i}`}>{parts[i]}</span>);
    if (i < matches.length) {
      out.push(
        <span
          key={`m-${i}`}
          className="rounded-md bg-yellow-100 px-1 py-0.5 font-semibold text-zinc-900"
        >
          {matches[i]}
        </span>
      );
    }
  }
  return <>{out}</>;
}

async function fetchDiscoverPage(limit: number, offset: number) {
  return groupsClient.get<ApiGroup[]>(`/groups?limit=${limit}&offset=${offset}`);
}

export default function Groups() {
  const navigate = useNavigate();

  // search input
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(query.trim()), 120);
    return () => window.clearTimeout(t);
  }, [query]);

  // dropdown (autocomplete)
  const [openSuggest, setOpenSuggest] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // suggestion data (client-side)
  const [suggestions, setSuggestions] = useState<ApiGroup[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState(false);
  const lastSuggestQRef = useRef<string>("");

  // create modal
  const [createOpen, setCreateOpen] = useState(false);
  const newCardIdRef = useRef<string | null>(null);

  // ✅ My Groups from API (/groups/me)
  const myGroupsQuery = useMyGroups();
  const myGroupsLoading = myGroupsQuery.isLoading;
  const myGroupsError = myGroupsQuery.isError ? myGroupsQuery.error : null;
  const myGroups: ApiGroup[] = (myGroupsQuery.data ?? []) as ApiGroup[];

  // Discover groups (public list)
  const discoverQuery = useDiscoverGroups(20, 0);
  const allGroups = (discoverQuery.data ?? []) as ApiGroup[];

  // --------- Mutations ----------
  const createMutation = useCreateGroup();
  const deleteMutation = useDeleteGroup();

  const isCreating = createMutation.isPending;
  const createError = createMutation.error;

  const isDeleting = deleteMutation.isPending;
  const deleteError = deleteMutation.error;

  const handleCreateGroup = async (payload: CreateGroupPayload) => {
    const created = await createMutation.mutateAsync({
      name: payload.name,
      description: payload.description || null,
      visibility: payload.visibility,
      minimumDstMins: payload.minimumDstMins ?? null,
    });
  
    newCardIdRef.current = created.id;
    setQuery("");
  
    window.setTimeout(() => {
      const el = document.getElementById(`group-card-${created.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };
  

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const myCards = useMemo(() => myGroups.map(mapApiGroupToCard), [myGroups]);
  const allCards = useMemo(() => allGroups.map(mapApiGroupToCard), [allGroups]);

  useEffect(() => {
    if (!openSuggest) return;
    const onDown = (e: MouseEvent) => {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpenSuggest(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [openSuggest]);

  // ESC closes suggest
  useEffect(() => {
    if (!openSuggest) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenSuggest(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSuggest]);

  // suggestions: client-side scan over discover pages (kept as-is)
  useEffect(() => {
    const q = debouncedQ.trim();
    lastSuggestQRef.current = q;

    if (!q || !openSuggest) {
      setSuggestions([]);
      setSuggestLoading(false);
      setSuggestError(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setSuggestLoading(true);
      setSuggestError(false);

      try {
        const LIMIT = 50;
        const MAX_PAGES = 10;
        const TARGET = 8;

        const found: ApiGroup[] = [];
        const seen = new Set<string>();

        for (let page = 0; page < MAX_PAGES; page++) {
          if (cancelled) return;
          if (lastSuggestQRef.current !== q) return;

          const offset = page * LIMIT;
          const rows = await fetchDiscoverPage(LIMIT, offset);

          for (const g of rows) {
            if (!g?.id || seen.has(g.id)) continue;
            if (matchLoose(g, q)) {
              seen.add(g.id);
              found.push(g);
              if (found.length >= TARGET) break;
            }
          }

          if (found.length >= TARGET) break;
          if (rows.length < LIMIT) break;
        }

        if (cancelled) return;
        if (lastSuggestQRef.current !== q) return;

        setSuggestions(found);
      } catch {
        if (cancelled) return;
        setSuggestError(true);
        setSuggestions([]);
      } finally {
        if (!cancelled) setSuggestLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQ, openSuggest]);

  const openFromSuggest = (g: ApiGroup) => {
    setOpenSuggest(false);
    navigate(`/groups/${g.id}`, { state: { groupName: g.name } });
  };

  const showSuggest = openSuggest && debouncedQ.trim().length > 0;

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="groups" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64">
          <div className="mx-auto max-w-6xl px-4 py-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500">Groups</p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                  Groups
                </h1>
                <p className="mt-1 text-sm text-zinc-600">
                  Type to get instant suggestions (name/description).
                </p>
              </div>

              {/* Search */}
              <div className="w-full sm:w-[420px]" ref={wrapRef}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setOpenSuggest(true);
                    }}
                    onFocus={() => setOpenSuggest(true)}
                    placeholder="Search groups..."
                    className="
                      w-full rounded-2xl border border-zinc-200 bg-white
                      pl-11 pr-4 py-3 text-sm text-zinc-700 shadow-sm outline-none
                      focus:ring-2 focus:ring-yellow-300/60
                    "
                  />

                  <AnimatePresence>
                    {showSuggest && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.99 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="
                          absolute left-0 right-0 top-[calc(100%+10px)]
                          z-50 overflow-hidden
                          rounded-3xl border border-zinc-200/80
                          bg-white/90 backdrop-blur-xl
                          shadow-[0_18px_60px_-35px_rgba(0,0,0,0.55)]
                        "
                        role="dialog"
                        aria-label="Group suggestions"
                      >
                        <div className="max-h-[340px] overflow-auto">
                          {suggestLoading ? (
                            <div className="px-4 py-4 text-sm text-zinc-600">Searching…</div>
                          ) : suggestError ? (
                            <div className="px-4 py-4 text-sm text-rose-700">
                              Couldn’t load suggestions.
                            </div>
                          ) : suggestions.length === 0 ? (
                            <div className="px-4 py-4 text-sm text-zinc-600">No suggestions.</div>
                          ) : (
                            <ul className="p-2">
                              {suggestions.map((g) => (
                                <li key={g.id}>
                                  <button
                                    type="button"
                                    onClick={() => openFromSuggest(g)}
                                    className="
                                      w-full text-left
                                      rounded-2xl px-3 py-3
                                      hover:bg-yellow-50/60
                                      transition
                                      flex items-start gap-3
                                    "
                                  >
                                    <span className="mt-0.5 h-9 w-9 shrink-0 rounded-2xl border border-zinc-200 bg-white flex items-center justify-center">
                                      <Hash className="h-4 w-4 text-zinc-500" />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold text-zinc-900 truncate">
                                        <Highlight text={g.name} q={debouncedQ} />
                                      </p>
                                      <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                                        <Highlight
                                          text={g.description || "No description"}
                                          q={debouncedQ}
                                        />
                                      </p>
                                    </div>

                                    <span
                                      className="
                                        shrink-0 text-[10px] font-semibold
                                        rounded-full border border-zinc-200
                                        bg-white px-2 py-1 text-zinc-600
                                      "
                                    >
                                      {g.visibility}
                                    </span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent" />

                        <div className="px-4 py-3 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setOpenSuggest(false)}
                            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition"
                          >
                            Close
                          </button>
                          <span className="text-[11px] text-zinc-500">
                            Press <span className="font-semibold">Esc</span> to close
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Errors */}
            {createError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Failed to create group.
              </div>
            )}

            {deleteError && (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Failed to delete group. (Maybe you are not the owner.)
              </div>
            )}

            {/* -------- My Groups Section -------- */}
            <div className="mt-10">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="mt-0.5 text-xs text-zinc-500">Groups you belong to.</p>
                </div>
              </div>

              {myGroupsLoading && (
                <div className="mt-4 text-sm text-zinc-600">Loading your groups…</div>
              )}

              {myGroupsError && (
                <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  Some of your groups failed to load due to server/network error.
                </div>
              )}

              {!myCards.length && !myGroupsLoading ? (
                <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-10 text-center">
                  <p className="text-sm font-semibold text-zinc-900">No groups yet</p>
                  <p className="mt-1 text-sm text-zinc-600">Create a group to see it here.</p>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatePresence mode="popLayout">
                    {myCards.map((uiGroup) => (
                      <motion.div
                        key={uiGroup.id}
                        layout
                        id={`group-card-${uiGroup.id}`}
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={
                          newCardIdRef.current === uiGroup.id
                            ? "ring-2 ring-yellow-300/60 rounded-3xl"
                            : ""
                        }
                      >
                        <GroupCard
                          group={uiGroup as any}
                          onClick={() =>
                            navigate(`/groups/${uiGroup.id}`, {
                              state: { groupName: uiGroup.name },
                            })
                          }
                          onDelete={() => handleDelete(uiGroup.id)}
                          deleteDisabled={isDeleting}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Floating Create Button */}
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

            <footer className="mt-12 text-center text-xs text-zinc-400">REVE dashboard</footer>
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
