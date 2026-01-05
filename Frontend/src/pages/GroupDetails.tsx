// src/pages/GroupDetails.tsx
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Lock,
  Globe,
  Users,
  Shield,
  Crown,
  UserMinus,
  UserCog,
  Trash2,
  LogOut,
  Check,
  X,
} from "lucide-react";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import { logout } from "@/utils/authToken";

import LookAtBuddy from "@/components/LookAtBuddy";

import {
  useApproveJoinRequest,
  useChangeMemberRole,
  useDeleteGroup,
  useGroupDetails,
  useGroupMembers,
  useJoinGroup,
  useJoinRequests,
  useKickMember,
  useLeaveGroup,
  useMyMembership,
  useRejectJoinRequest,
} from "@/hooks/useGroups";

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

function initialsFromName(name: string) {
  const cleaned = (name || "").trim().replace(/\s+/g, " ");
  if (!cleaned) return "?";
  const parts = cleaned.split(" ");
  const a = parts[0]?.[0] || "";
  const b = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
  return (a + b).toUpperCase() || "?";
}

function roleBadge(role: string | null | undefined) {
  const r = String(role || "");
  if (r === "owner") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2 py-1 text-[11px] font-semibold text-yellow-800">
        <Crown className="h-3 w-3" /> owner
      </span>
    );
  }
  if (r === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700">
        <Shield className="h-3 w-3" /> admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-600">
      member
    </span>
  );
}

function visibilityBadge(visibility: string) {
  const v = visibility || "private";
  const isPrivate = v === "private" || v === "invite_only";
  return (
    <span className="text-[11px] font-semibold rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-600 inline-flex items-center gap-1">
      {isPrivate ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
      {v}
    </span>
  );
}

function pickDisplayName(m: any, fallbackId: string) {
  const dn =
    m?.profile?.display_name ||
    m?.display_name ||
    m?.displayName ||
    m?.username ||
    m?.name ||
    null;
  const s = typeof dn === "string" ? dn.trim() : "";
  return s ? s : `User #${fallbackId}`;
}

function pickAvatar(m: any, seed: string) {
  return (
    m?.profile?.avatar_url ||
    m?.avatar_url ||
    m?.avatarUrl ||
    placeholderAvatar(seed)
  );
}

export default function GroupDetails() {
  const { groupId } = useParams<{ groupId: string }>();
  const gid = groupId || "";

  const navigate = useNavigate();
  const location = useLocation();
  const groupNameFromState = (location.state as { groupName?: string } | null)?.groupName;

  const [membersOpen, setMembersOpen] = useState(false);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);

  // 1) membership (always)
  const membershipQ = useMyMembership(gid, Boolean(gid));
  const isMember = Boolean(membershipQ.data?.isMember);
  const myRole = (membershipQ.data?.role ?? null) as "owner" | "admin" | "member" | null;
  const canAdmin = myRole === "owner" || myRole === "admin";

  // 2) group details (try always)
  const detailsQ = useGroupDetails(gid, Boolean(gid));
  const group = detailsQ.data?.group;

  const title = group?.name ?? groupNameFromState ?? "Group";
  const visibility = String(group?.visibility ?? "private");
  const isPrivate = visibility === "private" || visibility === "invite_only";

  const description =
    (group?.description || "").trim() ||
    (isPrivate
      ? "This is a private group. Join to see full details."
      : "A focused space to study together, keep streaks, and stay accountable.");

  const minimumDailyMinutes = (group as any)?.minimum_dst_mins ?? null;
  const weeklyXp = (group as any)?.weekly_xp ?? null;

  // 3) members list (REAL endpoint) only if member OR public group
  // بک‌اند گفته public => anyone, else => only members
  const canSeeMembers = !isPrivate || isMember;
  const membersQ = useGroupMembers(gid, canSeeMembers);

  const membersRaw = membersQ.data?.items ?? [];
  const membersCount = membersQ.data?.total ?? membersRaw.length ?? 0;

  // join requests (admin panel)
  const joinReqQ = useJoinRequests(gid, Boolean(gid) && canAdmin && isPrivate);
  const joinReqItems = joinReqQ.data?.items ?? [];
  const joinReqCount = joinReqQ.data?.total ?? joinReqItems.length ?? 0;

  // mutations
  const joinMut = useJoinGroup();
  const leaveMut = useLeaveGroup();
  const deleteMut = useDeleteGroup();
  const approveMut = useApproveJoinRequest();
  const rejectMut = useRejectJoinRequest();
  const kickMut = useKickMember();
  const roleMut = useChangeMemberRole();

  const joining = joinMut.isPending;

  const handleJoin = async () => {
    setJoinNotice(null);
    try {
      const res = await joinMut.mutateAsync(gid);
      setJoinNotice(res.status === "requested" ? "Join request sent. Wait for approval." : "Joined successfully!");
    } catch (e: any) {
      setJoinNotice(e?.message || "Failed to join this group.");
    }
  };

  const handleLeave = async () => {
    setJoinNotice(null);
    try {
      await leaveMut.mutateAsync(gid);
      navigate("/groups");
    } catch (e: any) {
      setJoinNotice(e?.message || "Failed to leave group.");
    }
  };

  const handleDelete = async () => {
    setJoinNotice(null);
    try {
      await deleteMut.mutateAsync(gid);
      navigate("/groups");
    } catch (e: any) {
      setJoinNotice(e?.message || "Failed to delete group.");
    }
  };

  const goToChat = () => {
    navigate(`/groups/${gid}/chat`, { state: { groupName: title } });
  };

  useEffect(() => {
    if (!membersOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMembersOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [membersOpen]);

  const members = useMemo(() => {
    return membersRaw.map((m: any) => {
      const uid = String(m?.uid ?? m?.userId ?? m?.id ?? "");
      const display = pickDisplayName(m, uid || "0");
      const avatar = pickAvatar(m, uid || display);
      const role = String(m?.role ?? "member");
      const joinedAt = String(m?.joined_at ?? m?.joinedAt ?? "");
      const online = Boolean(m?.online);

      return { uid, display, avatar, role, joinedAt, online };
    });
  }, [membersRaw]);

  const previewMembers = useMemo(() => members.slice(0, 4), [members]);

  const loadingTop = membershipQ.isLoading || detailsQ.isLoading;

  const showMemberUi = isMember;

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="groups" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar username="User" />

          <div className="mx-auto max-w-6xl px-4 py-6">
            {/* Header */}
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

                <div className="flex items-center gap-2">
                  {showMemberUi ? (
                    <>
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

                      <button
                        type="button"
                        onClick={handleLeave}
                        disabled={leaveMut.isPending}
                        className="
                          rounded-xl border border-zinc-200 bg-white
                          px-3 py-2 text-xs font-semibold text-zinc-700
                          shadow-sm transition
                          hover:-translate-y-0.5 hover:shadow-md hover:border-yellow-300
                          disabled:opacity-60 disabled:cursor-not-allowed
                          inline-flex items-center gap-2
                        "
                      >
                        <LogOut className="h-4 w-4" />
                        {leaveMut.isPending ? "Leaving..." : "Leave"}
                      </button>

                      {myRole === "owner" ? (
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={deleteMut.isPending}
                          className="
                            rounded-xl border border-rose-200 bg-rose-50
                            px-3 py-2 text-xs font-semibold text-rose-700
                            shadow-sm transition
                            hover:-translate-y-0.5 hover:shadow-md hover:border-rose-300
                            disabled:opacity-60 disabled:cursor-not-allowed
                            inline-flex items-center gap-2
                          "
                        >
                          <Trash2 className="h-4 w-4" />
                          {deleteMut.isPending ? "Deleting..." : "Delete"}
                        </button>
                      ) : null}
                    </>
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
              </div>

              <div className="mt-4">
                <p className="text-sm text-zinc-500">
                  Groups / {showMemberUi ? "Details" : "Preview"}
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                    {title}
                  </h1>
                  {visibilityBadge(visibility)}
                  {showMemberUi ? roleBadge(myRole) : null}
                </div>

                <p className="mt-1 text-sm text-zinc-600 max-w-2xl">{description}</p>

                {loadingTop && <p className="mt-3 text-sm text-zinc-500">Loading…</p>}

                {joinNotice && (
                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
                    {joinNotice}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Preview (non-member) */}
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
                          discriminant(visibility) === "private"
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
                          Members list, chat, admin actions (if applicable), and group progress.
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
                      <MiniSectionTitle title="Members" subtitle={isPrivate ? "Hidden until you join" : "Visible"} right={isPrivate ? "Locked" : "Public"} />
                      <div className="mt-4 rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-5">
                        {isPrivate ? (
                          <p className="text-sm text-zinc-600">Join the group to view members.</p>
                        ) : (
                          <p className="text-sm text-zinc-600">
                            {membersQ.isLoading ? "Loading…" : `${membersCount} members available.`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Member UI */}
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
                    {/* Overview */}
                    <div className="col-span-12 lg:col-span-7">
                      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <MiniSectionTitle title="Overview" subtitle="Quick snapshot of your group." right="Live" />

                        <div className="mt-4 grid grid-cols-2 gap-4">
                          <StatCard label="Weekly XP goal" value={weeklyXp ?? 0} suffix="xp" valueClassName="text-sky-600" />
                          <StatCard label="Members" value={membersCount} suffix="people" valueClassName="text-amber-600" />
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

                      {/* Admin Panel */}
                      {canAdmin ? (
                        <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                          <MiniSectionTitle
                            title="Admin panel"
                            subtitle="Manage requests and members."
                            right={
                              <span className="inline-flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Admin
                              </span>
                            }
                          />

                          {/* Join Requests */}
                          <div className="mt-4 rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-5">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-zinc-900">
                                Join requests
                              </p>
                              <span className="text-xs text-zinc-500">
                                {joinReqQ.isLoading ? "Loading…" : `${joinReqCount}`}
                              </span>
                            </div>

                            {isPrivate ? (
                              <div className="mt-4 space-y-2">
                                {joinReqItems.length ? (
                                  joinReqItems.map((r: any) => {
                                    const uid = String(r?.uid ?? "");
                                    const createdAt = String(r?.created_at ?? "");
                                    return (
                                      <div
                                        key={`${uid}-${createdAt}`}
                                        className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2"
                                      >
                                        <div className="min-w-0">
                                          <p className="text-sm font-semibold text-zinc-900">
                                            User #{uid}
                                          </p>
                                          <p className="text-[11px] text-zinc-500 truncate">
                                            {createdAt ? `requested at: ${createdAt}` : "pending"}
                                          </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={() => approveMut.mutate({ groupId: gid, userId: uid })}
                                            disabled={approveMut.isPending}
                                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold hover:border-yellow-300 transition inline-flex items-center gap-2"
                                          >
                                            <Check className="h-4 w-4" />
                                            Approve
                                          </button>
                                          <button
                                            onClick={() => rejectMut.mutate({ groupId: gid, userId: uid })}
                                            disabled={rejectMut.isPending}
                                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:border-rose-300 transition inline-flex items-center gap-2"
                                          >
                                            <X className="h-4 w-4" />
                                            Reject
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <p className="text-sm text-zinc-600">No pending requests.</p>
                                )}
                              </div>
                            ) : (
                              <p className="mt-3 text-sm text-zinc-600">
                                This group is public. No join requests.
                              </p>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Right column: members + chat */}
                    <div className="col-span-12 lg:col-span-5 space-y-6">
                      {/* Members */}
                      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <MiniSectionTitle
                          title="Members"
                          subtitle={`${membersCount} members`}
                          right={
                            <span className="inline-flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              List
                            </span>
                          }
                        />

                        <div className="mt-4 rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-5">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-8">
                            {previewMembers.map((m) => (
                              <div key={m.uid} className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl overflow-hidden border border-zinc-200 bg-white grid place-items-center">
                                  {m.avatar ? (
                                    <img src={m.avatar} alt={m.display} className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-bold text-zinc-600">
                                      {initialsFromName(m.display)}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-zinc-900">
                                    {m.display}
                                  </p>
                                  <div className="mt-1">{roleBadge(m.role)}</div>
                                </div>
                              </div>
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

                      {/* Chat */}
                      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                        <MiniSectionTitle
                          title="Group Chat"
                          subtitle="Discuss goals, share progress, stay accountable."
                          right="Chat"
                        />

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

                {/* Members Modal */}
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
                          w-[min(980px,calc(100vw-24px))]
                          max-h-[min(80vh,740px)]
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
                                {title} — {membersCount} members
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {members.map((m) => {
                                const isMe = membershipQ.data?.uid != null && String(m.uid) === String(membershipQ.data.uid);
                                const canKick =
                                  canAdmin &&
                                  m.role !== "owner" &&
                                  !(myRole === "admin" && m.role === "admin") &&
                                  !isMe;

                                const canChangeRole =
                                  myRole === "owner" && m.role !== "owner" && !isMe;

                                return (
                                  <div
                                    key={m.uid}
                                    className="rounded-3xl border border-zinc-200 bg-white p-4"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-12 w-12 rounded-2xl overflow-hidden border border-zinc-200 bg-white grid place-items-center">
                                        {m.avatar ? (
                                          <img src={m.avatar} alt={m.display} className="h-full w-full object-cover" />
                                        ) : (
                                          <span className="text-xs font-bold text-zinc-600">
                                            {initialsFromName(m.display)}
                                          </span>
                                        )}
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-zinc-900">
                                          {m.display}{" "}
                                          {isMe ? (
                                            <span className="text-[11px] font-semibold text-yellow-700">(You)</span>
                                          ) : null}
                                        </p>
                                        <div className="mt-1 flex items-center gap-2">
                                          {roleBadge(m.role)}
                                          <span
                                            className={`text-[11px] font-semibold ${
                                              m.online ? "text-emerald-600" : "text-zinc-400"
                                            }`}
                                          >
                                            {m.online ? "online" : "offline"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {(canKick || canChangeRole) ? (
                                      <div className="mt-4 flex flex-wrap gap-2">
                                        {canChangeRole ? (
                                          <>
                                            <button
                                              onClick={() =>
                                                roleMut.mutate({ groupId: gid, userId: m.uid, role: "admin" })
                                              }
                                              disabled={roleMut.isPending}
                                              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold hover:border-yellow-300 transition inline-flex items-center gap-2"
                                            >
                                              <UserCog className="h-4 w-4" />
                                              Make admin
                                            </button>

                                            <button
                                              onClick={() =>
                                                roleMut.mutate({ groupId: gid, userId: m.uid, role: "member" })
                                              }
                                              disabled={roleMut.isPending}
                                              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold hover:border-yellow-300 transition inline-flex items-center gap-2"
                                            >
                                              <UserCog className="h-4 w-4" />
                                              Make member
                                            </button>
                                          </>
                                        ) : null}

                                        {canKick ? (
                                          <button
                                            onClick={() => kickMut.mutate({ groupId: gid, userId: m.uid })}
                                            disabled={kickMut.isPending}
                                            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:border-rose-300 transition inline-flex items-center gap-2"
                                          >
                                            <UserMinus className="h-4 w-4" />
                                            Kick
                                          </button>
                                        ) : null}
                                      </div>
                                    ) : null}
                                  </div>
                                );
                              })}
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

// helper: keeps TS happy, but also keeps logic readable
function discriminant(v: string) {
  return v || "private";
}
