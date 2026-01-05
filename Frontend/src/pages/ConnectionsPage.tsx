// src/pages/ConnectionsPage.tsx
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Search,
  Users,
  UserCheck,
  UserPlus,
  ArrowUpDown,
  X,
  MoreHorizontal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useProfileInfoMe } from "@/hooks/useProfileInfoMe";
import { useFollowers, useFollowing, useFollowCounts } from "@/hooks/useConnectionsLists";
import { useFollowStatus } from "@/hooks/useFollowStatus";
import { useFollowUser, useUnfollowUser } from "@/hooks/useFollowMutations";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Person = {
  id: string;
  uid: number;
  fullName: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  mutuals?: number;
  lastActive?: string;
};

type TabKey = "followers" | "following";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function toUiErrorMessage(e: unknown) {
  const err = e as any;
  if (err?.message === "SERVER_ERROR_HTML_RESPONSE") return "Server error (check backend logs).";
  return err?.message || "Unknown error";
}

function toPerson(raw: any): Person {
  const uid = Number(raw?.uid);
  const fullName =
    raw?.display_name ??
    raw?.displayName ??
    raw?.name ??
    raw?.username ??
    `User ${uid}`;
  const username = raw?.username ?? String(uid);
  const avatarUrl = raw?.avatar_url ?? raw?.avatarUrl ?? null;
  const bio = raw?.bio ?? null;

  return {
    id: String(uid),
    uid,
    fullName: String(fullName),
    username: String(username),
    avatarUrl,
    bio,
    mutuals: 0,
    lastActive: undefined,
  };
}

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const meQ = useProfileInfoMe();
  const myUid = Number(meQ.data?.profile?.uid);

  const followersQ = useFollowers(Number.isFinite(myUid) ? myUid : undefined);
  const followingQ = useFollowing(Number.isFinite(myUid) ? myUid : undefined);
  const countsQ = useFollowCounts(Number.isFinite(myUid) ? myUid : undefined);

  const followMut = useFollowUser({ myUid });
  const unfollowMut = useUnfollowUser({ myUid });

  const followers = useMemo<Person[]>(
    () => (followersQ.isError ? [] : (followersQ.data?.items ?? []).map(toPerson)),
    [followersQ.data, followersQ.isError]
  );
  const following = useMemo<Person[]>(
    () => (followingQ.isError ? [] : (followingQ.data?.items ?? []).map(toPerson)),
    [followingQ.data, followingQ.isError]
  );

  const [tab, setTab] = useState<TabKey>("followers");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "name">("recent");

  const list = tab === "followers" ? followers : following;

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = !query
      ? list
      : list.filter((p) => {
          const hay = `${p.fullName} @${p.username} ${p.bio ?? ""}`.toLowerCase();
          return hay.includes(query);
        });

    if (sort === "name") return [...base].sort((a, b) => a.fullName.localeCompare(b.fullName));
    return base;
  }, [list, q, sort]);

  const countFollowers = countsQ.isError ? followers.length : (countsQ.data?.followers ?? followers.length);
  const countFollowing = countsQ.isError ? following.length : (countsQ.data?.following ?? following.length);

  const isMutating = followMut.isPending || unfollowMut.isPending;

  const showErrorBanner = followersQ.isError || followingQ.isError || countsQ.isError;

  const isLoading = meQ.isLoading || followersQ.isLoading || followingQ.isLoading || countsQ.isLoading;

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
        >
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
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-2xl border border-yellow-200 bg-yellow-50 flex items-center justify-center">
                      <Users className="h-5 w-5 text-yellow-700" />
                    </div>
                    <div>
                      <h1 className="text-xl font-semibold text-zinc-900">Connections</h1>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        Followers & people you follow.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition"
                    >
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

              {showErrorBanner ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Failed to load connections (server error).{" "}
                  {followersQ.isError ? `Followers: ${toUiErrorMessage(followersQ.error)} ` : ""}
                  {followingQ.isError ? `Following: ${toUiErrorMessage(followingQ.error)} ` : ""}
                  {countsQ.isError ? `Counts: ${toUiErrorMessage(countsQ.error)}` : ""}
                </div>
              ) : null}

              {/* Controls */}
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                {/* Tabs */}
                <div className="rounded-2xl border border-zinc-200 bg-white/70 backdrop-blur p-1 flex items-center gap-1 w-full md:w-auto">
                  <TabButton
                    active={tab === "followers"}
                    onClick={() => setTab("followers")}
                    label="Followers"
                    badge={countFollowers}
                    icon={<UserCheck className="h-4 w-4" />}
                  />
                  <TabButton
                    active={tab === "following"}
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
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={`Search ${tab}...`}
                    className="w-full bg-transparent outline-none text-sm placeholder:text-zinc-400"
                  />
                  {q ? (
                    <button
                      type="button"
                      onClick={() => setQ("")}
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
                  onClick={() => setSort((s) => (s === "recent" ? "name" : "recent"))}
                  className={cx(
                    "inline-flex items-center gap-2",
                    "rounded-2xl border border-zinc-200 bg-white",
                    "px-4 py-2 text-sm font-semibold text-zinc-700",
                    "shadow-sm hover:border-yellow-300 hover:bg-yellow-50 transition"
                  )}
                >
                  <ArrowUpDown className="h-4 w-4" />
                  Sort: {sort === "recent" ? "Recent" : "Name"}
                </button>
              </div>
            </div>
          </div>

          {/* List area */}
          <div className="border-t border-zinc-200 bg-white">
            <div className="p-4 sm:p-6">
              <AnimatePresence mode="popLayout">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={reduceMotion ? undefined : { opacity: 0 }}
                    animate={reduceMotion ? undefined : { opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600"
                  >
                    Loading connections…
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
                    <p className="mt-3 text-sm font-semibold text-zinc-900">No results</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Try a different search or clear the filter.
                    </p>
                    {q ? (
                      <button
                        type="button"
                        onClick={() => setQ("")}
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
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {filtered.map((p) => (
                      <ConnectedPersonCard
                        key={p.id}
                        person={p}
                        tab={tab}
                        isMutating={isMutating}
                        onFollow={() => followMut.mutate(p.uid)}
                        onUnfollow={() => unfollowMut.mutate(p.uid)}
                        onView={() => alert(`Open profile: @${p.username}`)}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ----------------- Components ----------------- */

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
        <div className="text-sm font-semibold text-zinc-900">
          {value.toLocaleString()}
        </div>
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
        "flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition w-full md:w-auto",
        active
          ? "bg-white border border-zinc-200 text-zinc-900 shadow-sm"
          : "text-zinc-600 hover:bg-white/60"
      )}
    >
      <span className={cx(active ? "text-yellow-700" : "text-zinc-500")}>
        {icon}
      </span>
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

function ConnectedPersonCard({
  person,
  tab,
  isMutating,
  onFollow,
  onUnfollow,
  onView,
}: {
  person: Person;
  tab: "followers" | "following";
  isMutating: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onView: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const statusQ = useFollowStatus(person.uid);

  // For "following" tab, we assume following=true (even if status endpoint errors)
  const isFollowing = tab === "following" ? true : (statusQ.data?.isFollowing ?? false);

  const primaryLabel =
    tab === "following"
      ? "Unfollow"
      : isFollowing
        ? "Unfollow"
        : "Follow back";

  const onPrimary = () => {
    if (primaryLabel === "Unfollow") onUnfollow();
    else onFollow();
  };

  return (
    <motion.div
      layout
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-12 w-12 rounded-2xl border border-zinc-200 bg-zinc-100 overflow-hidden shrink-0">
              {person.avatarUrl ? (
                <img
                  src={person.avatarUrl}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(250,204,21,0.35),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.05),transparent_60%)]" />
              )}
            </div>

            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-900 truncate">
                {person.fullName}
              </div>
              <div className="mt-0.5 text-xs text-zinc-500 truncate">
                @{person.username}
              </div>

              {person.bio ? (
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed line-clamp-2">
                  {person.bio}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                  {person.mutuals ?? 0} mutuals
                </span>

                <span
                  className={cx(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    tab === "followers"
                      ? "border-yellow-200 bg-yellow-100/60 text-yellow-800"
                      : "border-sky-200 bg-sky-100/50 text-sky-800"
                  )}
                >
                  {tab === "followers" ? "Follower" : "Following"}
                </span>

                {tab === "followers" ? (
                  <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                    {statusQ.isLoading ? "…" : isFollowing ? "You follow" : "Not following"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="h-9 w-9 rounded-2xl border border-zinc-200 bg-white hover:bg-zinc-50 transition flex items-center justify-center"
            aria-label="More"
          >
            <MoreHorizontal className="h-4 w-4 text-zinc-600" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onView}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:border-yellow-300 hover:bg-yellow-50 transition"
          >
            View
          </button>

          <button
            type="button"
            disabled={isMutating}
            onClick={onPrimary}
            className={cx(
              "rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed",
              primaryLabel === "Unfollow"
                ? "border border-yellow-200 bg-yellow-100/70 text-yellow-900 hover:bg-yellow-200/70"
                : "border border-zinc-200 bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
            )}
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
