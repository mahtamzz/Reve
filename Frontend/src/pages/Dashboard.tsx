import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";

import { useProfileMe } from "@/hooks/useProfileMe";
import { ApiError } from "@/api/client";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";

import { WeeklyStudyChart } from "@/components/Dashboard/LineChart";
import type { WeeklyPoint } from "@/components/Dashboard/LineChart";
import { SubjectCard } from "@/components/Dashboard/SubjectCard";
import { ChallengeCard } from "@/components/Dashboard/ChallengeCard";
import LookAtBuddy from "@/components/LookAtBuddy";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function lastNDays(n: number) {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(isoDate(d));
  }
  return out;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const { data, isLoading, error } = useProfileMe();

  const [score, setScore] = useState<number>(0);

  // weekly: همیشه 7 روز اخیر (فعلاً mock مثل قبل)
  const [weekly, setWeekly] = useState<WeeklyPoint[]>(() => {
    const days = lastNDays(7);
    return days.map((date, idx) => ({
      date,
      hours: [2, 4, 3, 6, 5, 9, 4][idx] ?? 0,
    }));
  });

  const totalHours = useMemo(() => weekly.reduce((s, x) => s + x.hours, 0), [weekly]);

  const [toast, setToast] = useState<{
    points: number;
    minutes: number;
    hours: number;
  } | null>(null);

  useEffect(() => {
    if (!data) return;
    setScore(data.profile.xp);
  }, [data]);


  useEffect(() => {
    const focusSeconds = (location.state as any)?.focusSeconds as number | undefined;
    if (!focusSeconds || focusSeconds <= 0) return;
  
    const hoursAdded = focusSeconds / 3600;
    const minutes = Math.max(1, Math.round(focusSeconds / 60));
  
    // هر 5 دقیقه کامل = 1 امتیاز | زیر 5 دقیقه = 0
    const pointsAdded = Math.floor(focusSeconds / 300);
  
    // ✅ فقط اگر امتیاز داریم به score اضافه کن و toast امتیاز نشون بده
    if (pointsAdded > 0) {
      setScore((s) => s + pointsAdded);
  
      setToast({ points: pointsAdded, minutes, hours: hoursAdded });
    } else {
      // اگر دوست داری زیر 5 دقیقه هم یه پیام نشون بدی، اینو نگه دار
      // یا کلاً حذفش کن تا هیچ toast نیاد.
      setToast({ points: 0, minutes, hours: hoursAdded });
    }
  
    // weekly رو همیشه برای 7 روز اخیر نگه می‌داریم و امروز رو آپدیت می‌کنیم
    const days = lastNDays(7);
    const today = days[days.length - 1];
  
    setWeekly((prev) => {
      const map = new Map(prev.map((p) => [p.date, p.hours]));
      const next = days.map((date) => ({
        date,
        hours: (map.get(date) ?? 0) + (date === today ? hoursAdded : 0),
      }));
      return next;
    });
  
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);
  

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  // ====== UI states (loading / error / unauthenticated) ======
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-600">Loading dashboard…</p>
      </div>
    );
  }

  if (error) {
    const err = error as ApiError<any>;
    const isAuthError = err.status === 401;

    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-600">
          {isAuthError ? "Session expired. Please login again." : "Failed to load dashboard."}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-600">No data.</p>
      </div>
    );
  }

  const { profile } = data;
  const username = profile.display_name; 
  const streak = profile.streak;


  const handleLogout = async () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="dashboard" onLogout={handleLogout} />

        {/* چون Sidebar fixed است */}
        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar
            username={username}
            profile={{
              username,
              email: "", // اگر لازم داری باید از auth/me هم بگیری یا در profile اضافه کنی
              fullName: username,
              role: "Student",
              avatarUrl: null,
            }}
          />

          <div className="mx-auto max-w-6xl px-4 py-6">
            {/* ROW 1 */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left hero */}
              <section className="col-span-12 lg:col-span-5">
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                  {/* accents */}
                  <div className="pointer-events-none absolute -top-12 -right-14 h-48 w-48 rounded-full bg-yellow-200/45 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-yellow-100/60 blur-3xl" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
                        Welcome back, <span className="text-zinc-800">{username}</span>
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">
                        Keep your routine steady and improve your focus.
                      </p>
                    </div>
                  </div>

                  {/* stats */}
                  <div className="relative mt-6 grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4">
                      <p className="text-xs text-zinc-500">Streak</p>
                      <p className="mt-1 text-3xl font-semibold text-amber-700">{streak}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">days</p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4">
                      <p className="text-xs text-zinc-500">XP</p>
                      <motion.p
                        key={score}
                        initial={{ y: 6, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="mt-1 text-3xl font-semibold text-emerald-600"
                      >
                        {score}
                      </motion.p>
                      <p className="mt-1 text-[11px] text-zinc-500">total points</p>
                    </div>
                  </div>

                  {/* Study Buddy */}
                  <div className="relative mt-5">
                    <LookAtBuddy label="Study buddy" />
                  </div>

                  <div className="relative mt-5 rounded-2xl border border-zinc-200 bg-gradient-to-br from-yellow-50 to-white p-4">
                    <p className="mt-1 text-xs text-zinc-600">
                      Find people to study with and stay accountable.
                    </p>

                    {/* چون email نداریم، این بخش را اختیاری گذاشتیم */}
                    <p className="mt-2 text-xs text-zinc-500 truncate">
                      Timezone: <span className="text-zinc-700">{profile.timezone}</span>
                    </p>

                    <div className="mt-4 flex items-center justify-end">
                      <button
                        className="
                          rounded-xl border border-zinc-200 bg-white
                          px-3 py-1.5 text-xs font-medium text-zinc-700
                          hover:border-yellow-300 hover:text-zinc-900
                          transition-colors
                        "
                      >
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Right chart */}
              <section className="col-span-12 lg:col-span-7">
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Weekly Study</p>
                      <p className="mt-0.5 text-xs text-zinc-500">Last 7 days</p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-creamtext px-3 py-2">
                      <p className="text-[11px] text-zinc-500">Total</p>
                      <p className="text-sm font-semibold text-zinc-900">
                        {totalHours.toFixed(1)}h
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <WeeklyStudyChart data={weekly} />
                  </div>
                </motion.div>
              </section>
            </div>

            {/* ROW 2 */}
            <div className="mt-6 grid grid-cols-12 gap-6">
              {/* Subjects */}
              <section className="col-span-12 lg:col-span-6 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Subjects</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Hover a subject to preview</p>
                  </div>

                  <button
                    className="
                      group relative overflow-hidden
                      rounded-xl border border-zinc-200
                      bg-white px-3 py-1.5
                      text-xs font-medium text-zinc-700
                      shadow-sm
                      transition-all duration-300
                      hover:-translate-y-0.5 hover:shadow-md
                      hover:border-yellow-300 hover:text-zinc-900
                    "
                  >
                    <span
                      className="
                        pointer-events-none absolute inset-0
                        translate-x-[-120%] group-hover:translate-x-[120%]
                        transition-transform duration-700 ease-in-out
                        bg-[linear-gradient(90deg,transparent,rgba(250,204,21,0.18),transparent)]
                      "
                    />
                    <span className="relative z-10 flex items-center gap-2">
                      Manage
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-300 group-hover:bg-yellow-500 transition-colors duration-300" />
                    </span>
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <SubjectCard title="Math" nextText="Next: 25 min" />
                  <SubjectCard title="Physics" nextText="Next: 25 min" />
                  <SubjectCard title="English" nextText="Next: 25 min" />
                  <SubjectCard title="Biology" nextText="Next: 25 min" />
                </div>
              </section>

              {/* Challenges */}
              <section className="col-span-12 lg:col-span-6 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900">Challenges</p>
                  <span className="text-xs text-zinc-500">This week</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <ChallengeCard
                    title="Challenge 1"
                    percent={55}
                    description="Study at least 10 hours during this week"
                  />
                  <ChallengeCard
                    title="Challenge 2"
                    percent={92}
                    description="Complete all planned tasks without skipping a day"
                  />
                </div>

                <div className="mt-4 rounded-2xl bg-[#FFFBF2] border border-zinc-200 p-4">
                  <p className="text-sm font-semibold text-zinc-900">Tip</p>
                  <p className="text-xs text-zinc-600 mt-1">Small daily sessions beat cramming.</p>
                </div>
              </section>
            </div>

            <footer className="mt-10 text-center text-xs text-zinc-400">REVE dashboard</footer>
          </div>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="
                  fixed right-6 top-24 z-50
                  w-[320px]
                  rounded-3xl border border-zinc-200
                  bg-white shadow-xl p-4
                "
              >
                <p className="text-sm font-semibold text-zinc-900">Focus session completed</p>

                <p className="mt-1 text-xs text-zinc-600">
                  Studied <span className="font-semibold text-zinc-900">{toast.minutes} min</span>
                  <br />
                  {toast.points > 0 ? (
                    <>
                      XP <span className="font-semibold text-emerald-600">+{toast.points}</span>
                    </>
                  ) : (
                    <span className="text-zinc-500">No XP (minimum 5 minutes)</span>
                  )}
                                    
                  {" · "}
                  Today{" "}
                  <span className="font-semibold text-zinc-900">
                    +{clamp(toast.hours, 0, 24).toFixed(2)}h
                  </span>
                </p>

                <button
                  onClick={() => setToast(null)}
                  className="mt-3 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
