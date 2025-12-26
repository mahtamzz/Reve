// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/client";

import { useProfileMe, profileMeKey } from "@/hooks/useProfileMe";
import { useUpdateProfileMe } from "@/hooks/useUpdateProfileMe";
import { useSubjects, useStudyDashboard, useSessions, studyKeys } from "@/hooks/useStudy";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import { WeeklyStudyChart } from "@/components/Dashboard/LineChart";
import type { WeeklyPoint } from "@/components/Dashboard/LineChart";

import { SubjectCard } from "@/components/Dashboard/SubjectCard";
import { ChallengeCard } from "@/components/Dashboard/ChallengeCard";
import LookAtBuddy from "@/components/LookAtBuddy";

// ----------------- local date helpers (00:00 local) -----------------
function startOfLocalDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d: Date, delta: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + delta);
  return x;
}
function localDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function lastNLocalDays(n: number) {
  const out: string[] = [];
  const today0 = startOfLocalDay(new Date());
  for (let i = n - 1; i >= 0; i--) out.push(localDateKey(addDays(today0, -i)));
  return out;
}

function readDurationMins(s: any): number {
  const v = s.durationMins ?? s.duration_mins ?? s.duration ?? 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function readStartedAtIso(s: any): string | null {
  return (
    (s.startedAt ??
      s.started_at ??
      s.createdAt ??
      s.created_at ??
      s.loggedAt ??
      s.logged_at ??
      s.date ??
      s.timestamp ??
      null) as string | null
  );
}

function getHttpStatus(err: unknown): number | undefined {
  return err instanceof ApiError ? err.status : (err as any)?.status;
}
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

// chart builders (fallback from sessions if dashboard series isn't available)
function pickWeeklySeriesHours(dashboard: any): WeeklyPoint[] | null {
  const raw =
    dashboard?.weekly ??
    dashboard?.weeklySeries ??
    dashboard?.series ??
    dashboard?.points ??
    dashboard?.chart ??
    null;

  if (!Array.isArray(raw)) return null;

  const out: WeeklyPoint[] = [];
  for (const item of raw) {
    const dateRaw = String(item?.date ?? item?.day ?? item?.d ?? "");
    if (!dateRaw) continue;

    const mins = Number(item?.mins ?? item?.minutes ?? item?.durationMins ?? item?.duration_mins ?? 0);
    const hoursMaybe = Number(item?.hours);

    const hours = Number.isFinite(hoursMaybe)
      ? hoursMaybe
      : Number.isFinite(mins)
        ? mins / 60
        : 0;

    out.push({ date: dateRaw.slice(0, 10), hours: Math.max(0, hours) });
  }

  return out.length ? out : null;
}

function normalizeToLast7LocalDays(series: WeeklyPoint[] | null): WeeklyPoint[] {
  const days = lastNLocalDays(7);
  const map = new Map<string, number>();
  (series ?? []).forEach((p) => map.set(p.date.slice(0, 10), p.hours));
  return days.map((date) => ({ date, hours: map.get(date) ?? 0 }));
}

function buildWeeklyFromSessionsLocal(sessions: any[] | undefined): WeeklyPoint[] {
  const days = lastNLocalDays(7);
  const minsByDay = new Map<string, number>(days.map((d) => [d, 0]));

  for (const s of sessions ?? []) {
    const startedAt = readStartedAtIso(s);
    if (!startedAt) continue;

    const dt = new Date(startedAt);
    if (Number.isNaN(dt.getTime())) continue;

    const dayKey = localDateKey(dt);
    if (!minsByDay.has(dayKey)) continue;

    minsByDay.set(dayKey, (minsByDay.get(dayKey) ?? 0) + readDurationMins(s));
  }

  return days.map((date) => ({ date, hours: (minsByDay.get(date) ?? 0) / 60 }));
}

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fromISO = useMemo(() => addDays(startOfLocalDay(new Date()), -6).toISOString(), []);
  const toISO = useMemo(() => addDays(startOfLocalDay(new Date()), 1).toISOString(), []);

  const sessionsParams = useMemo(
    () => ({ from: fromISO, to: toISO, limit: 500, offset: 0 }),
    [fromISO, toISO]
  );

  const { data: me, isLoading: meLoading, error: meError } = useProfileMe();
  const { mutate: updateProfile, isPending: isUpdatingProfile, error: updateProfileError } =
    useUpdateProfileMe();

  const { data: dashboard, isLoading: dashLoading, error: dashError } = useStudyDashboard();
  const { data: subjects, isLoading: subjectsLoading, error: subjectsError } = useSubjects();
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } = useSessions(sessionsParams);

  const weekly: WeeklyPoint[] = useMemo(() => {
    const fromDash = pickWeeklySeriesHours(dashboard);
    if (fromDash?.length) return normalizeToLast7LocalDays(fromDash);
    return buildWeeklyFromSessionsLocal(sessions as any[] | undefined);
  }, [dashboard, sessions]);

  const totalHours = useMemo(() => weekly.reduce((sum, p) => sum + p.hours, 0), [weekly]);

  const [toast, setToast] = useState<{ minutes: number; points: number; hours: number } | null>(null);

  // ✅ after returning from FocusPage, refresh all dependent queries (server-authoritative)
  const consumedRef = useRef<string>("");

  useEffect(() => {
    const st = location.state as any;
    const focusSecondsRaw: unknown = st?.focusSeconds;
    if (focusSecondsRaw == null) return;

    let focusSeconds = Number(focusSecondsRaw);
    if (!Number.isFinite(focusSeconds) || focusSeconds <= 0) return;

    // guard: if minutes were passed by mistake
    if (focusSeconds < 1000) focusSeconds = focusSeconds * 60;

    const dedupeKey = `${focusSeconds}-${location.key ?? ""}`;
    if (consumedRef.current === dedupeKey) return;
    consumedRef.current = dedupeKey;

    const minutes = Math.max(1, Math.round(focusSeconds / 60));
    const points = Math.floor(minutes / 5); // just for toast (server computes real XP)

    setToast({ minutes, points: Math.max(0, points), hours: focusSeconds / 3600 });

    // ✅ refresh: sessions/dashboard/profile/subjects
    qc.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) && q.queryKey[0] === "study" && q.queryKey[1] === "sessions",
    });
    qc.invalidateQueries({
      predicate: (q) =>
        Array.isArray(q.queryKey) && q.queryKey[0] === "study" && q.queryKey[1] === "dashboard",
    });

    // ✅ FIX: must call subjects()
    qc.invalidateQueries({ queryKey: studyKeys.subjects() });

    // optional (keep if you want profile refreshed for other fields)
    qc.invalidateQueries({ queryKey: profileMeKey });

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, location.key, navigate, qc]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const anyLoading = meLoading || dashLoading || subjectsLoading || sessionsLoading;
  const anyError = meError || dashError || subjectsError || sessionsError;

  const status =
    getHttpStatus(meError) ??
    getHttpStatus(dashError) ??
    getHttpStatus(subjectsError) ??
    getHttpStatus(sessionsError);

  if (anyLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-600">Loading dashboard…</p>
      </div>
    );
  }

  if (anyError) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-600">
          {status === 401 ? "Session expired. Please login again." : "Failed to load dashboard."}
        </p>
      </div>
    );
  }

  const profile = (me as any)?.profile ?? (me as any) ?? {};
  const username: string = profile.display_name ?? profile.username ?? "User";

  // ✅ XP / streak MUST come from Study dashboard (because Study service updates them)
  const stats = (dashboard as any)?.stats ?? {};
  const streak: number = Number(stats.streak_current ?? stats.streak ?? stats.streakDays ?? 0) || 0;
  const xp: number = Number(stats.xp_total ?? stats.xp ?? stats.xpTotal ?? 0) || 0;

  const updateProfileErrMsg =
    updateProfileError && (updateProfileError as ApiError<any>)?.message
      ? (updateProfileError as ApiError<any>).message
      : updateProfileError
        ? "Failed to update profile."
        : null;

  const handleSaveTimezone = () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || profile.timezone || "UTC";
    updateProfile({ timezone: tz });
    qc.invalidateQueries({ queryKey: profileMeKey });
  };

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="dashboard" onLogout={() => navigate("/login")} />

        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar username={username} />

          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="grid grid-cols-12 gap-6">
              <section className="col-span-12 lg:col-span-5">
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="pointer-events-none absolute -top-12 -right-14 h-48 w-48 rounded-full bg-yellow-200/45 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-yellow-100/60 blur-3xl" />

                  <div className="relative">
                    <p className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
                      Welcome back, <span className="text-zinc-800">{username}</span>
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4">
                        <p className="text-xs text-zinc-500">Streak</p>
                        <p className="mt-1 text-3xl font-semibold text-amber-700">{streak}</p>
                        <p className="mt-1 text-[11px] text-zinc-500">days</p>
                      </div>

                      <div className="rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4">
                        <p className="text-xs text-zinc-500">XP</p>
                        <motion.p
                          key={xp}
                          initial={{ y: 6, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="mt-1 text-3xl font-semibold text-emerald-600"
                        >
                          {xp}
                        </motion.p>
                        <p className="mt-1 text-[11px] text-zinc-500">total points</p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <LookAtBuddy label="Study buddy" />
                    </div>

                    <div className="mt-5 rounded-2xl border border-zinc-200 bg-gradient-to-br from-yellow-50 to-white p-4">
                      <p className="text-xs text-zinc-500 truncate">
                        Timezone: <span className="text-zinc-700">{profile.timezone ?? "—"}</span>
                      </p>

                      {updateProfileErrMsg ? (
                        <p className="mt-2 text-xs text-rose-600">{updateProfileErrMsg}</p>
                      ) : null}

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={handleSaveTimezone}
                          disabled={isUpdatingProfile}
                          className="
                            rounded-xl border border-zinc-200 bg-white
                            px-3 py-1.5 text-xs font-medium text-zinc-700
                            hover:border-yellow-300 hover:text-zinc-900
                            transition-colors
                            disabled:opacity-60 disabled:cursor-not-allowed
                          "
                        >
                          {isUpdatingProfile ? "Saving..." : "Save timezone"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

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
                      <p className="mt-0.5 text-xs text-zinc-500">Last 7 days (local)</p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-creamtext px-3 py-2">
                      <p className="text-[11px] text-zinc-500">Total</p>
                      <p className="text-sm font-semibold text-zinc-900">{totalHours.toFixed(1)}h</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <WeeklyStudyChart data={weekly} />
                  </div>
                </motion.div>
              </section>
            </div>

            <div className="mt-6 grid grid-cols-12 gap-6">
              <section className="col-span-12 lg:col-span-6 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Subjects</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Pick one and start focusing</p>
                  </div>

                  <button
                    onClick={() => navigate("/study/subjects")}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:border-yellow-300 hover:text-zinc-900 transition"
                  >
                    Manage
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                {(subjects ?? []).slice(0, 4).map((sub: any) => (
                  <SubjectCard
                    key={sub.id}
                    subjectId={sub.id}
                    title={sub.name ?? sub.title}
                    color={sub.color}     // ✅ اضافه شد
                  />
                ))}


                  {(subjects ?? []).length === 0 ? (
                    <div className="col-span-2 rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4 text-sm text-zinc-600">
                      No subjects yet. Create one in “Manage”.
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="col-span-12 lg:col-span-6 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900">Challenges</p>
                  <span className="text-xs text-zinc-500">This week</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <ChallengeCard title="Challenge 1" percent={55} description="Study at least 10 hours during this week" />
                  <ChallengeCard title="Challenge 2" percent={92} description="Complete all planned tasks without skipping a day" />
                </div>

                <div className="mt-4 rounded-2xl bg-[#FFFBF2] border border-zinc-200 p-4">
                  <p className="text-sm font-semibold text-zinc-900">Tip</p>
                  <p className="text-xs text-zinc-600 mt-1">Small daily sessions beat cramming.</p>
                </div>
              </section>
            </div>

            <footer className="mt-10 text-center text-xs text-zinc-400">REVE dashboard</footer>
          </div>

          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="fixed right-6 top-24 z-50 w-[320px] rounded-3xl border border-zinc-200 bg-white shadow-xl p-4"
              >
                <p className="text-sm font-semibold text-zinc-900">Focus session completed</p>

                <p className="mt-1 text-xs text-zinc-600">
                  Studied <span className="font-semibold text-zinc-900">{toast.minutes} min</span>
                  <br />
                  XP <span className="font-semibold text-emerald-600">+{toast.points}</span>
                  {" · "}Today{" "}
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
