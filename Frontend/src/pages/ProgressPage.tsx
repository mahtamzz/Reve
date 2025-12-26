import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Flame,
  Timer,
  CalendarDays,
  Target,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/client";
import { useStudyDashboard, useSessions } from "@/hooks/useStudy";
import { useUpdateWeeklyGoal } from "@/hooks/useStudy";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type WeekPoint = { day: string; minutes: number };

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}
function getHttpStatus(err: unknown): number | undefined {
  return err instanceof ApiError ? err.status : (err as any)?.status;
}

// ---------- UTC helpers (must match backend day bucketing) ----------
function utcDateKeyFromIso(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfUTCDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function addUTCDays(d: Date, delta: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + delta);
  return x;
}
function utcDateKey(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfUTCWeekMonday(d: Date) {
  const x = startOfUTCDay(d);
  const dow = x.getUTCDay(); // 0=Sun..6=Sat
  const diff = (dow + 6) % 7; // Monday => 0
  return addUTCDays(x, -diff);
}
function endExclusiveOfUTCWeekMonday(d: Date) {
  return addUTCDays(startOfUTCWeekMonday(d), 7);
}
function labelsMonSun() {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
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

export default function ProgressPage() {
  const qc = useQueryClient();
  const [range, setRange] = useState<"week" | "month">("week");

  // ✅ this week in UTC (Mon..Sun)
  const weekStart = useMemo(() => startOfUTCWeekMonday(new Date()), []);
  const weekEndEx = useMemo(() => endExclusiveOfUTCWeekMonday(new Date()), []);

  // dashboard uses YYYY-MM-DD (UTC)
  const dashFrom = useMemo(() => utcDateKey(weekStart), [weekStart]);
  const dashTo = useMemo(() => utcDateKey(addUTCDays(weekEndEx, -1)), [weekEndEx]);

  const { data: dashboard, isLoading: dashLoading, error: dashError } = useStudyDashboard({
    from: dashFrom,
    to: dashTo,
  });

  // ✅ Source of truth for minutes: sessions (avoid totals bugs/inclusive issues)
  const sessionsParams = useMemo(
    () => ({
      from: weekStart.toISOString(), // 00:00:00Z Monday
      to: weekEndEx.toISOString(),   // 00:00:00Z next Monday
      limit: 5000,
      offset: 0,
    }),
    [weekStart, weekEndEx]
  );

  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } =
    useSessions(sessionsParams);

  const { mutate: updateWeeklyGoal, isPending: goalUpdating } = useUpdateWeeklyGoal();

  // ------- build weekly minutes from sessions using SAME UTC bucketing as backend -------
  const weekly: WeekPoint[] = useMemo(() => {
    const labels = labelsMonSun();

    // init 7 day bins
    const minsByDay = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      minsByDay.set(utcDateKey(addUTCDays(weekStart, i)), 0);
    }

    for (const s of sessions ?? []) {
      const startedAt = readStartedAtIso(s);
      if (!startedAt) continue;

      const dayKey = utcDateKeyFromIso(startedAt);
      if (!dayKey) continue;

      if (!minsByDay.has(dayKey)) continue; // out of week window
      minsByDay.set(dayKey, (minsByDay.get(dayKey) ?? 0) + readDurationMins(s));
    }

    return labels.map((label, i) => {
      const key = utcDateKey(addUTCDays(weekStart, i));
      return { day: label, minutes: minsByDay.get(key) ?? 0 };
    });
  }, [sessions, weekStart]);

  const focusThisWeekMinutes = useMemo(
    () => weekly.reduce((a, b) => a + b.minutes, 0),
    [weekly]
  );

  const sessionsThisWeek = useMemo(() => {
    let c = 0;
    for (const s of sessions ?? []) {
      if (readDurationMins(s) > 0) c++;
    }
    return c;
  }, [sessions]);

  const daysActive = useMemo(() => weekly.filter((x) => x.minutes > 0).length, [weekly]);

  const bestDay = useMemo(() => {
    const max = Math.max(...weekly.map((d) => d.minutes), 0);
    if (max <= 0) return "—";
    const idx = weekly.findIndex((d) => d.minutes === max);
    return weekly[idx]?.day ?? "—";
  }, [weekly]);

  const stats = useMemo(() => (dashboard as any)?.stats ?? {}, [dashboard]);

  const streakDays = useMemo(() => {
    const n = Number(stats.streak_current ?? 0);
    return Number.isFinite(n) ? n : 0;
  }, [stats]);

  const goalWeeklyMinutes = useMemo(() => {
    const n = Number(stats.weekly_goal_mins ?? 0);
    return Number.isFinite(n) ? n : 0;
  }, [stats]);

  const goalPct = useMemo(() => {
    if (!goalWeeklyMinutes || goalWeeklyMinutes <= 0) return 0;
    return Math.min(100, Math.round((focusThisWeekMinutes / goalWeeklyMinutes) * 100));
  }, [focusThisWeekMinutes, goalWeeklyMinutes]);

  const maxBar = useMemo(() => Math.max(...weekly.map((d) => d.minutes), 1), [weekly]);

  const anyLoading = dashLoading || sessionsLoading;
  const anyError = dashError || sessionsError;
  const status = getHttpStatus(dashError) ?? getHttpStatus(sessionsError);

  const handleAdjustWeeklyGoal = () => {
    const current = goalWeeklyMinutes || 0;
    const raw = window.prompt("Set weekly goal (minutes):", String(current || 240));
    if (raw == null) return;
    const next = Math.max(0, Math.round(Number(raw)));
    if (!Number.isFinite(next)) return;

    updateWeeklyGoal(next, {
      onSuccess: async () => {
        await qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === "study" &&
            q.queryKey[1] === "dashboard",
        });
      },
    });
  };

  if (anyLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-600">Loading progress…</p>
      </div>
    );
  }

  if (anyError) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-600">
          {status === 401 ? "Session expired. Please login again." : "Failed to load progress."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="rounded-[28px] border border-zinc-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="relative p-6 sm:p-7">
            <div aria-hidden className="pointer-events-none absolute -top-20 -right-28 h-64 w-64 rounded-full bg-yellow-200/35 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-200/20 blur-3xl" />

            <div className="relative flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-2xl border border-yellow-200 bg-yellow-50 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-yellow-700" />
                    </div>

                    <div>
                      <h1 className="text-xl font-semibold text-zinc-900">Progress</h1>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        Weekly minutes are computed from sessions (UTC day buckets).
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-[2px] w-20 rounded-full bg-yellow-300/70" />
                </div>

                <div className="shrink-0 rounded-2xl border border-zinc-200 bg-white/70 backdrop-blur p-1 flex items-center gap-1">
                  <Pill active={range === "week"} onClick={() => setRange("week")} label="This week" />
                  <Pill active={range === "month"} onClick={() => setRange("month")} label="This month" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title="Current streak"
                  value={`${streakDays} days`}
                  sub={`Best day: ${bestDay}`}
                  icon={<Flame className="h-5 w-5" />}
                  accent="yellow"
                />
                <KpiCard
                  title="Focus this week"
                  value={`${focusThisWeekMinutes} min`}
                  sub={`Days active: ${daysActive}/7`}
                  icon={<Timer className="h-5 w-5" />}
                  accent="sky"
                />
                <KpiCard
                  title="Sessions this week"
                  value={`${sessionsThisWeek}`}
                  sub="Count of logged sessions"
                  icon={<CalendarDays className="h-5 w-5" />}
                  accent="zinc"
                />
                <KpiCard
                  title="Weekly goal"
                  value={`${goalPct}%`}
                  sub={`${focusThisWeekMinutes}/${goalWeeklyMinutes || 0} min`}
                  icon={<Target className="h-5 w-5" />}
                  accent="yellow"
                  progress={goalWeeklyMinutes > 0 ? goalPct : 0}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 bg-white">
            <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Weekly activity</p>
                    <p className="mt-1 text-xs text-zinc-500">Minutes studied each day (Mon–Sun, UTC)</p>
                  </div>

                  <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100/60 px-3 py-1 text-[11px] font-semibold text-yellow-800">
                    {focusThisWeekMinutes} min total
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-7 gap-2 items-end h-40">
                  {weekly.map((d) => {
                    const h = Math.round((d.minutes / maxBar) * 100);
                    const isZero = d.minutes === 0;

                    return (
                      <div key={d.day} className="flex flex-col items-center gap-2">
                        <div className="w-full h-28 flex items-end">
                          <div
                            className={cx(
                              "w-full rounded-2xl border transition",
                              isZero
                                ? "bg-zinc-100 border-zinc-200"
                                : "bg-yellow-200/70 border-yellow-200 hover:bg-yellow-200"
                            )}
                            style={{ height: `${Math.max(8, h)}%` }}
                            title={`${d.day}: ${d.minutes} min`}
                          />
                        </div>
                        <div className="text-[11px] text-zinc-500">{d.day}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4">
                  <p className="text-xs font-semibold text-zinc-900">Insight</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Your strongest day is{" "}
                    <span className="font-semibold text-zinc-800">{bestDay}</span>.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-zinc-900">Goals</p>
                <p className="mt-1 text-xs text-zinc-500">Small targets keep you consistent.</p>

                <div className="mt-4 space-y-3">
                  <GoalRow title="Study 4 days this week" done={daysActive >= 4} meta={`${daysActive}/4 days`} />
                  <GoalRow
                    title="Reach weekly minutes goal"
                    done={goalWeeklyMinutes > 0 ? focusThisWeekMinutes >= goalWeeklyMinutes : false}
                    meta={`${focusThisWeekMinutes}/${goalWeeklyMinutes || 0} min`}
                  />
                  <GoalRow title="Keep streak alive today" done={true} meta="Tracked by server streak" />
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={handleAdjustWeeklyGoal}
                    disabled={goalUpdating}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:border-yellow-300 hover:bg-yellow-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {goalUpdating ? "Saving..." : "Adjust weekly goal"}
                    <ChevronRight className="inline-block ml-2 h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-semibold text-zinc-900">Tip</p>
                  <p className="mt-1 text-sm text-zinc-600">Short sessions daily are better than one long session.</p>
                </div>
              </div>
            </div>

            <div className="px-5 sm:px-7 pb-7">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={range}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-semibold text-zinc-900">
                    {range === "week" ? "This week summary" : "This month summary"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {range === "week"
                      ? "If dashboard totals are buggy, this page still stays correct (sessions-based)."
                      : "Monthly view not wired yet."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ----------------- UI components ----------------- */

function Pill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-2xl px-3 py-2 text-sm font-semibold transition",
        active ? "bg-white border border-zinc-200 text-zinc-900 shadow-sm" : "text-zinc-600 hover:bg-white/60"
      )}
    >
      {label}
    </button>
  );
}

function KpiCard({
  title,
  value,
  sub,
  icon,
  accent,
  progress,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: "yellow" | "sky" | "zinc";
  progress?: number;
}) {
  const accentClasses =
    accent === "yellow"
      ? "border-yellow-200 bg-yellow-50 text-yellow-800"
      : accent === "sky"
      ? "border-sky-200 bg-sky-50 text-sky-800"
      : "border-zinc-200 bg-zinc-50 text-zinc-700";

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-zinc-500">{title}</div>
          <div className="mt-1 text-lg font-semibold text-zinc-900">{value}</div>
          <div className="mt-1 text-xs text-zinc-500">{sub}</div>
        </div>

        <div className={cx("h-10 w-10 rounded-2xl border flex items-center justify-center", accentClasses)}>
          {icon}
        </div>
      </div>

      {typeof progress === "number" ? (
        <div className="mt-4">
          <div className="h-2 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200">
            <div className="h-full bg-yellow-300" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">Progress to weekly goal</div>
        </div>
      ) : null}
    </div>
  );
}

function GoalRow({ title, meta, done }: { title: string; meta: string; done: boolean }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900 truncate">{title}</p>
          <p className="mt-1 text-xs text-zinc-500">{meta}</p>
        </div>

        <div
          className={cx(
            "h-9 w-9 rounded-2xl border flex items-center justify-center shrink-0",
            done ? "border-yellow-200 bg-yellow-100/70 text-yellow-900" : "border-zinc-200 bg-zinc-50 text-zinc-600"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
