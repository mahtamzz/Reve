import { Search, Bell, Mail, User2, Settings2 } from "lucide-react";
import CommandPalette from "../ui/CommandPalette";
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type TopbarProfile = {
  username: string;
  email?: string;
  fullName?: string;
  role?: string;
  avatarUrl?: string | null;
};

export default function Topbar({
  username,
  profile,
}: {
  username: string;
  profile?: TopbarProfile;
}) {
  const [openCmd, setOpenCmd] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const p = useMemo<TopbarProfile>(() => {
    return (
      profile ?? {
        username,
        email: undefined,
        fullName: username,
        role: "Student",
        avatarUrl: null,
      }
    );
  }, [profile, username]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpenCmd(true);
      }
      if (e.key === "Escape") {
        setOpenCmd(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
                  Dashboard
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
                  <span className="text-zinc-300">/</span>
                  <span className="truncate">Study overview</span>
                </div>
              </div>

              <div className="mt-1 h-[2px] w-14 rounded-full bg-yellow-300/70" />
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div
                className="
                  hidden md:flex items-center gap-2
                  rounded-xl border border-zinc-200 bg-white
                  px-3 py-2
                  shadow-sm
                  transition-all duration-300
                  hover:border-yellow-300 hover:shadow-md
                  focus-within:border-yellow-400 focus-within:shadow-md
                  focus-within:ring-4 focus-within:ring-yellow-200/40
                "
              >
                <Search className="h-4 w-4 text-zinc-400 transition-colors duration-300 group-focus-within:text-zinc-600" />
                <input
                  className="
                    w-44 outline-none bg-transparent text-sm
                    placeholder:text-zinc-400
                    transition-all duration-300
                    focus:w-64
                  "
                  placeholder="Search..."
                />
                <kbd className="ml-1 hidden lg:inline-flex rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-500">
                  ⌘ K
                </kbd>
              </div>

              {/* Notifications */}
              <button
                onClick={() => navigate("/notifications")}
                className="
                  group relative h-10 w-10 rounded-xl
                  border border-zinc-200 bg-white
                  flex items-center justify-center
                  shadow-sm transition-all duration-300
                  hover:-translate-y-0.5 hover:shadow-md
                  hover:border-yellow-300
                "
              >
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-yellow-400" />
                <Bell className="h-4 w-4 text-zinc-600 transition-transform duration-300 group-hover:-rotate-6" />
              </button>


              {/* Profile (hover tooltip + click -> settings) */}
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
                    px-2.5 py-2
                    shadow-sm
                    transition-all duration-300
                    hover:-translate-y-0.5 hover:shadow-md
                    hover:border-yellow-300
                    focus:outline-none focus:ring-4 focus:ring-yellow-200/40
                  "
                >
                  {/* Avatar */}
                  <div className="h-8 w-8 rounded-full overflow-hidden border border-zinc-200 bg-zinc-100">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(250,204,21,0.35),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.04),transparent_60%)]" />
                    )}
                  </div>

                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-zinc-800 leading-none">
                      {p.fullName?.trim() || p.username}
                    </div>
                    <div className="mt-1 text-[11px] text-zinc-500 leading-none">
                      {p.role ?? "Student"}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-zinc-500 group-hover:text-zinc-700 transition-colors">
                    <Settings2 className="h-3.5 w-3.5" />
                  </div>
                </button>

                {/* Hover card */}
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="
                        absolute right-0 top-[calc(100%+10px)]
                        w-[280px]
                        rounded-3xl border border-zinc-200
                        bg-white/90 backdrop-blur
                        shadow-xl
                        overflow-hidden
                        z-40
                      "
                    >
                      {/* accents */}
                      <div className="pointer-events-none absolute -top-12 -right-14 h-44 w-44 rounded-full bg-yellow-200/35 blur-3xl" />
                      <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-sky-200/20 blur-3xl" />

                      <div className="relative p-4">
                        <div className="flex items-start gap-3">
                          <div className="h-11 w-11 rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                            {p.avatarUrl ? (
                              <img src={p.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-zinc-600">
                                <User2 className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-900 truncate">
                              {p.fullName?.trim() || p.username}
                            </p>
                            <p className="mt-0.5 text-xs text-zinc-500 truncate">{p.role ?? "Student"}</p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-semibold text-zinc-600">
                                @{p.username}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100/60 px-2.5 py-1 text-[11px] font-semibold text-yellow-800">
                                Profile
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-zinc-500" />
                              <p className="text-xs font-semibold text-zinc-700">Email</p>
                            </div>
                            <p className="mt-1 text-sm text-zinc-900 truncate">{p.email ?? "—"}</p>
                          </div>

                          <div className="rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-3">
                            <p className="text-xs font-semibold text-zinc-900">Tip</p>
                            <p className="mt-1 text-xs text-zinc-600">
                              Click your profile to open profile.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate("/profile")}
                          className="
                            mt-3 w-full
                            rounded-2xl border border-zinc-200 bg-white
                            px-4 py-3 text-sm font-semibold text-zinc-800
                            hover:border-yellow-300 hover:bg-yellow-50 transition-colors
                          "
                        >
                          Open profile →
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Mobile search */}
          <div className="mt-3 md:hidden">
            <div
              className="
                flex items-center gap-2
                rounded-xl border border-zinc-200 bg-white
                px-3 py-2 shadow-sm
                transition-all duration-300
                focus-within:border-yellow-400 focus-within:ring-4 focus-within:ring-yellow-200/40
              "
            >
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                className="w-full outline-none bg-transparent text-sm placeholder:text-zinc-400"
                placeholder="Search..."
              />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
