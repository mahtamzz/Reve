import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import { logout } from "@/utils/authToken";

import LookAtBuddy from "@/components/LookAtBuddy";
import { MemberCard, type Member } from "@/components/Groups/MemberCard";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type GroupDetailsData = {
  id: string;
  name: string;
  description: string;
  streak: number;
  xp: number;
  minimumDailyStudy: string;
  members: Member[];
};

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
      <p
        className={`mt-1 text-3xl font-semibold tabular-nums tracking-tight ${valueClassName}`}
      >
        {value}
      </p>
      {suffix ? <p className="mt-1 text-[11px] text-zinc-500">{suffix}</p> : null}
    </div>
  );
}


export default function GroupDetails() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const groupNameFromState = (location.state as { groupName?: string } | null)?.groupName;

  const [membersOpen, setMembersOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!membersOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMembersOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [membersOpen]);

  const data = useMemo<GroupDetailsData>(() => {
    const members: Member[] = [
      {
        id: "1",
        name: "nafas",
        avatarUrl:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=60",
        time: "01:12:14",
        online: true,
      },
      {
        id: "2",
        name: "mahta",
        avatarUrl:
          "https://images.unsplash.com/photo-1520975869018-7d4b23f3f4ad?auto=format&fit=crop&w=256&q=60",
        time: "01:12:14",
        online: true,
      },
      {
        id: "3",
        name: "lala",
        avatarUrl:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=60",
        time: "01:12:14",
        online: true,
      },
      {
        id: "4",
        name: "jajaja",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=60",
        time: "01:12:14",
        online: false,
      },
      {
        id: "5",
        name: "jajaja",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=60",
        time: "01:12:14",
        online: false,
      },
      {
        id: "6",
        name: "nafas",
        avatarUrl:
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=60",
        time: "01:12:14",
        online: true,
      },
      {
        id: "7",
        name: "lala",
        avatarUrl:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=256&q=60",
        time: "01:12:14",
        online: true,
      },
      {
        id: "8",
        name: "jajaja",
        avatarUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=60",
        time: "01:12:14",
        online: false,
      },
    ];

    return {
      id: groupId ?? "unknown",
      name: groupNameFromState ?? "Group",
      description:
        "A focused space to study together, keep streaks, and stay accountable. Set a daily minimum and climb the leaderboard.",
      streak: 20,
      xp: 1043,
      minimumDailyStudy: "12h",
      members,
    };
  }, [groupId, groupNameFromState]);

  const previewMembers = useMemo(() => data.members.slice(0, 4), [data.members]);

  const goToChat = () => {
    // مسیر چت رو اگر متفاوت است همینجا تغییر بده
    navigate(`/groups/${data.id}/chat`, {
      state: { groupName: data.name },
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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
            >
              <div>
                <p className="text-sm text-zinc-500">Groups / Details</p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                  {data.name}
                </h1>
                <p className="mt-1 text-sm text-zinc-600 max-w-2xl">{data.description}</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Chat button */}
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

                {/* Back button */}
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
              </div>
            </motion.div>

            {/* buddy */}
            <div className="mt-6">
              <LookAtBuddy label="Your study buddy" />
            </div>

            {/* main */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="relative mt-6 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200 overflow-hidden"
            >
              <div className="pointer-events-none absolute -top-16 -right-20 h-56 w-56 rounded-full bg-yellow-200/35 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-yellow-100/55 blur-3xl" />

              <div className="relative grid grid-cols-12 gap-6">
                {/* left */}
                <div className="col-span-12 lg:col-span-7">
                  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold text-zinc-500">Overview</p>
                        <p className="mt-1 text-sm text-zinc-600">
                          Quick snapshot of your group progress.
                        </p>
                      </div>

                      <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                        Live
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <StatCard
                        label="Streak"
                        value={data.streak}
                        suffix="days"
                        valueClassName="text-amber-500"
                      />
                      <StatCard
                        label="XP"
                        value={data.xp}
                        suffix="total"
                        valueClassName="text-sky-500"
                      />
                    </div>

                    <div className="mt-5 rounded-2xl border border-zinc-200 bg-gradient-to-br from-yellow-50/70 to-white p-4">
                      <p className="text-xs font-semibold text-zinc-900">Minimum daily study time</p>
                      <p className="mt-1 text-base font-semibold text-zinc-800 tabular-nums">
                        {data.minimumDailyStudy}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        Keep it realistic; consistency beats intensity.
                      </p>
                    </div>
                  </div>
                </div>

                {/* right */}
                <div className="col-span-12 lg:col-span-5 space-y-6">
                  {/* Members */}
                  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <p className="text-sm font-semibold text-zinc-900">Members</p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {data.members.length} members · live status
                    </p>

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

                  {/* Group Chat */}
                  <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">Group Chat</p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          Discuss goals, share progress, stay accountable.
                        </p>
                      </div>

                      <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
                        Chat
                      </span>
                    </div>

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
                        Open chat for {data.name}
                      </span>
                      <span className="text-xs text-zinc-500">→</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* MEMBERS MODAL */}
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
                      <div className="pointer-events-none absolute -top-16 -right-20 h-56 w-56 rounded-full bg-yellow-200/35 blur-3xl" />
                      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-yellow-100/55 blur-3xl" />

                      <div className="relative flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-zinc-500">Members</p>
                          <p className="mt-1 text-xl font-semibold text-zinc-900">
                            {data.name} — {data.members.length} members
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
                          {data.members.map((m) => (
                            <MemberCard key={m.id} m={m} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            <footer className="mt-10 text-center text-xs text-zinc-400">REVE dashboard</footer>
          </div>
        </div>
      </div>
    </div>
  );
}
