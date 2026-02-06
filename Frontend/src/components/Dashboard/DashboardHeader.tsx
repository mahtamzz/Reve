import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Mail, Search, Settings2, User2, Users, Clock } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import CommandPalette from "../ui/CommandPalette";
import { authClient } from "@/api/client";
import { getAvatarMeta, getAvatarUrl } from "@/api/media";
import { DEFAULT_AVATAR_URL } from "@/constants/avatar";
import { useJoinRequestNotifications } from "@/hooks/useJoinRequestNotifications";

type TopbarProfile = {
  username: string;
  email?: string;
  fullName?: string;
  role?: string;
};

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type TopbarProps = {
  title?: string;
  subtitle?: string;
  crumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  hideSearch?: boolean;
  profile?: (TopbarProfile & { avatarUrl?: string | null }) | null;
  onSearchSubmit?: (q: string) => void;
  searchPlaceholder?: string;
};

function routeTitle(pathname: string) {
  if (pathname === "/" || pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/profile")) return "Profile";
  if (pathname.startsWith("/connections")) return "Connections";
  if (pathname.startsWith("/groups")) return "Groups";
  if (pathname.startsWith("/study")) return "Study";
  if (pathname.startsWith("/notifications")) return "Notifications";
  return "App";
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const t = d.getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const day = Math.floor(h / 24);
  return `${day}d`;
}

export default function Topbar({
  title,
  subtitle,
  crumbs,
  actions,
  hideSearch,
  profile,
  onSearchSubmit,
  searchPlaceholder = "Search…",
}: TopbarProps) {
  const navigate = useNavigate();
  const loc = useLocation();

  const [openCmd, setOpenCmd] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);

  const [remoteProfile, setRemoteProfile] = useState<TopbarProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>(DEFAULT_AVATAR_URL);

  const [search, setSearch] = useState("");

  // ✅ join request notifications (admin/owner)
  const joinNotif = useJoinRequestNotifications(15_000, 6);
  const hasNotif = joinNotif.count > 0;

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const computedTitle = title ?? routeTitle(loc.pathname);

  const p = useMemo(() => {
    if (profile) {
      return {
        username: profile.username,
        email: profile.email,
        fullName: profile.fullName ?? profile.username,
        role: profile.role ?? "Student",
        avatarUrl: profile.avatarUrl ?? null,
      };
    }

    if (remoteProfile) {
      return {
        username: remoteProfile.username,
        email: remoteProfile.email,
        fullName: remoteProfile.fullName ?? remoteProfile.username,
        role: remoteProfile.role ?? "Student",
        avatarUrl,
      };
    }

    return {
      username: "user",
      email: undefined,
      fullName: "User",
      role: "Student",
      avatarUrl,
    };
  }, [profile, remoteProfile, avatarUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpenCmd(true);
      }
      if (e.key === "Escape") {
        setOpenCmd(false);
        setProfileOpen(false);
        setNotifOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // close notif popover on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const onDoc = () => setNotifOpen(false);
    window.addEventListener("click", onDoc);
    return () => window.removeEventListener("click", onDoc);
  }, [notifOpen]);

  useEffect(() => {
    if (profile) return;
  
    let cancelled = false;
  
    const run = async () => {
      setLoadingProfile(true);
      try {
        const data: any = await authClient.get("/auth/me");
        const u = (data?.user ?? data) as any;
  
        const next: TopbarProfile = {
          username: u?.username ?? "user",
          email: u?.email ?? undefined,
          fullName: u?.fullName ?? u?.name ?? u?.username ?? "User",
          role: u?.role ?? "Student",
        };
  
        if (!cancelled && mountedRef.current) setRemoteProfile(next);
  
        if (!cancelled && mountedRef.current) {
          const meta = await getAvatarMeta();
          setAvatarUrl(meta?.exists ? getAvatarUrl({ bustCache: true }) : DEFAULT_AVATAR_URL);
        }
      } catch {
        if (!cancelled && mountedRef.current) {
          setRemoteProfile({
            username: "user",
            fullName: "User",
            role: "Student",
          });
          setAvatarUrl(DEFAULT_AVATAR_URL);
        }
      } finally {
        if (!cancelled && mountedRef.current) setLoadingProfile(false);
      }
    };
  
    run();
  
    return () => {
      cancelled = true;
    };
  }, [profile]);
  

  const submitSearch = () => {
    const q = search.trim();
    if (!q) return;
    onSearchSubmit?.(q);
    setSearch("");
  };

  return (
    <>
      <CommandPalette open={openCmd} onClose={() => setOpenCmd(false)} />

      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-[#F7F8FA]/75 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            {/* Left */}
            <div className="min-w-0">
              <div className="flex items-baseline gap-3">
                <div className="text-[17px] font-semibold tracking-tight text-zinc-900">
                  {computedTitle}
                </div>

                {crumbs?.length ? (
                  <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 min-w-0">
                    <span className="text-zinc-300">/</span>
                    <div className="flex items-center gap-2 min-w-0">
                      {crumbs.map((c, idx) => (
                        <React.Fragment key={`${c.label}-${idx}`}>
                          {idx !== 0 ? <span className="text-zinc-300">·</span> : null}
                          {c.to ? (
                            <button
                              onClick={() => navigate(c.to!)}
                              className="truncate hover:text-zinc-700 transition"
                              type="button"
                            >
                              {c.label}
                            </button>
                          ) : (
                            <span className="truncate">{c.label}</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ) : subtitle ? (
                  <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 min-w-0">
                    <span className="text-zinc-300">/</span>
                    <span className="truncate">{subtitle}</span>
                  </div>
                ) : null}
              </div>

              <div className="mt-1 h-[2px] w-14 rounded-full bg-yellow-300/70" />
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {actions ? <div className="hidden md:flex items-center gap-2">{actions}</div> : null}

              {/* Search */}
              {!hideSearch ? (
                <div className="hidden md:flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm transition-all duration-300 hover:border-yellow-300 hover:shadow-md focus-within:border-yellow-400 focus-within:shadow-md focus-within:ring-4 focus-within:ring-yellow-200/40">
                  <Search className="h-4 w-4 text-zinc-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitSearch();
                    }}
                    className="w-44 outline-none bg-transparent text-sm placeholder:text-zinc-400 transition-all duration-300 focus:w-64"
                    placeholder={searchPlaceholder}
                  />
                  <kbd className="ml-1 hidden lg:inline-flex rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-500">
                    ⌘ K
                  </kbd>
                </div>
              ) : null}

              {/* Notifications (Instagram-ish) */}
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    // اگر نوتیف نداره، مستقیم برو صفحه نوتیف‌ها
                    if (!hasNotif) {
                      navigate("/notifications");
                      return;
                    }
                    setNotifOpen((v) => !v);
                  }}
                  className="
                    group relative h-10 w-10 rounded-xl
                    border border-zinc-200 bg-white
                    flex items-center justify-center
                    shadow-sm transition-all duration-300
                    hover:-translate-y-0.5 hover:shadow-md
                    hover:border-yellow-300
                  "
                  type="button"
                  aria-label="Notifications"
                >
                  {/* ✅ Badge فقط وقتی نوتیف واقعی داریم */}
                  {hasNotif ? (
                    <>
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-rose-400 ring-2 ring-white" />
                      <span className="absolute -right-2 -top-2 h-5 min-w-[20px] px-1 rounded-full bg-rose-400 text-white text-[10px] font-bold grid place-items-center ring-2 ring-white">
                        {joinNotif.count > 99 ? "99+" : joinNotif.count}
                      </span>
                    </>
                  ) : null}
                  <Bell className="h-4 w-4 text-zinc-600 transition-transform duration-300 group-hover:-rotate-6" />
                </button>

                <AnimatePresence>
                  {notifOpen && hasNotif ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="
                        absolute right-0 top-[calc(100%+10px)]
                        w-[340px]
                        rounded-3xl border border-zinc-200
                        bg-white/95 backdrop-blur
                        shadow-xl overflow-hidden z-50
                      "
                    >
                      <div className="p-4 border-b border-zinc-200 bg-white/70">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-zinc-900">Requests</p>
                          <span className="text-xs font-semibold text-zinc-500">
                            {joinNotif.count} pending
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          New join requests for your private groups
                        </p>
                      </div>

                      <div className="p-2 max-h-[360px] overflow-auto">
                        {joinNotif.items.map((it) => (
                          <button
                            key={`${it.groupId}-${it.uid}-${it.createdAt}`}
                            className="
                              w-full text-left
                              rounded-2xl border border-zinc-200 bg-white
                              px-3 py-3 mb-2
                              hover:border-yellow-300 hover:bg-yellow-50/40 transition
                            "
                            type="button"
                            onClick={() => {
                              setNotifOpen(false);
                              navigate("/notifications", { state: { focus: "requests" } });
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-10 w-10 rounded-2xl border border-zinc-200 bg-[#FFFBF2] grid place-items-center">
                                <Users className="h-4 w-4 text-zinc-700" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-zinc-900 truncate">
                                  Join request
                                </p>
                                <p className="mt-0.5 text-xs text-zinc-600 truncate">
                                  User #{it.uid} → <span className="font-semibold">{it.groupName}</span>
                                </p>
                                <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                                  <Clock className="h-3 w-3" />
                                  {formatWhen(it.createdAt)}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            navigate("/notifications", { state: { focus: "requests" } });
                          }}
                          className="
                            w-full rounded-2xl border border-zinc-200 bg-white
                            px-4 py-3 text-sm font-semibold text-zinc-800
                            hover:border-yellow-300 hover:bg-yellow-50 transition-colors
                          "
                        >
                          View all →
                        </button>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Profile (همون کد خودت) */}
              <div
                className="relative"
                onMouseEnter={() => setProfileOpen(true)}
                onMouseLeave={() => setProfileOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="
                    group flex items-center gap-2
                    rounded-xl border border-zinc-200 bg-white
                    px-2.5 py-2 shadow-sm
                    transition-all duration-300
                    hover:-translate-y-0.5 hover:shadow-md
                    hover:border-yellow-300
                    focus:outline-none focus:ring-4 focus:ring-yellow-200/40
                  "
                >
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-zinc-200 bg-zinc-100">
                    {p.avatarUrl ? (
                      <img
                        src={p.avatarUrl}
                        alt="avatar"
                        className="h-full w-full object-cover"
                        onError={() => setAvatarUrl(null)}
                      />
                    ) : (
                      <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(250,204,21,0.35),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.04),transparent_60%)]" />
                    )}
                  </div>

                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-zinc-800 leading-none">
                      {p.fullName?.trim() || p.username}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500 leading-none">
                      {loadingProfile ? "Loading..." : (p.role ?? "Student")}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-zinc-500 group-hover:text-zinc-700 transition-colors">
                    <Settings2 className="h-3.5 w-3.5" />
                  </div>
                </button>

              </div>
            </div>
          </div>

          {/* Mobile search */}
          {!hideSearch ? (
            <div className="mt-3 md:hidden">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 shadow-sm transition-all duration-300 focus-within:border-yellow-400 focus-within:ring-4 focus-within:ring-yellow-200/40">
                <Search className="h-4 w-4 text-zinc-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitSearch();
                  }}
                  className="w-full outline-none bg-transparent text-sm placeholder:text-zinc-400"
                  placeholder={searchPlaceholder}
                />
              </div>
            </div>
          ) : null}
        </div>
      </header>
    </>
  );
}
