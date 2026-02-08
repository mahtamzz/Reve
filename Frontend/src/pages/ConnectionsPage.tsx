// src/pages/ConnectionsPage.tsx
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpDown,
  ChevronLeft,
  Loader2,
  MoreHorizontal,
  Search,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import { logout } from "@/utils/authToken";

import { useProfileInfoMe } from "@/hooks/useProfileInfoMe";
import { useFollowers, useFollowing, useFollowCounts } from "@/hooks/useConnectionsLists";
import { useFollowStatus } from "@/hooks/useFollowStatus";
import { useFollowUser, useUnfollowUser } from "@/hooks/useFollowMutations";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSearchUsers } from "@/hooks/useSearchUsers";

import { getUserAvatarUrl } from "@/api/media";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Person = {
  id: string;
  uid: number;
  fullName: string;
  username: string;
  bio?: string | null;
};

type TabKey = "followers" | "following";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function toUiErrorMessage(e: unknown) {
  const err = e as any;
  if (err?.message === "SERVER_ERROR_HTML_RESPONSE") return "Server error (check backend logs).";
  if (err?.message === "UNAUTHENTICATED") return "You are not authenticated.";
  return err?.message || "Unknown error";
}

function toPerson(raw: any): Person {
  const uid = Number(raw?.uid);

  const fullName =
    raw?.display_name ??
    raw?.displayName ??
    raw?.name ??
    raw?.username ??
    `User ${Number.isFinite(uid) ? uid : ""}`.trim();

  const username = raw?.username ?? String(uid || "");
  const bio = raw?.bio ?? null;

  return {
    id: String(uid),
    uid,
    fullName: String(fullName || `User ${uid}`),
    username: String(username || uid),
    bio,
  };
}

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const meQ = useProfileInfoMe();
  const myUid = Number(meQ.data?.profile?.uid);
  const safeMyUid = Number.isFinite(myUid) && myUid > 0 ? myUid : undefined;

  // my connections
  const followersQ = useFollowers(safeMyUid);
  const followingQ = useFollowing(safeMyUid);
  const countsQ = useFollowCounts(safeMyUid);

  // mutations
  const followMut = useFollowUser({ myUid });
  const unfollowMut = useUnfollowUser({ myUid });

  // --- local optimistic state to prevent flicker ---
  // overrides for follow state in UI (uid -> isFollowing)
  const [followOverride, setFollowOverride] = useState<Record<number, boolean>>({});
  // per-user pending to avoid locking whole list
  const [pendingUids, setPendingUids] = useState<Set<number>>(new Set());

  const followers = useMemo<Person[]>(
    () => (followersQ.isError ? [] : (followersQ.data?.items ?? []).map(toPerson)),
    [followersQ.data, followersQ.isError]
  );
  const following = useMemo<Person[]>(
    () => (followingQ.isError ? [] : (followingQ.data?.items ?? []).map(toPerson)),
    [followingQ.data, followingQ.isError]
  );

  // ✅ used for "Follow back" in SEARCH mode
  const followerUidSet = useMemo(() => new Set(followers.map((p) => p.uid)), [followers]);

  const [tab, setTab] = useState<TabKey>("followers");
  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);
  const isSearchMode = debouncedQ.trim().length > 0;

  const [sort, setSort] = useState<"recent" | "name">("recent");

  // search paging
  const [searchOffset, setSearchOffset] = useState(0);
  const searchQ = useSearchUsers(debouncedQ, {
    limit: 20,
    offset: searchOffset,
    enabled: !!safeMyUid,
  });

  const searchItems = useMemo<Person[]>(
    () => (searchQ.isError ? [] : (searchQ.data?.items ?? []).map(toPerson)),
    [searchQ.data, searchQ.isError]
  );

  const baseList = isSearchMode ? searchItems : tab === "followers" ? followers : following;

  const filtered = useMemo(() => {
    if (isSearchMode) return baseList;

    const query = q.trim().toLowerCase();
    const base = !query
      ? baseList
      : baseList.filter((p) => {
          const hay = `${p.fullName} ${p.bio ?? ""}`.toLowerCase();
          return hay.includes(query);
        });

    if (sort === "name") return [...base].sort((a, b) => a.fullName.localeCompare(b.fullName));
    return base;
  }, [baseList, q, sort, isSearchMode]);

  // ✅ counts: when countsQ is OK, ONLY trust server counts to avoid bouncing
  const countFollowers = countsQ.isError
    ? followers.length
    : Number(countsQ.data?.followers ?? followers.length);

  const countFollowing = countsQ.isError
    ? following.length
    : Number(countsQ.data?.following ?? following.length);

  const showConnectionsErrorBanner = followersQ.isError || followingQ.isError || countsQ.isError;

  const isLoadingConnections =
    meQ.isLoading || followersQ.isLoading || followingQ.isLoading || countsQ.isLoading;

  const isLoadingList = isSearchMode ? searchQ.isLoading : isLoadingConnections;

  const emptyText = isSearchMode ? "No users found" : "No results";
  const emptySub = isSearchMode ? "Try a different keyword." : "Try a different search or clear the filter.";

  // --- helpers for follow/unfollow with optimistic UI ---
  const setPending = (uid: number, on: boolean) => {
    setPendingUids((prev) => {
      const next = new Set(prev);
      if (on) next.add(uid);
      else next.delete(uid);
      return next;
    });
  };

  const optimisticFollow = (uid: number) => {
    setFollowOverride((prev) => ({ ...prev, [uid]: true }));
  };

  const optimisticUnfollow = (uid: number) => {
    setFollowOverride((prev) => ({ ...prev, [uid]: false }));
  };

  const clearOverride = (uid: number) => {
    setFollowOverride((prev) => {
      if (!(uid in prev)) return prev;
      const next = { ...prev };
      delete next[uid];
      return next;
    });
  };

  // in ConnectionsPage
  const pendingRef = React.useRef<Set<number>>(new Set());

  const runOncePerUid = (uid: number, fn: () => void) => {
    if (pendingRef.current.has(uid)) return;
    pendingRef.current.add(uid);
    fn();
  };

  const clearPendingUid = (uid: number) => {
    pendingRef.current.delete(uid);
  };

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="connections" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar />

          <div className="mx-auto max-w-6xl px-4 py-5">
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Header / Controls */}
              <div className="relative p-5 sm:p-6">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-24 -right-28 h-64 w-64 rounded-full bg-yellow-200/25 blur-3xl"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-sky-200/15 blur-3xl"
                />

                <div className="relative flex flex-col gap-4">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl border border-yellow-200 bg-yellow-50 flex items-center justify-center">
                          <Users className="h-5 w-5 text-yellow-700" />
                        </div>
                        <div className="min-w-0">
                          <h1 className="text-xl font-semibold text-zinc-900">Connections</h1>
                          <p className="mt-0.5 text-sm text-zinc-500 truncate">
                            Followers, following, and global user search.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(-1)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Back
                        </button>
                      </div>
                    </div>

                    {/* Counts */}
                    <div className="shrink-0 rounded-2xl border border-zinc-200 bg-white/70 backdrop-blur px-3 py-3 shadow-sm">
                      <div className="flex items-center gap-4">
                        <CountPill label="Followers" value={countFollowers} icon={<UserCheck className="h-4 w-4" />} />
                        <CountPill label="Following" value={countFollowing} icon={<UserPlus className="h-4 w-4" />} />
                      </div>
                    </div>
                  </div>

                  {showConnectionsErrorBanner ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      Failed to load connections.{" "}
                      {followersQ.isError ? `Followers: ${toUiErrorMessage(followersQ.error)} ` : ""}
                      {followingQ.isError ? `Following: ${toUiErrorMessage(followingQ.error)} ` : ""}
                      {countsQ.isError ? `Counts: ${toUiErrorMessage(countsQ.error)}` : ""}
                    </div>
                  ) : null}

                  {/* Controls */}
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    {/* Tabs */}
                    <div className="rounded-2xl border border-zinc-200 bg-white/70 backdrop-blur p-1 flex items-center gap-1 w-full lg:w-auto">
                      <TabButton
                        active={!isSearchMode && tab === "followers"}
                        onClick={() => setTab("followers")}
                        label="Followers"
                        badge={countFollowers}
                        icon={<UserCheck className="h-4 w-4" />}
                      />
                      <TabButton
                        active={!isSearchMode && tab === "following"}
                        onClick={() => setTab("following")}
                        label="Following"
                        badge={countFollowing}
                        icon={<UserPlus className="h-4 w-4" />}
                      />
                    </div>

                    {/* Search */}
                    <div
                      className={cx(
                        "flex-1 flex items-center gap-2",
                        "rounded-2xl border border-zinc-200 bg-white",
                        "px-3 py-2 shadow-sm",
                        "transition-all duration-300",
                        "focus-within:border-yellow-400 focus-within:ring-4 focus-within:ring-yellow-200/40"
                      )}
                    >
                      <Search className="h-4 w-4 text-zinc-400" />
                      <input
                        value={q}
                        onChange={(e) => {
                          setQ(e.target.value);
                          setSearchOffset(0);
                        }}
                        placeholder={isSearchMode ? "Search all users…" : `Search ${tab}…`}
                        className="w-full bg-transparent outline-none text-sm placeholder:text-zinc-400"
                      />
                      {q ? (
                        <button
                          type="button"
                          onClick={() => {
                            setQ("");
                            setSearchOffset(0);
                          }}
                          className="h-8 w-8 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition flex items-center justify-center"
                          aria-label="Clear search"
                        >
                          <X className="h-4 w-4 text-zinc-600" />
                        </button>
                      ) : null}
                    </div>

                    {/* Sort */}
                    <button
                      type="button"
                      disabled={isSearchMode}
                      onClick={() => setSort((s) => (s === "recent" ? "name" : "recent"))}
                      className={cx(
                        "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold shadow-sm transition",
                        isSearchMode
                          ? "border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-yellow-300 hover:bg-yellow-50"
                      )}
                      title={isSearchMode ? "Sorting is disabled in global search" : ""}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                      Sort: {sort === "recent" ? "Recent" : "Name"}
                    </button>
                  </div>

                  {/* Search mode banner */}
                  {isSearchMode ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-gradient-to-r from-white to-yellow-50/50 px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-9 w-9 rounded-2xl border border-yellow-200 bg-yellow-50 flex items-center justify-center">
                          <Sparkles className="h-4 w-4 text-yellow-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-zinc-900 truncate">Global search</div>
                          <div className="text-xs text-zinc-500 truncate">
                            Query: <span className="font-semibold text-zinc-700">{debouncedQ.trim()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {searchQ.isFetching ? (
                          <span className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading…
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => {
                            setQ("");
                            setSearchOffset(0);
                          }}
                          className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
                        >
                          Exit
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {isSearchMode && searchQ.isError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      Search failed: {toUiErrorMessage(searchQ.error)}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* List area */}
              <div className="border-t border-zinc-200 bg-white">
                <div className="p-4 sm:p-6">
                  <AnimatePresence mode="popLayout">
                    {isLoadingList ? (
                      <motion.div
                        key="loading"
                        initial={reduceMotion ? undefined : { opacity: 0 }}
                        animate={reduceMotion ? undefined : { opacity: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        className="space-y-3"
                      >
                        <CompactSkeletonGrid />
                      </motion.div>
                    ) : filtered.length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                        animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                        exit={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-8 text-center"
                      >
                        <div className="mx-auto h-12 w-12 rounded-2xl border border-yellow-200 bg-yellow-50 flex items-center justify-center">
                          <Users className="h-6 w-6 text-yellow-700" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-zinc-900">{emptyText}</p>
                        <p className="mt-1 text-sm text-zinc-600">{emptySub}</p>
                        {q ? (
                          <button
                            type="button"
                            onClick={() => {
                              setQ("");
                              setSearchOffset(0);
                            }}
                            className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:border-yellow-300 hover:bg-yellow-50 transition"
                          >
                            Clear search
                          </button>
                        ) : null}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="list"
                        initial={reduceMotion ? undefined : { opacity: 0 }}
                        animate={reduceMotion ? undefined : { opacity: 1 }}
                        exit={reduceMotion ? undefined : { opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={cx(
                          "grid gap-3",
                          isSearchMode ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 md:grid-cols-2"
                        )}
                      >
                        {filtered.map((p) => (
                          <CompactPersonCard
                            key={p.id}
                            person={p}
                            mode={isSearchMode ? "search" : "connections"}
                            tab={tab}
                            isFollowerOfMe={followerUidSet.has(p.uid)} // ✅ Follow back in search
                            isPending={pendingUids.has(p.uid)}
                            followOverride={followOverride[p.uid]}
                            onView={() => navigate(`/profile/${p.uid}`)}
                            onFollow={() => {
                              runOncePerUid(p.uid, () => {
                                setPending(p.uid, true);
                                optimisticFollow(p.uid);

                                followMut.mutate(p.uid, {
                                  onError: () => optimisticUnfollow(p.uid),
                                  onSettled: () => {
                                    setPending(p.uid, false);
                                    clearPendingUid(p.uid);
                                    clearOverride(p.uid);
                                  },
                                });
                              });
                            }}
                            onUnfollow={() => {
                              if (!Number.isFinite(p.uid)) return;

                              setPending(p.uid, true);
                              optimisticUnfollow(p.uid);

                              unfollowMut.mutate(p.uid, {
                                onError: () => {
                                  // revert UI state on error
                                  optimisticFollow(p.uid);
                                },
                                onSettled: () => {
                                  setPending(p.uid, false);
                                  clearOverride(p.uid);
                                },
                              });
                            }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Load more (only in search mode) */}
                  {isSearchMode && !isLoadingList && (searchQ.data?.items?.length ?? 0) >= 20 ? (
                    <div className="mt-5 flex justify-center">
                      <button
                        type="button"
                        disabled={searchQ.isFetching}
                        onClick={() => setSearchOffset((o) => o + 20)}
                        className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:border-yellow-300 hover:bg-yellow-50 transition disabled:opacity-60"
                      >
                        {searchQ.isFetching ? "Loading…" : "Load more"}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ----------------- Small components ----------------- */

function CountPill({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-9 w-9 rounded-2xl border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-600">
        {icon}
      </div>
      <div className="leading-tight">
        <div className="text-xs text-zinc-500">{label}</div>
        <div className="text-sm font-semibold text-zinc-900">{value.toLocaleString()}</div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  badge,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge: number;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition w-full lg:w-auto",
        active ? "bg-white border border-zinc-200 text-zinc-900 shadow-sm" : "text-zinc-600 hover:bg-white/60"
      )}
    >
      <span className={cx(active ? "text-yellow-700" : "text-zinc-500")}>{icon}</span>
      {label}
      <span
        className={cx(
          "ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
          active
            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
            : "bg-zinc-100 text-zinc-600 border border-zinc-200"
        )}
      >
        {badge.toLocaleString()}
      </span>
    </button>
  );
}

/* ----------------- Skeletons ----------------- */

function CompactSkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <CompactSkeletonCard key={i} />
      ))}
    </div>
  );
}

function CompactSkeletonCard() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl border border-zinc-200 bg-zinc-100 animate-pulse" />
          <div className="min-w-0 flex-1">
            <div className="h-3.5 w-2/3 rounded bg-zinc-100 animate-pulse" />
            <div className="mt-2 h-3 w-1/3 rounded bg-zinc-100 animate-pulse" />
            <div className="mt-3 h-3 w-11/12 rounded bg-zinc-100 animate-pulse" />
          </div>
          <div className="h-9 w-9 rounded-2xl border border-zinc-200 bg-zinc-50 animate-pulse" />
        </div>

        <div className="mt-4 flex gap-2">
          <div className="h-9 flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 animate-pulse" />
          <div className="h-9 flex-1 rounded-2xl border border-zinc-200 bg-zinc-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* ----------------- Compact Person Card ----------------- */

function CompactPersonCard({
  person,
  mode,
  tab,
  isFollowerOfMe,
  isPending,
  followOverride,
  onFollow,
  onUnfollow,
  onView,
}: {
  person: Person;
  mode: "search" | "connections";
  tab: "followers" | "following";
  isFollowerOfMe: boolean;
  isPending: boolean;
  followOverride?: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onView: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const statusQ = useFollowStatus(person.uid);

  // avatar
  const [avatarOk, setAvatarOk] = React.useState(true);
  React.useEffect(() => setAvatarOk(true), [person.uid]);
  const avatarUrl = useMemo(() => getUserAvatarUrl(person.uid, { bustCache: false }), [person.uid]);

  // base status (server)
  const serverIsFollowing =
    mode === "search"
      ? (statusQ.data?.isFollowing ?? false)
      : tab === "following"
        ? true
        : (statusQ.data?.isFollowing ?? false);

  // ✅ final status = local optimistic override (if exists) else server
  const isFollowing = typeof followOverride === "boolean" ? followOverride : serverIsFollowing;

  // ✅ Follow back logic:
  // - In connections tab "followers": follow back if you're not following
  // - In search mode: follow back if that person is in YOUR followers list and you're not following
  const shouldShowFollowBack =
    !isFollowing && (mode === "search" ? isFollowerOfMe : tab === "followers");

  const primaryLabel = isFollowing ? "Unfollow" : shouldShowFollowBack ? "Follow back" : "Follow";

  const onPrimary = () => {
    if (isFollowing) onUnfollow();
    else onFollow();
  };

  return (
    <motion.div
      layout
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={onView}
            className="flex items-start gap-3 min-w-0 text-left group"
            title={`View @${person.username}`}
          >
            <div className="h-10 w-10 rounded-2xl border border-zinc-200 bg-zinc-100 overflow-hidden shrink-0">
              {avatarOk ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="h-full w-full object-cover"
                  onError={() => setAvatarOk(false)}
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(250,204,21,0.35),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.05),transparent_60%)]" />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-900 truncate group-hover:underline">
                {person.fullName}
              </div>

              {person.bio ? (
                <p className="mt-2 text-xs text-zinc-600 leading-relaxed line-clamp-2">{person.bio}</p>
              ) : (
                <p className="mt-2 text-xs text-zinc-400">No bio</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={cx(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    mode === "search"
                      ? "border-zinc-200 bg-white text-zinc-600"
                      : tab === "followers"
                        ? "border-yellow-200 bg-yellow-100/60 text-yellow-800"
                        : "border-sky-200 bg-sky-100/50 text-sky-800"
                  )}
                >
                  {mode === "search" ? "User" : tab === "followers" ? "Follower" : "Following"}
                </span>

                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                  {statusQ.isLoading ? "…" : isFollowing ? "You follow" : "Not following"}
                </span>
              </div>
            </div>
          </button>

          <button
            type="button"
            className="h-9 w-9 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 transition flex items-center justify-center"
            aria-label="More"
          >
            <MoreHorizontal className="h-4 w-4 text-zinc-600" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onView}
            className="flex-1 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:border-yellow-300 hover:bg-yellow-50 transition"
          >
            View
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={onPrimary}
            className={cx(
              "flex-1 rounded-2xl px-3 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed",
              isFollowing
                ? "border border-yellow-200 bg-yellow-100/70 text-yellow-900 hover:bg-yellow-200/70"
                : "border border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
            )}
          >
            {isPending ? "…" : primaryLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
