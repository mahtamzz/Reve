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
  isUuid,
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
  const priv = v === "private" || v === "invite_only";
  return (
    <span className="text-[11px] font-semibold rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-600 inline-flex items-center gap-1">
      {priv ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
      {v}
    </span>
  );
}

function StatCard({
  label,
  value,
  suffix,
  valueClassName = "text-zinc-900",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  suffix?: string;
  valueClassName?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-zinc-500">{label}</p>
        {icon ? (
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-700">
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-3xl font-semibold tabular-nums tracking-tight ${valueClassName}`}>
        {value}
      </p>
      {suffix ? <p className="mt-1 text-[11px] text-zinc-500">{suffix}</p> : null}
    </div>
  );
}

function JoinCta({
  isPrivate,
  loading,
  disabled,
  onClick,
  variant = "hero",
}: {
  isPrivate: boolean;
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
  variant?: "hero" | "sticky";
}) {
  const size =
    variant === "sticky"
      ? "w-full rounded-2xl px-5 py-4 text-base"
      : "w-full sm:w-auto rounded-xl px-4 py-2.5 text-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        group relative ${size}
        inline-flex items-center justify-center gap-2
        font-semibold
        text-zinc-900
        border border-amber-200/70
        bg-gradient-to-r from-amber-100 via-rose-100 to-sky-100
        shadow-[0_10px_30px_-18px_rgba(2,6,23,0.35)]
        transition-all duration-200
        hover:-translate-y-[1px]
        hover:shadow-[0_16px_42px_-22px_rgba(2,6,23,0.45)]
        active:translate-y-0 active:shadow-[0_10px_30px_-18px_rgba(2,6,23,0.35)]
        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0
        focus:outline-none focus:ring-2 focus:ring-amber-200/80 focus:ring-offset-2 focus:ring-offset-white
        overflow-hidden
      `}
    >
      {/* soft highlight */}
      <span
        className="
          pointer-events-none absolute inset-0 opacity-0
          group-hover:opacity-100 transition-opacity duration-300
          bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.75),transparent_55%)]
        "
      />

      <span className="relative inline-flex items-center gap-2">
        {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
        {loading ? "Joining..." : isPrivate ? "Request to join" : "Join group"}
      </span>

      <span
        className="
          relative ml-1 inline-flex items-center justify-center
          h-6 w-6 rounded-full
          bg-white/70
          border border-zinc-200/70
          text-zinc-800
          transition-transform duration-200
          group-hover:translate-x-0.5
        "
        aria-hidden="true"
      >
        →
      </span>
    </button>
  );
}


function Notice({
  kind = "info",
  children,
}: {
  kind?: "info" | "danger";
  children: React.ReactNode;
}) {
  const cls =
    kind === "danger"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-zinc-200 bg-white text-zinc-700";
  return <div className={`rounded-2xl border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export default function GroupDetails() {
  const { groupId } = useParams<{ groupId: string }>();
  const gid = groupId || "";

  const navigate = useNavigate();
  const location = useLocation();
  const groupNameFromState = (location.state as { groupName?: string } | null)?.groupName;

  const [membersOpen, setMembersOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // ---- queries ----
  const detailsQ = useGroupDetails(gid, Boolean(gid));
  const group = detailsQ.data;

  const membershipQ = useMyMembership(gid, Boolean(gid));
  const isMember = Boolean(membershipQ.data?.isMember);
  const myUid = membershipQ.data?.uid ?? null;
  const myRole = (membershipQ.data?.role ?? null) as "owner" | "admin" | "member" | null;
  const canAdmin = myRole === "owner" || myRole === "admin";

  const title = group?.name ?? groupNameFromState ?? "Group";
  const visibility = String(group?.visibility ?? "private");
  const isPrivate = visibility === "private" || visibility === "invite_only";

  const description =
    (group?.description || "").trim() ||
    (isPrivate
      ? "This is a private group. Join to see full details."
      : "A focused space to study together, keep streaks, and stay accountable.");

  const minimumDailyMinutes = (group as any)?.minimum_dst_mins ?? (group as any)?.minimumDstMins ?? null;
  const weeklyXp = (group as any)?.weekly_xp ?? (group as any)?.weeklyXp ?? null;

  const canSeeMembers = !isPrivate || isMember;
  const membersQ = useGroupMembers(gid, Boolean(gid) && canSeeMembers);

  const membersRaw = membersQ.data?.items ?? [];
  const membersCount = membersQ.data?.total ?? membersRaw.length;

  const members = useMemo(() => {
    return membersRaw.map((m: any, idx: number) => {
      const uid = String(m?.uid ?? m?.user_id ?? m?.userId ?? m?.id ?? idx);
      const dn = m?.profile?.display_name;
      const un = m?.profile?.username;
      const av = m?.profile?.avatar_url;

      const display =
        (typeof dn === "string" && dn.trim() ? dn.trim() : null) ||
        (typeof un === "string" && un.trim() ? `@${un.replace(/^@/, "")}` : null) ||
        `User #${uid}`;

      const avatar = (typeof av === "string" && av.trim() ? av.trim() : null) || placeholderAvatar(uid);
      const role = String(m?.role ?? "member");
      const online = Boolean(m?.online);

      return { uid, display, avatar, role, online };
    });
  }, [membersRaw]);

  const previewMembers = useMemo(() => members.slice(0, 6), [members]);

  const joinReqQ = useJoinRequests(gid, Boolean(gid) && canAdmin && isPrivate);
  const joinReqItems = (joinReqQ.data as any)?.items ?? [];
  const joinReqCount = (joinReqQ.data as any)?.total ?? joinReqItems.length;

  // ---- mutations ----
  const joinMut = useJoinGroup();
  const leaveMut = useLeaveGroup();
  const deleteMut = useDeleteGroup();
  const approveMut = useApproveJoinRequest();
  const rejectMut = useRejectJoinRequest();
  const kickMut = useKickMember();
  const roleMut = useChangeMemberRole();

  const invalidId = Boolean(gid) && !isUuid(gid);
  const loadingAny = detailsQ.isLoading || membershipQ.isLoading || membersQ.isLoading;

  useEffect(() => {
    if (!membersOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMembersOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [membersOpen]);

  const goToChat = () => navigate(`/groups/${gid}/chat`, { state: { groupName: title } });

  const handleJoin = async () => {
    setNotice(null);
    try {
      const res = await joinMut.mutateAsync(gid);
      setNotice(res.status === "requested" ? "Join request sent. Wait for approval." : "Joined successfully!");
    } catch (e: any) {
      setNotice(e?.message || "Failed to join this group.");
    }
  };

  const handleLeave = async () => {
    setNotice(null);
    try {
      await leaveMut.mutateAsync(gid);
      navigate("/groups");
    } catch (e: any) {
      setNotice(e?.message || "Failed to leave group.");
    }
  };

  const handleDelete = async () => {
    setNotice(null);
    try {
      await deleteMut.mutateAsync(gid);
      navigate("/groups");
    } catch (e: any) {
      setNotice(e?.message || "Failed to delete group.");
    }
  };

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="groups" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar/>

          <div className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:pb-6">
            {/* Header row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="flex items-center justify-between gap-3"
            >
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
                  inline-flex items-center gap-2
                "
              >
                <span className="pointer-events-none absolute inset-0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-in-out bg-[linear-gradient(90deg,transparent,rgba(250,204,21,0.18),transparent)]" />
                <ArrowLeft className="h-4 w-4 relative" />
                <span className="relative">Back</span>
              </button>

              {/* Member-only actions */}
              {isMember ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goToChat}
                    className="
                      rounded-xl border border-zinc-200 bg-white
                      px-3 py-2 text-xs font-semibold text-zinc-700
                      shadow-sm transition
                      hover:-translate-y-0.5 hover:shadow-md hover:border-yellow-300
                      inline-flex items-center gap-2
                    "
                  >
                    <MessageCircle className="h-4 w-4" />
                    Open Group Chat
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
                </div>
              ) : null}
            </motion.div>

            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="relative mt-5 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
            >
              <div className="pointer-events-none absolute -top-20 -right-24 h-64 w-64 rounded-full bg-yellow-200/30 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-yellow-100/50 blur-3xl" />

              <div className="relative">
                <p className="text-sm text-zinc-500">Groups / {isMember ? "Details" : "Preview"}</p>
                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 truncate">
                          {title}
                        </h1>
                        {visibilityBadge(visibility)}
                        {isMember ? roleBadge(myRole) : null}
                      </div>

                      <p className="mt-2 max-w-2xl text-sm text-zinc-600">{description}</p>
                    </div>

                    {!isMember ? (
                      <div className="shrink-0 sm:self-start sm:pt-1">
                        <JoinCta
                          isPrivate={isPrivate}
                          loading={joinMut.isPending}
                          disabled={invalidId}
                          onClick={handleJoin}
                          variant="hero"
                        />
                      </div>
                    ) : null}
                  </div>

                  {/* helper text رو بیار زیر description (سمت چپ)، نه زیر دکمه */}
                  {!isMember ? (
                    <p className="text-[11px] text-zinc-500">
                      {isPrivate ? "Private group — your request needs approval." : "Instant join — access chat & progress."}
                    </p>
                  ) : null}

                  {loadingAny ? <p className="mt-1 text-sm text-zinc-500">Loading…</p> : null}

                  {invalidId ? (
                    <div className="mt-2">
                      <Notice kind="danger">
                        groupId باید UUID باشه ولی این مقدار دریافت شد: <span className="font-mono">{gid}</span>
                      </Notice>
                    </div>
                  ) : null}

                  {notice ? (
                    <div className="mt-2">
                      <Notice>{notice}</Notice>
                    </div>
                  ) : null}
                </div>

              </div>
            </motion.div>

            {/* Main grid */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="relative mt-6 grid grid-cols-12 gap-6"
            >
              {/* Left */}
              <div className="col-span-12 lg:col-span-7 space-y-6">
                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {isMember ? "Overview" : "What you’ll get after joining"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {isMember ? "Quick snapshot of your group." : "Chat, member list, and progress tracking."}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                      {isMember ? "Live" : "Preview"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatCard
                      label="Weekly XP goal"
                      value={weeklyXp ?? 0}
                      suffix="xp"
                      valueClassName="text-sky-600"
                      icon={<span className="text-sm font-bold">XP</span>}
                    />

                    <StatCard
                      label={isMember ? "Members" : "Minimum daily"}
                      value={isMember ? membersCount : minimumDailyMinutes == null ? "—" : minimumDailyMinutes}
                      suffix={isMember ? "people" : "min"}
                      valueClassName={isMember ? "text-amber-600" : "text-amber-600"}
                      icon={isMember ? <Users className="h-4 w-4" /> : <span className="text-sm font-bold">⏱</span>}
                    />
                  </div>

                  <div className="mt-5 rounded-3xl border border-zinc-200 bg-gradient-to-br from-yellow-50/70 to-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-zinc-900">
                          {isMember ? "Minimum daily study time" : "Access rules"}
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {isMember ? "Consistency beats intensity." : isPrivate ? "Requests need approval." : "You can join instantly."}
                        </p>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100/60 px-2.5 py-1 text-[11px] font-semibold text-yellow-800">
                        {isMember ? "Goal" : isPrivate ? "Private" : "Public"}
                      </span>
                    </div>

                    {isMember ? (
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold tabular-nums tracking-tight bg-gradient-to-r from-amber-600 via-yellow-600 to-rose-500 bg-clip-text text-transparent">
                          {minimumDailyMinutes == null ? "—" : `${minimumDailyMinutes} min`}
                        </span>
                        <span className="text-xs font-medium text-zinc-500">per day</span>
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                          <p className="text-xs font-semibold text-zinc-900">Chat</p>
                          <p className="mt-1 text-[11px] text-zinc-500">Discuss goals & stay accountable.</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                          <p className="text-xs font-semibold text-zinc-900">Members</p>
                          <p className="mt-1 text-[11px] text-zinc-500">See who’s inside the group.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin panel */}
                {isMember && canAdmin ? (
                  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">Admin panel</p>
                        <p className="mt-1 text-xs text-zinc-500">Manage requests and members.</p>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                        <Shield className="h-4 w-4" />
                        Admin
                      </span>
                    </div>

                    <div className="mt-5 rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-zinc-900">Join requests</p>
                        <span className="text-xs text-zinc-500">
                          {joinReqQ.isLoading ? "Loading…" : `${joinReqCount}`}
                        </span>
                      </div>

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
                                  <p className="text-sm font-semibold text-zinc-900">User #{uid}</p>
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
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Right */}
              <div className="col-span-12 lg:col-span-5 space-y-6">
                {/* Buddy */}
                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Your buddy</p>
                      <p className="mt-1 text-xs text-zinc-500">Stay consistent.</p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                      Tip
                    </span>
                  </div>

                  <div className="mt-4 rounded-3xl border border-zinc-200 bg-white/60 backdrop-blur p-1 shadow-sm">
                    <LookAtBuddy label="Your study buddy" />
                  </div>
                </div>

                {/* Members */}
                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Members</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {isMember ? `${membersCount} members` : isPrivate ? "Hidden until you join" : "Preview"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                      <Users className="h-4 w-4" />
                      List
                    </span>
                  </div>

                  <div className="mt-4 rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-5">
                    {isMember ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {previewMembers.map((m) => (
                            <div key={m.uid} className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                              <div className="relative h-10 w-10 rounded-2xl overflow-hidden border border-zinc-200 bg-white grid place-items-center">
                                {m.avatar ? (
                                  <img src={m.avatar} alt={m.display} className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-xs font-bold text-zinc-600">{initialsFromName(m.display)}</span>
                                )}
                                <span
                                  className={`
                                    absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white
                                    ${m.online ? "bg-emerald-500" : "bg-zinc-300"}
                                  `}
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-zinc-900">{m.display}</p>
                                <div className="mt-1">{roleBadge(m.role)}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setMembersOpen(true)}
                          className="
                            mt-4 w-full rounded-2xl border border-zinc-200 bg-white
                            px-4 py-3 text-sm font-semibold text-zinc-800
                            hover:border-yellow-300 hover:bg-yellow-50 transition-colors
                          "
                        >
                          View all members
                        </button>
                      </>
                    ) : (
                      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <p className="text-sm text-zinc-600">
                          {isPrivate ? "Join the group to view members." : "Join to see the full members list."}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat card */}
                <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Group Chat</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {isMember ? "Discuss goals, share progress, stay accountable." : "Join to unlock chat."}
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                      Chat
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={isMember ? goToChat : undefined}
                    disabled={!isMember}
                    className="
                      mt-4 w-full rounded-2xl border border-zinc-200
                      bg-[#FFFBF2]
                      px-4 py-3 text-sm font-semibold text-zinc-800
                      transition-colors
                      flex items-center justify-between
                      hover:border-yellow-300 hover:bg-yellow-50
                      disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-zinc-200 disabled:hover:bg-[#FFFBF2]
                    "
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      {isMember ? `Open chat for ${title}` : "Chat is locked"}
                    </span>
                    <span className="text-xs text-zinc-500">→</span>
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Members Modal */}
            <AnimatePresence>
              {membersOpen && isMember && (
                <motion.div
                  className="fixed inset-0 z-[60]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: EASE_OUT }}
                  role="dialog"
                  aria-modal="true"
                >
                  <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMembersOpen(false)} />

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
                            const isMe = myUid != null && String(m.uid) === String(myUid);

                            const canKick =
                              canAdmin &&
                              m.role !== "owner" &&
                              !(myRole === "admin" && m.role === "admin") &&
                              !isMe;

                            const canChangeRole = myRole === "owner" && m.role !== "owner" && !isMe;

                            return (
                              <div key={m.uid} className="rounded-3xl border border-zinc-200 bg-white p-4">
                                <div className="flex items-center gap-3">
                                  <div className="relative h-12 w-12 rounded-2xl overflow-hidden border border-zinc-200 bg-white grid place-items-center">
                                    {m.avatar ? (
                                      <img src={m.avatar} alt={m.display} className="h-full w-full object-cover" />
                                    ) : (
                                      <span className="text-xs font-bold text-zinc-600">{initialsFromName(m.display)}</span>
                                    )}
                                    <span
                                      className={`
                                        absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white
                                        ${m.online ? "bg-emerald-500" : "bg-zinc-300"}
                                      `}
                                    />
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
                                      <span className={`text-[11px] font-semibold ${m.online ? "text-emerald-600" : "text-zinc-400"}`}>
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
                                          onClick={() => roleMut.mutate({ groupId: gid, userId: m.uid, role: "admin" })}
                                          disabled={roleMut.isPending}
                                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold hover:border-yellow-300 transition inline-flex items-center gap-2"
                                        >
                                          <UserCog className="h-4 w-4" />
                                          Make admin
                                        </button>
                                        <button
                                          onClick={() => roleMut.mutate({ groupId: gid, userId: m.uid, role: "member" })}
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

            <footer className="mt-10 text-center text-xs text-zinc-400">REVE dashboard</footer>
          </div>

          {/* Sticky CTA for non-member on mobile (still ONE button total, same CTA) */}
          {!isMember ? (
            <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-zinc-200 bg-white/80 backdrop-blur sm:hidden">
              <div className="mx-auto max-w-6xl px-4 py-3">
                <JoinCta
                  isPrivate={isPrivate}
                  loading={joinMut.isPending}
                  disabled={invalidId}
                  onClick={handleJoin}
                  variant="sticky"
                />
                <p className="mt-2 text-[11px] text-zinc-500 text-center">
                  {isPrivate ? "Your request needs approval." : "Join instantly."}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
