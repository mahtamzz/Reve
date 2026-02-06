import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { usePublicProfilesBatch } from "@/hooks/usePublicProfilesBatch";
import { getUserAvatarUrl } from "@/api/media";
import { DEFAULT_AVATAR_URL } from "@/constants/avatar";
import { useStudyPresence } from "@/hooks/useStudy";
import type { StudyPresenceActiveMeta } from "@/api/study";

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
  Sparkles,
  Stars,
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

const EASE_SOFT: [number, number, number, number] = [0.22, 1, 0.36, 1];


function pickAvatarUrl(m: any, pub: any): string {
  const direct =
    safeStr(m?.profile?.avatar_url) ??
    safeStr(m?.profile?.avatarUrl) ??
    safeStr(m?.avatar_url) ??
    safeStr(m?.avatarUrl) ??
    safeStr(pub?.avatar_url) ??
    safeStr(pub?.avatarUrl) ??
    null;

  if (direct) return direct;

  const uid = pickUid(m) ?? safeStr(pub?.uid) ?? safeStr(pub?.userId) ?? null;
  if (uid) return getUserAvatarUrl(uid, { bustCache: true });

  return DEFAULT_AVATAR_URL;
}



function safeStr(x: any): string | null {
  return typeof x === "string" && x.trim() ? x.trim() : null;
}

function pickUid(m: any): string | null {
  const uid =
    m?.uid ??
    m?.user_id ??
    m?.userId ??
    m?.id ??
    m?.profile?.uid ??
    m?.user?.id ??
    m?.user?.uid ??
    m?.user?.user_id ??
    null;

  if (uid == null) return null;
  const s = String(uid).trim();
  return s ? s : null;
}

function pickNameFromMember(m: any): { displayName: string | null; username: string | null } {
  const displayName =
    safeStr(m?.profile?.display_name) ??
    safeStr(m?.profile?.displayName) ??
    safeStr(m?.profile?.name) ??
    safeStr(m?.display_name) ??
    safeStr(m?.displayName) ??
    safeStr(m?.name) ??
    safeStr(m?.user?.profile?.display_name) ??
    safeStr(m?.user?.profile?.displayName) ??
    safeStr(m?.user?.display_name) ??
    safeStr(m?.user?.displayName) ??
    safeStr(m?.user?.name) ??
    null;

  const username =
    safeStr(m?.profile?.username) ??
    safeStr(m?.username) ??
    safeStr(m?.handle) ??
    safeStr(m?.user?.profile?.username) ??
    safeStr(m?.user?.username) ??
    null;

  return { displayName, username };
}

function roleBadge(role: string | null | undefined) {
  const r = String(role || "");
  if (r === "owner") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/70 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
        <Crown className="h-3 w-3" /> owner
      </span>
    );
  }
  if (r === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200/70 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-700">
        <Shield className="h-3 w-3" /> admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200/70 bg-white/60 px-2 py-1 text-[11px] font-semibold text-zinc-600">
      member
    </span>
  );
}

function visibilityBadge(visibility: string) {
  const v = visibility || "private";
  const priv = v === "private" || v === "invite_only";
  return (
    <span className="text-[11px] font-semibold rounded-full border border-zinc-200/70 bg-white/70 px-2 py-1 text-zinc-700 inline-flex items-center gap-1 backdrop-blur">
      {priv ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
      {v}
    </span>
  );
}

function Pill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-2 rounded-full border border-zinc-200/70 bg-white/65 px-3 py-1 text-[11px] font-semibold text-zinc-700 backdrop-blur " +
        className
      }
    >
      {children}
    </span>
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
      ? "border-rose-200/70 bg-rose-50/80 text-rose-700"
      : "border-zinc-200/70 bg-white/70 text-zinc-700";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm backdrop-blur ${cls}`}>
      {children}
    </div>
  );
}

function SoftButton({
  children,
  onClick,
  disabled,
  variant = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "neutral" | "danger";
  className?: string;
}) {
  const base =
    "group inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-semibold transition-all " +
    "shadow-[0_10px_30px_-20px_rgba(2,6,23,0.35)] hover:-translate-y-0.5 " +
    "focus:outline-none focus:ring-2 focus:ring-yellow-200/70 focus:ring-offset-2 focus:ring-offset-[#FBFBF7] " +
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0";

  const skin =
    variant === "danger"
      ? "border border-rose-200/70 bg-rose-50/80 text-rose-700 hover:bg-rose-50"
      : "border border-zinc-200/70 bg-white/70 text-zinc-700 hover:bg-white";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${skin} ${className}`}
    >
      {children}
    </button>
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
      ? "w-full rounded-3xl px-5 py-4 text-base"
      : "w-full sm:w-auto rounded-2xl px-4 py-3 text-sm";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        group relative ${size}
        inline-flex items-center justify-center gap-2
        font-semibold text-zinc-900
        border border-white/60
        bg-gradient-to-r from-amber-100 via-rose-100 to-sky-100
        shadow-[0_18px_60px_-35px_rgba(2,6,23,0.38)]
        transition-all duration-300
        hover:-translate-y-[2px]
        hover:shadow-[0_26px_78px_-44px_rgba(2,6,23,0.45)]
        active:translate-y-0
        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0
        focus:outline-none focus:ring-2 focus:ring-amber-200/80 focus:ring-offset-2 focus:ring-offset-[#FBFBF7]
        overflow-hidden
      `}
    >
      {/* soft sparkle */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-10 opacity-40 blur-2xl"
        animate={{ x: [0, 18, -10, 0], y: [0, -10, 12, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "conic-gradient(from 210deg at 50% 50%, rgba(253,224,71,0.35), rgba(255,175,221,0.30), rgba(147,197,253,0.32), rgba(134,239,172,0.28), rgba(253,224,71,0.35))",
        }}
      />

      <span className="relative inline-flex items-center gap-2">
        {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
        {loading ? "Joining..." : isPrivate ? "Request to join" : "Join group"}
      </span>

      <span
        className="
          relative ml-1 inline-flex items-center justify-center
          h-7 w-7 rounded-full
          bg-white/75 border border-white/60
          text-zinc-800
          transition-transform duration-300
          group-hover:translate-x-0.5
        "
        aria-hidden="true"
      >
        →
      </span>
    </button>
  );
}

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hh > 0 ? `${pad(hh)}:${pad(mm)}:${pad(ss)}` : `${pad(mm)}:${pad(ss)}`;
}


function StatCard({
  label,
  value,
  sub,
  chip,
  icon,
  valueGradient = "from-sky-500 via-indigo-500 to-rose-500",
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  chip?: string;
  icon?: React.ReactNode;
  valueGradient?: string;
}) {
  return (
    <motion.div
      className="
        relative overflow-hidden
        rounded-[28px] border border-white/60
        bg-white/65 backdrop-blur
        p-5
        shadow-[0_18px_60px_-40px_rgba(2,6,23,0.25)]
      "
      whileHover={{ y: -2 }}
      transition={{ duration: 0.35, ease: EASE_SOFT }}
    >
      <div className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full bg-amber-200/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-sky-200/25 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-zinc-500">{label}</p>
          <div
            className={`mt-2 text-3xl font-semibold tracking-tight tabular-nums bg-gradient-to-r ${valueGradient} bg-clip-text text-transparent`}
          >
            {value}
          </div>
          {sub ? <p className="mt-1 text-[11px] text-zinc-500">{sub}</p> : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          {chip ? (
            <span className="rounded-full border border-zinc-200/70 bg-white/70 px-2.5 py-1 text-[10px] font-semibold text-zinc-600 backdrop-blur">
              {chip}
            </span>
          ) : null}
          {icon ? (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200/70 bg-white/75 text-zinc-700 backdrop-blur">
              {icon}
            </span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}

function ChatCtaButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.25, ease: EASE_SOFT }}
      className="
        group relative overflow-hidden
        inline-flex items-center gap-2
        rounded-2xl px-4 py-2.5 text-xs font-semibold
        text-zinc-900
        border border-white/70
        bg-gradient-to-r from-sky-100 via-rose-100 to-amber-100
        shadow-[0_18px_60px_-40px_rgba(2,6,23,0.35)]
        hover:shadow-[0_26px_78px_-44px_rgba(2,6,23,0.45)]
        focus:outline-none focus:ring-2 focus:ring-sky-200/80 focus:ring-offset-2 focus:ring-offset-[#FBFBF7]
      "
    >
      {/* glow نرمِ متحرک */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-12 opacity-50 blur-2xl"
        animate={{ x: [0, 18, -12, 0], y: [0, -10, 12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "conic-gradient(from 210deg at 50% 50%, rgba(147,197,253,0.55), rgba(255,175,221,0.45), rgba(253,224,71,0.40), rgba(134,239,172,0.35), rgba(147,197,253,0.55))",
        }}
      />

      <span className="relative inline-flex items-center gap-2">
        <span
          className="
            inline-flex h-7 w-7 items-center justify-center
            rounded-full bg-white/75 border border-white/70
            shadow-sm
            transition-transform duration-300
            group-hover:rotate-[-6deg] group-hover:scale-[1.04]
          "
          aria-hidden
        >
          <MessageCircle className="h-4 w-4" />
        </span>
        <span>Open Group Chat</span>
      </span>

      <span
        className="
          relative ml-1 inline-flex items-center justify-center
          h-7 w-7 rounded-full
          bg-white/75 border border-white/70
          text-zinc-800
          transition-transform duration-300
          group-hover:translate-x-0.5
        "
        aria-hidden="true"
      >
        →
      </span>
    </motion.button>
  );
}

function calcTodayTotalMs(args: { todayMinsBase?: number; startedAt?: string | null; nowMs: number }) {
  const baseMs = Math.max(0, Number(args.todayMinsBase ?? 0)) * 60 * 1000;
  const liveMs = args.startedAt ? Math.max(0, args.nowMs - new Date(args.startedAt).getTime()) : 0;
  return baseMs + liveMs;
}



export default function GroupDetails() {
  const { groupId } = useParams<{ groupId: string }>();
  const gid = groupId || "";

  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);


  const navigate = useNavigate();
  const location = useLocation();
  const groupNameFromState = (location.state as { groupName?: string } | null)?.groupName;

  const prefersReducedMotion = useReducedMotion();

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

  const minimumDailyMinutes =
    (group as any)?.minimum_dst_mins ?? (group as any)?.minimumDstMins ?? null;
  const weeklyXp = (group as any)?.weekly_xp ?? (group as any)?.weeklyXp ?? null;

  const canSeeMembers = !isPrivate || isMember;
  const membersQ = useGroupMembers(gid, Boolean(gid) && canSeeMembers);

  const membersRaw = membersQ.data?.items ?? [];
  const membersCount = membersQ.data?.total ?? membersRaw.length;

  const memberUids = useMemo(() => {
    const set = new Set<string>();
    for (const m of membersRaw as any[]) {
      const uid = pickUid(m);
      if (uid) set.add(uid);
    }
    return Array.from(set);
  }, [membersRaw]);

  const profiles = usePublicProfilesBatch(memberUids, canSeeMembers);
  const presenceQ = useStudyPresence(memberUids, isMember && canSeeMembers);
  const activeMap = (presenceQ.data?.active ?? {}) as Record<string, StudyPresenceActiveMeta>;

  const todayBaseMap = presenceQ.data?.todayMinsBase ?? {};


  useEffect(() => {
    console.log("presenceQ", {
      status: presenceQ.status,
      isFetching: presenceQ.isFetching,
      error: presenceQ.error,
      data: presenceQ.data,
      memberUids,
    });
  }, [presenceQ.status, presenceQ.isFetching, presenceQ.error, presenceQ.data, memberUids]);
  

  const members = useMemo(() => {
    return (membersRaw as any[]).map((m, idx) => {
      const uidRaw = pickUid(m);
      const uidKey = uidRaw ? String(uidRaw) : null;
  
      const fromMember = pickNameFromMember(m);
      const pub = uidKey ? profiles.map.get(uidKey) : undefined;
  
      const display =
        fromMember.displayName ??
        safeStr(pub?.display_name) ??
        safeStr(pub?.displayName) ??
        safeStr(pub?.name) ??
        (fromMember.username ? `@${fromMember.username.replace(/^@/, "")}` : null) ??
        safeStr(pub?.username) ??
        (uidKey ? `User #${uidKey}` : `User #${idx}`);
  
      const avatar = pickAvatarUrl(m, pub);
  
      const role = String(m?.role ?? m?.member_role ?? m?.memberRole ?? "member");
  
      const active = uidKey ? (activeMap[uidKey] ?? null) : null;
      const online = Boolean(active);
      const startedAt = active?.startedAt ?? null;
  
      const todayMinsBase = uidKey ? Number(todayBaseMap[uidKey] ?? 0) : 0;
  
      return {
        uid: uidKey ?? `idx:${idx}`,
  
        uidKey,
  
        display: String(display),
        avatar,
        role,
  
        online,
        startedAt,
        todayMinsBase,
      };
    });
  }, [membersRaw, profiles.map, activeMap, todayBaseMap]);
  

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
      setNotice(res.status === "requested" ? "Join request sent. Wait for approval ✨" : "Joined successfully! 🎉");
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

  // ------------------------------------------------------------
  // Motion presets (cute, modern, not too fast)
  // ------------------------------------------------------------
  const page: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { duration: 0.45, ease: EASE_SOFT, staggerChildren: 0.08 },
    },
  };

  const lift: Variants = {
    hidden: { opacity: 0, y: 14, scale: 0.99 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 110, damping: 18, mass: 1.1 },
    },
  };

  return (
    <div className="min-h-screen bg-[#FBFBF7] text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="groups" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar />

          {/* dreamy pastel background */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-amber-200/25 blur-3xl" />
              <div className="absolute top-10 -right-28 h-96 w-96 rounded-full bg-sky-200/25 blur-3xl" />
              <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-rose-200/20 blur-3xl" />
            </div>

            <motion.div
              variants={page}
              initial="hidden"
              animate="show"
              className="relative mx-auto max-w-6xl px-4 py-6 pb-24 sm:pb-8"
            >
              {/* Header row */}
              <motion.div variants={lift} className="flex items-center justify-between gap-3">
                <SoftButton onClick={() => navigate("/groups")} className="bg-white/70">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </SoftButton>

                {isMember ? (
                  <div className="flex items-center gap-2">
                  <ChatCtaButton onClick={goToChat} />


                    <SoftButton onClick={handleLeave} disabled={leaveMut.isPending}>
                      <LogOut className="h-4 w-4" />
                      {leaveMut.isPending ? "Leaving..." : "Leave"}
                    </SoftButton>

                    {myRole === "owner" ? (
                      <SoftButton
                        variant="danger"
                        onClick={handleDelete}
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteMut.isPending ? "Deleting..." : "Delete"}
                      </SoftButton>
                    ) : null}
                  </div>
                ) : (
                  <div className="hidden sm:flex items-center gap-2">

                  </div>
                )}
              </motion.div>

              {/* Hero */}
              <motion.div
                variants={lift}
                className="
                  relative mt-5 overflow-hidden
                  rounded-[34px] border border-white/60
                  bg-white/65 backdrop-blur
                  p-6 sm:p-7
                  shadow-[0_24px_90px_-60px_rgba(2,6,23,0.42)]
                "
              >
                {/* cute floating sparkles */}
                {!prefersReducedMotion ? (
                  <>
                    <motion.div
                      aria-hidden
                      className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl opacity-70"
                      animate={{ x: [0, 10, -6, 0], y: [0, -8, 10, 0] }}
                      transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        background:
                          "radial-gradient(circle at 30% 30%, rgba(147,197,253,0.55), transparent 60%)",
                      }}
                    />
                    <motion.div
                      aria-hidden
                      className="pointer-events-none absolute -left-12 -bottom-12 h-44 w-44 rounded-full blur-3xl opacity-70"
                      animate={{ x: [0, -8, 12, 0], y: [0, 10, -6, 0] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        background:
                          "radial-gradient(circle at 30% 30%, rgba(253,224,71,0.45), transparent 60%)",
                      }}
                    />
                  </>
                ) : null}

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-500">
                        Groups / {isMember ? "Details" : "Preview"}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 truncate">
                          {title}
                        </h1>
                        {visibilityBadge(visibility)}
                        {isMember ? roleBadge(myRole) : null}
                      </div>

                      <p className="mt-3 max-w-2xl text-sm text-zinc-600 leading-relaxed">
                        {description}
                      </p>

                      {!isMember ? (
                        <p className="mt-2 text-[11px] text-zinc-500">
                          {isPrivate
                            ? "Private group — your request needs approval."
                            : "Instant join — access chat & progress."}
                        </p>
                      ) : null}

                      {invalidId ? (
                        <div className="mt-3">
                          <Notice kind="danger">
                            UUID plz{" "}
                            <span className="font-mono">{gid}</span>
                          </Notice>
                        </div>
                      ) : null}

                      {notice ? (
                        <div className="mt-3">
                          <Notice>{notice}</Notice>
                        </div>
                      ) : null}
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

                  {loadingAny ? (
                    <div className="mt-4 text-sm text-zinc-500">Loading…</div>
                  ) : null}
                </div>
              </motion.div>

              {/* Main grid */}
              <motion.div
                variants={lift}
                className="relative mt-6 grid grid-cols-12 gap-6"
                {...(prefersReducedMotion
                  ? { initial: false, animate: false }
                  : { initial: "hidden", animate: "show" })}
              >
                {/* Left */}
                <div className="col-span-12 lg:col-span-7 space-y-6">
                  {/* Overview shell */}
                  <motion.div
                    variants={lift}
                    className="
                      relative overflow-hidden rounded-[34px]
                      border border-white/60 bg-white/60 backdrop-blur
                      p-6 sm:p-7
                      shadow-[0_24px_90px_-60px_rgba(2,6,23,0.38)]
                    "
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.35, ease: EASE_SOFT }}
                  >
                    <div className="pointer-events-none absolute -top-24 right-10 h-72 w-72 rounded-full bg-rose-200/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-emerald-200/15 blur-3xl" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {isMember ? "Overview" : "What you’ll get after joining"}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {isMember ? "A cute snapshot of your group." : "Chat, members, and progress tracking."}
                        </p>
                      </div>
                      <Pill className="bg-white/70">{isMember ? "Live" : "Preview"}</Pill>
                    </div>

                    <div className="relative mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <StatCard
                        label="Weekly XP goal"
                        value={weeklyXp ?? 0}
                        sub="xp"
                        chip="XP"
                        icon={<span className="text-sm font-bold">XP</span>}
                        valueGradient="from-sky-500 via-indigo-500 to-fuchsia-500"
                      />

                      <StatCard
                        label={isMember ? "Members" : "Minimum daily"}
                        value={
                          isMember ? membersCount : minimumDailyMinutes == null ? "—" : minimumDailyMinutes
                        }
                        sub={isMember ? "people" : "min"}
                        chip={isMember ? "team" : "goal"}
                        icon={<Users className="h-4 w-4" />}
                        valueGradient="from-amber-500 via-rose-500 to-sky-500"
                      />
                    </div>

                    {/* cute info panel */}
                    <motion.div
                      className="
                        relative mt-5 overflow-hidden rounded-[30px]
                        border border-white/60 bg-gradient-to-br
                        from-amber-50/60 via-white/50 to-sky-50/60
                        p-5 backdrop-blur
                      "
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.35, ease: EASE_SOFT }}
                    >
                      <div className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-yellow-200/25 blur-3xl" />

                      <div className="relative flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-zinc-900">
                            {isMember ? "Minimum daily study time" : "Access rules"}
                          </p>
                          <p className="mt-1 text-[11px] text-zinc-500">
                            {isMember
                              ? "Consistency beats intensity."
                              : isPrivate
                                ? "Requests need approval."
                                : "You can join instantly."}
                          </p>
                        </div>

                        <Pill className="border-amber-200/60 bg-amber-50/70 text-amber-700">
                          {isMember ? "Goal" : isPrivate ? "Private" : "Public"}
                        </Pill>
                      </div>

                      {isMember ? (
                        <div className="relative mt-3 flex items-baseline gap-2">
                          <span className="text-2xl font-semibold tabular-nums tracking-tight bg-gradient-to-r from-amber-500 via-rose-500 to-sky-500 bg-clip-text text-transparent">
                            {minimumDailyMinutes == null ? "—" : `${minimumDailyMinutes} min`}
                          </span>
                          <span className="text-xs font-medium text-zinc-500">per day</span>
                        </div>
                      ) : (
                        <div className="relative mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur">
                            <p className="text-xs font-semibold text-zinc-900">Chat</p>
                            <p className="mt-1 text-[11px] text-zinc-500">Discuss goals & stay accountable.</p>
                          </div>
                          <div className="rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur">
                            <p className="text-xs font-semibold text-zinc-900">Members</p>
                            <p className="mt-1 text-[11px] text-zinc-500">See who’s inside the group.</p>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    {canAdmin && isPrivate ? (
                      <div className="mt-5 flex items-center justify-between">
                        <Pill className="border-rose-200/60 bg-rose-50/70 text-rose-700">
                          <Sparkles className="h-3.5 w-3.5" />
                          pending requests: {joinReqCount}
                        </Pill>
                        <span className="text-[11px] text-zinc-500">Approve/reject in Notifications</span>
                      </div>
                    ) : null}
                  </motion.div>
                </div>

                {/* Right */}
                <div className="col-span-12 lg:col-span-5 space-y-6">
                  {/* Buddy */}
                  <motion.div
                    variants={lift}
                    className="
                      relative overflow-hidden rounded-[34px]
                      border border-white/60 bg-white/60 backdrop-blur
                      p-6 sm:p-7
                      shadow-[0_24px_90px_-60px_rgba(2,6,23,0.38)]
                    "
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.35, ease: EASE_SOFT }}
                  >
                    <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-sky-200/20 blur-3xl" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">Your buddy</p>
                        <p className="mt-1 text-xs text-zinc-500">Stay consistent.</p>
                      </div>
                      <Pill>Tip</Pill>
                    </div>

                    <div className="relative mt-4 rounded-[28px] border border-white/60 bg-white/70 backdrop-blur p-2 shadow-sm">
                      <LookAtBuddy label="Your study buddy" />
                    </div>
                  </motion.div>

                  {/* Members */}
                  <motion.div
                    variants={lift}
                    className="
                      relative overflow-hidden rounded-[34px]
                      border border-white/60 bg-white/60 backdrop-blur
                      p-6 sm:p-7
                      shadow-[0_24px_90px_-60px_rgba(2,6,23,0.38)]
                    "
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.35, ease: EASE_SOFT }}
                  >
                    <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">Members</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {isMember ? `${membersCount} members` : isPrivate ? "Hidden until you join" : "Preview"}
                        </p>
                      </div>
                      <Pill>
                        <Users className="h-4 w-4" />
                        List
                      </Pill>
                    </div>

                    <div className="relative mt-4 rounded-[30px] border border-white/60 bg-white/70 p-5 backdrop-blur">
                      {isMember ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            {previewMembers.map((m) => (
                              <motion.div
                                key={m.uid}
                                initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, ease: EASE_SOFT }}
                                className="
                                  flex items-center gap-3 rounded-2xl
                                  border border-white/60 bg-white/75
                                  px-3 py-2 backdrop-blur
                                "
                              >
                            <div className="relative h-10 w-10 rounded-2xl border border-zinc-200/60 bg-white overflow-visible">
                              <div className="h-full w-full overflow-hidden rounded-2xl">
                                <img
                                  src={m.avatar}
                                  alt={m.display}
                                  className="h-full w-full object-cover"
                                  onError={(e) => (e.currentTarget.src = DEFAULT_AVATAR_URL)}
                                />
                              </div>

                              <span
                                className={`
                                  absolute -right-1 -bottom-1
                                  h-3.5 w-3.5 rounded-full
                                  border-2 border-white
                                  ${m.online ? "bg-emerald-400" : "bg-zinc-300"}
                                `}
                              />
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-zinc-900">{m.display}</p>

                                <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-zinc-400">
                                  {formatElapsed(
                                    calcTodayTotalMs({
                                      todayMinsBase: Number(m.todayMinsBase ?? 0),
                                      startedAt: m.startedAt ?? null,
                                      nowMs: nowTick,
                                    })
                                  )}
                                </p>

                                <div className="mt-1">{roleBadge(m.role)}</div>
                              </div>


                              </motion.div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => setMembersOpen(true)}
                            className="
                              mt-4 w-full rounded-3xl
                              border border-white/60 bg-white/80
                              px-4 py-3 text-sm font-semibold text-zinc-800
                              hover:bg-white
                              transition
                              shadow-[0_18px_60px_-40px_rgba(2,6,23,0.22)]
                            "
                          >
                            View all members
                          </button>
                        </>
                      ) : (
                        <div className="rounded-2xl border border-white/60 bg-white/75 p-4 backdrop-blur">
                          <p className="text-sm text-zinc-600">
                            {isPrivate ? "Join the group to view members." : "Join to see the full members list."}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
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
                    transition={{ duration: 0.22, ease: EASE_SOFT }}
                    role="dialog"
                    aria-modal="true"
                  >
                    <div
                      className="absolute inset-0 bg-black/25 backdrop-blur-md"
                      onClick={() => setMembersOpen(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 22, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 22, scale: 0.98 }}
                      transition={{
                        type: "spring",
                        stiffness: 120,
                        damping: 18,
                        mass: 1.1,
                      }}
                      className="
                        absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[min(980px,calc(100vw-24px))]
                        max-h-[min(80vh,740px)]
                        overflow-hidden
                        rounded-[34px]
                        border border-white/60
                        bg-white/70 backdrop-blur
                        shadow-[0_40px_140px_-80px_rgba(2,6,23,0.6)]
                      "
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative p-6 border-b border-white/60 bg-white/60 backdrop-blur">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-zinc-500">Members</p>
                            <p className="mt-1 text-xl font-semibold text-zinc-900">
                              {title} — {membersCount} members
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              Press <span className="font-semibold">Esc</span> to close
                            </p>
                          </div>

                          <SoftButton onClick={() => setMembersOpen(false)} className="bg-white/70">
                            Close
                          </SoftButton>
                        </div>
                      </div>

                      <div className="p-6 overflow-auto">
                        <div className="rounded-[30px] border border-white/60 bg-white/65 backdrop-blur p-6">
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
                                <motion.div
                                  key={m.uid}
                                  initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                                  animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                                  transition={{ duration: 0.45, ease: EASE_SOFT }}
                                  className="
                                    rounded-[28px] border border-white/60
                                    bg-white/75 backdrop-blur
                                    p-4
                                    shadow-[0_18px_60px_-40px_rgba(2,6,23,0.22)]
                                  "
                                >
                                  <div className="flex items-center gap-3">
                                  <div className="relative h-12 w-12 rounded-2xl border border-zinc-200/60 bg-white overflow-visible">
                                    <div className="h-full w-full overflow-hidden rounded-2xl">
                                      <img
                                        src={m.avatar}
                                        alt={m.display}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = DEFAULT_AVATAR_URL;
                                        }}
                                      />
                                    </div>

                                    <span
                                      className={`
                                        absolute -right-1 -bottom-1
                                        h-3.5 w-3.5 rounded-full
                                        border-2 border-white shadow-sm
                                        ${m.online ? "bg-emerald-400" : "bg-zinc-300"}
                                      `}
                                    />
                                  </div>

                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-semibold text-zinc-900">
                                        {m.display}{" "}
                                        {isMe ? (
                                          <span className="text-[11px] font-semibold text-amber-700">
                                            (You)
                                          </span>
                                        ) : null}
                                      </p>
                                      <div className="mt-1 flex items-center gap-2">
                                        {roleBadge(m.role)}
                                        <span
                                          className={`text-[11px] font-semibold ${
                                            m.online ? "text-emerald-600" : "text-zinc-400"
                                          }`}
                                        >
                                        {formatElapsed(
                                          calcTodayTotalMs({
                                            todayMinsBase: m.todayMinsBase,
                                            startedAt: m.startedAt,
                                            nowMs: nowTick,
                                          })
                                        )}


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
                                              roleMut.mutate({
                                                groupId: gid,
                                                userId: m.uid,
                                                role: "admin",
                                              })
                                            }
                                            disabled={roleMut.isPending}
                                            className="
                                              rounded-2xl border border-white/60 bg-white/75
                                              px-3 py-2 text-xs font-semibold text-zinc-700
                                              hover:bg-white transition
                                              disabled:opacity-60 disabled:cursor-not-allowed
                                              inline-flex items-center gap-2
                                            "
                                          >
                                            <UserCog className="h-4 w-4" />
                                            Make admin
                                          </button>
                                          <button
                                            onClick={() =>
                                              roleMut.mutate({
                                                groupId: gid,
                                                userId: m.uid,
                                                role: "member",
                                              })
                                            }
                                            disabled={roleMut.isPending}
                                            className="
                                              rounded-2xl border border-white/60 bg-white/75
                                              px-3 py-2 text-xs font-semibold text-zinc-700
                                              hover:bg-white transition
                                              disabled:opacity-60 disabled:cursor-not-allowed
                                              inline-flex items-center gap-2
                                            "
                                          >
                                            <UserCog className="h-4 w-4" />
                                            Make member
                                          </button>
                                        </>
                                      ) : null}

                                      {canKick ? (
                                        <button
                                          onClick={() =>
                                            kickMut.mutate({ groupId: gid, userId: m.uid })
                                          }
                                          disabled={kickMut.isPending}
                                          className="
                                            rounded-2xl border border-rose-200/70 bg-rose-50/80
                                            px-3 py-2 text-xs font-semibold text-rose-700
                                            hover:bg-rose-50 transition
                                            disabled:opacity-60 disabled:cursor-not-allowed
                                            inline-flex items-center gap-2
                                          "
                                        >
                                          <UserMinus className="h-4 w-4" />
                                          Kick
                                        </button>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </motion.div>
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
            </motion.div>

            {/* Sticky CTA for non-member on mobile */}
            {!isMember ? (
              <div className="fixed inset-x-0 bottom-0 z-[55] border-t border-white/60 bg-white/70 backdrop-blur">
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
    </div>
  );
}
