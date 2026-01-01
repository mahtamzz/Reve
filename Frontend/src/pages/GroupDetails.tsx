// src/pages/GroupDetails.tsx

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Lock, Globe } from "lucide-react";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import { logout } from "@/utils/authToken";

import LookAtBuddy from "@/components/LookAtBuddy";
import { MemberCard, type Member } from "@/components/Groups/MemberCard";

import { useGroupDetails, useJoinGroup, useMyMembership } from "@/hooks/useGroups";
import type { ApiGroupMember } from "@/api/types";
import { ApiError } from "@/api/client";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

function StatCard({
  label,
  value,
  suffix,
  valueClassName = "text-zinc-900",
}: {
  label: string;
  value: React.ReactNode;
  suffix?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 shadow-sm">
      <p className="text-[11px] font-semibold text-zinc-500">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums tracking-tight ${valueClassName}`}>
        {value}
      </p>
      {suffix ? <p className="mt-1 text-[11px] text-zinc-500">{suffix}</p> : null}
    </div>
  );
}

function MiniSectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        {subtitle ? <p className="mt-0.5 text-xs text-zinc-500">{subtitle}</p> : null}
      </div>
      {right ? (
        <div className="shrink-0 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
          {right}
        </div>
      ) : null}
    </div>
  );
}

function placeholderAvatar(seed: string) {
  const s = encodeURIComponent(seed || "member");
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${s}`;
}

function mapMember(m: ApiGroupMember, idx: number): Member {
  const id = String(m.id ?? m.uid ?? m.userId ?? idx);
  const name = String(m.username ?? m.displayName ?? m.name ?? `Member ${idx + 1}`);
  const avatarUrl = String(m.avatarUrl ?? m.avatar_url ?? placeholderAvatar(id));
  const time = String(m.time ?? m.studyTime ?? m.study_time ?? "--:--:--");
  const online = Boolean(m.online);

  return { id, name, avatarUrl, time, online };
}

function getHttpStatus(err: unknown): number | undefined {
  return err instanceof ApiError ? err.status : (err as any)?.status;
}

export default function GroupDetails() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const groupNameFromState = (location.state as { groupName?: string } | null)?.groupName;

  const [membersOpen, setMembersOpen] = useState(false);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);

  const gid = groupId || "";

  // ✅ 1) membership check (always)
  const membershipQ = useMyMembership(gid);
  const isMember = Boolean(membershipQ.data?.isMember);

  // ✅ 2) fetch group details:
  // - if member => definitely fetch
  // - if not member => try fetch anyway (public ok, private may 403)
  const detailsQ = useGroupDetails(gid, Boolean(gid));
  const { data, isLoading, isError, error } = detailsQ;

  useEffect(() => {
    if (!membersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMembersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [membersOpen]);

  const group = data?.group;

  const title = group?.name ?? groupNameFromState ?? "Group";

  const visibility = group?.visibility ?? "private";
  const isPrivate = visibility === "private";

  const description =
    group?.description ??
    (isPrivate
      ? "This is a private group. Join to see full details."
      : "A focused space to study together, keep streaks, and stay accountable.");

  // member-only computed
  const members = useMemo(() => (data?.members ?? []).map(mapMember), [data?.members]);
  const previewMembers = useMemo(() => members.slice(0, 4), [members]);

  const minimumDailyMinutes = group?.minimum_dst_mins ?? null;
  const weeklyXp = group?.weekly_xp ?? null;

  const joinMutation = useJoinGroup();
  const joining = joinMutation.isPending;

  const handleJoin = async () => {
    setJoinNotice(null);
    try {
      const res = await joinMutation.mutateAsync(gid);
      if (res.status === "requested") {
        setJoinNotice("Join request sent. Wait for approval.");
      } else {
        setJoinNotice("Joined successfully!");
      }
    } catch (e) {
      const st = getHttpStatus(e);
      if (st === 401) setJoinNotice("Please login again.");
      else setJoinNotice("Failed to join this group.");
    }
  };

  const goToChat = () => {
    const name = group?.name ?? groupNameFromState ?? "Group";
    navigate(`/groups/${gid}/chat`, { state: { groupName: name } });
  };

  const showMemberUi = isMember;

  // If details failed with 403/404 for non-members, preview still works
  const detailsStatus = isError ? getHttpStatus(error) : undefined;
  const detailsBlocked = !showMemberUi && (detailsStatus === 403 || detailsStatus === 404);

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="groups" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64">
          <div className="mx-auto max-w-6xl px-4 py-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="relative"
            >
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/groups")}
                  className="
                    group relative overflow-hidden
                    rounded-xl border border-zinc-200 bg-white
                    px-3 py-2 text-xs font-semibold text-zinc-700
                    shadow-sm transition-all duration-300
                    hover:-translate-y-0.5 hover:shadow-md
                    hover:border-yellow-300 hover:text-zinc-900
                    flex items-center gap-2 w-fit
                  "
                >
                  <span className="pointer-events-none absolute inset-0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-in-out bg-[linear-gradient(90deg,transparent,rgba(250,204,21,0.18),transparent)]" />
                  <ArrowLeft className="h-4 w-4 relative" />
                  <span className="relative">Back</span>
                </button>

                {showMemberUi ? (
                  <button
                    type="button"
                    onClick={goToChat}
                    className="
                      group relative overflow-hidden
                      rounded-xl border border-zinc-200 bg-white
                      px-3 py-2 text-xs font-semibold text-zinc-700
                      shadow-sm transition-all duration-300
                      hover:-translate-y-0.5 hover:shadow-md
                      hover:border-yellow-300 hover:text-zinc-900
                      flex items-center gap-2 w-fit
                    "
                  >
                    <span className="pointer-events-none absolute inset-0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-in-out bg-[linear-gradient(90deg,transparent,rgba(250,204,21,0.18),transparent)]" />
                    <MessageCircle className="h-4 w-4 relative" />
                    <span className="relative">Open Group Chat</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleJoin}
                    disabled={joining || membershipQ.isLoading}
                    className="
                      rounded-xl border border-zinc-200 bg-white
                      px-4 py-2 text-xs font-semibold text-zinc-800
                      shadow-sm transition
                      hover:-translate-y-0.5 hover:shadow-md hover:border-yellow-300
                      disabled:opacity-60 disabled:cursor-not-allowed
                      inline-flex items-center gap-2
                    "
                  >
                    {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                    {joining ? "Joining..." : isPrivate ? "Request to Join" : "Join Group"}
                  </button>
                )}
              </div>

              <div className="mt-4">
                <p className="text-sm text-zinc-500">
                  Groups / {showMemberUi ? "Details" : "Preview"}
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                    {title}
                  </h1>
                  <span className="text-[11px] font-semibold rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-600">
                    {visibility}
                  </span>
                </div>

                <p className="mt-1 text-sm text-zinc-600 max-w-2xl">{description}</p>

                {(isLoading || membershipQ.isLoading) && (
                  <p className="mt-3 text-sm text-zinc-500">Loading…</p>
                )}

                {!showMemberUi && detailsBlocked && (
                  <p className="mt-3 text-sm text-zinc-500">
                    Private group preview. Join to see members and full details.
                  </p>
                )}

                {joinNotice && (
                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
                    {joinNotice}
                  </div>
                )}
              </div>
            </motion.div>

            {/* --------- Preview UI (non-member) --------- */}
            {!showMemberUi ? (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
                className="relative mt-6 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200 overflow-hidden"
              >
                <div className="pointer-events-none absolute -top-16 -right-20 h-56 w-56 rounded-full bg-yellow-200/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-yellow-100/50 blur-3xl" />

                <div className="relative grid grid-cols-12 gap-6">
                  <div className="col-span-12 lg:col-span-7">
                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                      <MiniSectionTitle
                        title="Group preview"
                        subtitle={
                          isPrivate
                            ? "Private groups hide member list until you join."
                            : "Public group — you can join instantly."
                        }
                        right="Preview"
                      />

                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <StatCard
                          label="Weekly XP goal"
                          value={weeklyXp ?? 0}
                          suffix="xp"
                          valueClassName="text-sky-600"
                        />
                        <StatCard
                          label="Minimum daily"
                          value={minimumDailyMinutes == null ? "—" : minimumDailyMinutes}
                          suffix="min"
                          valueClassName="text-amber-600"
                        />
                      </div>

                      <div className="mt-5 rounded-2xl border border-zinc-200 bg-gradient-to-br from-yellow-50/70 to-white p-4">
                        <p className="text-xs font-semibold text-zinc-900">Join to access</p>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Members list, chat, and group progress.
                        </p>

                        <button
                          type="button"
                          onClick={handleJoin}
                          disabled={joining || membershipQ.isLoading}
                          className="
                            mt-4 w-full rounded-2xl border border-zinc-200 bg-[#FFFBF2]
                            px-4 py-3 text-sm font-semibold text-zinc-800
                            hover:border-yellow-300 hover:bg-yellow-50 transition-colors
                            disabled:opacity-60 disabled:cursor-not-allowed
                            flex items-center justify-between
                          "
                        >
                          <span className="flex items-center gap-2">
                            {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                            {joining ? "Joining..." : isPrivate ? "Request to join" : "Join group"}
                          </span>
                          <span className="text-xs text-zinc-500">→</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-5 space-y-6">
                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                      <MiniSectionTitle title="Your buddy" subtitle="Stay consistent." right="Tip" />
                      <div className="mt-4 rounded-3xl border border-zinc-200 bg-white/60 backdrop-blur p-1 shadow-sm">
                        <LookAtBuddy label="Your study buddy" />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                      <MiniSectionTitle title="Members" subtitle="Hidden until you join" right="Locked" />
                      <div className="mt-4 rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-5">
                        <p className="text-sm text-zinc-600">
                          Join the group to view members.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                {/* --------- Member UI (existing details) --------- */}
                <div className="mt-5 max-w-md">
                  <div className="rounded-3xl border border-zinc-200 bg-white/60 backdrop-blur p-1 shadow-sm">
                    <LookAtBuddy label="Your study buddy" />
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                  className="relative mt-6 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200 overflow-hidden"
                >
                  <div className="pointer-events-none absolute -top-16 -right-20 h-56 w-56 rounded-full bg-yellow-200/30 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-yellow-100/50 blur-3xl" />

                  <div className="relative grid grid-cols-12 gap-6">
                    <div className="col-span-12 lg:col-span-7">
                      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <MiniSectionTitle title="Overview" subtitle="Quick snapshot of your group." right="Live" />

                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <StatCard label="Weekly XP goal" value={weeklyXp ?? 0} suffix="xp" valueClassName="text-sky-600" />
                          <StatCard label="Members" value={members.length} suffix="people" valueClassName="text-amber-600" />
                        </div>

                        <div className="mt-5 rounded-2xl border border-zinc-200 bg-gradient-to-br from-yellow-50/70 to-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-zinc-900">Minimum daily study time</p>
                              <p className="mt-1 text-[11px] text-zinc-500">Consistency beats intensity.</p>
                            </div>

                            <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100/60 px-2.5 py-1 text-[11px] font-semibold text-yellow-800">
                              Goal
                            </span>
                          </div>

                          <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-2xl font-semibold tabular-nums tracking-tight bg-gradient-to-r from-amber-600 via-yellow-600 to-rose-500 bg-clip-text text-transparent">
                              {minimumDailyMinutes == null ? "—" : `${minimumDailyMinutes} min`}
                            </span>
                            <span className="text-xs font-medium text-zinc-500">per day</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-12 lg:col-span-5 space-y-6">
                      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <MiniSectionTitle title="Members" subtitle={`${members.length} members`} right="Online" />

                        <div className="mt-4 rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-5">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                            {previewMembers.map((m) => (
                              <MemberCard key={m.id} m={m} />
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => setMembersOpen(true)}
                            className="
                              mt-5 w-full rounded-xl border border-zinc-200 bg-white
                              px-3 py-2 text-xs font-semibold text-zinc-700
                              hover:border-yellow-300 hover:text-zinc-900 transition-colors
                            "
                          >
                            View all members
                          </button>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <MiniSectionTitle title="Group Chat" subtitle="Discuss goals, share progress, stay accountable." right="Chat" />

                        <button
                          type="button"
                          onClick={goToChat}
                          className="
                            mt-4 w-full rounded-2xl border border-zinc-200 bg-[#FFFBF2]
                            px-4 py-3 text-sm font-semibold text-zinc-800
                            hover:border-yellow-300 hover:bg-yellow-50 transition-colors
                            flex items-center justify-between
                          "
                        >
                          <span className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4" />
                            Open chat for {title}
                          </span>
                          <span className="text-xs text-zinc-500">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {membersOpen && (
                    <motion.div
                      className="fixed inset-0 z-[60]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: EASE_OUT }}
                      role="dialog"
                      aria-modal="true"
                    >
                      <div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        onClick={() => setMembersOpen(false)}
                      />

                      <motion.div
                        initial={{ opacity: 0, y: 18, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 18, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: EASE_OUT }}
                        className="
                          absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                          w-[min(920px,calc(100vw-24px))]
                          max-h-[min(80vh,720px)]
                          overflow-hidden
                          rounded-3xl border border-zinc-200 bg-white
                          shadow-2xl
                        "
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="relative p-6 border-b border-zinc-200">
                          <div className="pointer-events-none absolute -top-16 -right-20 h-56 w-56 rounded-full bg-yellow-200/30 blur-3xl" />
                          <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-yellow-100/50 blur-3xl" />

                          <div className="relative flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm text-zinc-500">Members</p>
                              <p className="mt-1 text-xl font-semibold text-zinc-900">
                                {title} — {members.length} members
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                Press <span className="font-semibold">Esc</span> to close
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => setMembersOpen(false)}
                              className="
                                rounded-xl border border-zinc-200 bg-white
                                px-3 py-2 text-xs font-semibold text-zinc-700
                                hover:border-yellow-300 hover:text-zinc-900 transition-colors
                              "
                            >
                              Close
                            </button>
                          </div>
                        </div>

                        <div className="p-6 overflow-auto">
                          <div className="rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-10 gap-x-6">
                              {members.map((m) => (
                                <MemberCard key={m.id} m={m} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            <footer className="mt-10 text-center text-xs text-zinc-400">REVE dashboard</footer>
          </div>
        </div>
      </div>
    </div>
  );
}
