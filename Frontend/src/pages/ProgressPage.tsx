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

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type WeekPoint = {
  day: string; // Mon..Sun or localized
  minutes: number;
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function ProgressPage() {
  // ---- mock data (بعداً از API بیار)
  const data = useMemo(() => {
    const weekly: WeekPoint[] = [
      { day: "Mon", minutes: 35 },
      { day: "Tue", minutes: 50 },
      { day: "Wed", minutes: 0 },
      { day: "Thu", minutes: 45 },
      { day: "Fri", minutes: 60 },
      { day: "Sat", minutes: 25 },
      { day: "Sun", minutes: 40 },
    ];

    const totalWeek = weekly.reduce((a, b) => a + b.minutes, 0);
    const sessionsWeek = weekly.filter((x) => x.minutes > 0).length;

    return {
      streakDays: 12,
      bestDay: "Fri",
      focusThisWeekMinutes: totalWeek,
      sessionsThisWeek: sessionsWeek,
      goalWeeklyMinutes: 240,
      weekly,
      lifetimeMinutes: 3820,
    };
  }, []);

  const [range, setRange] = useState<"week" | "month">("week");

  const goalPct = Math.min(
    100,
    Math.round((data.focusThisWeekMinutes / data.goalWeeklyMinutes) * 100)
  );

  const max = Math.max(...data.weekly.map((d) => d.minutes), 1);

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="rounded-[28px] border border-zinc-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="relative p-6 sm:p-7">
            {/* glows */}
            <div
              aria-hidden
              className="pointer-events-none absolute -top-20 -right-28 h-64 w-64 rounded-full bg-yellow-200/35 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-200/20 blur-3xl"
            />

            <div className="relative flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-2xl border border-yellow-200 bg-yellow-50 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-yellow-700" />
                    </div>

                    <div>
                      <h1 className="text-xl font-semibold text-zinc-900">
                        Progress
                      </h1>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        Track your focus time, streaks, and weekly consistency.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 h-[2px] w-20 rounded-full bg-yellow-300/70" />
                </div>

                <div className="shrink-0 rounded-2xl border border-zinc-200 bg-white/70 backdrop-blur p-1 flex items-center gap-1">
                  <Pill
                    active={range === "week"}
                    onClick={() => setRange("week")}
                    label="This week"
                  />
                  <Pill
                    active={range === "month"}
                    onClick={() => setRange("month")}
                    label="This month"
                  />
                </div>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  title="Current streak"
                  value={`${data.streakDays} days`}
                  sub={`Best day: ${data.bestDay}`}
                  icon={<Flame className="h-5 w-5" />}
                  accent="yellow"
                />
                <KpiCard
                  title="Focus this week"
                  value={`${data.focusThisWeekMinutes} min`}
                  sub={`Lifetime: ${data.lifetimeMinutes} min`}
                  icon={<Timer className="h-5 w-5" />}
                  accent="sky"
                />
                <KpiCard
                  title="Sessions this week"
                  value={`${data.sessionsThisWeek}`}
                  sub="Days with study activity"
                  icon={<CalendarDays className="h-5 w-5" />}
                  accent="zinc"
                />
                <KpiCard
                  title="Weekly goal"
                  value={`${goalPct}%`}
                  sub={`${data.focusThisWeekMinutes}/${data.goalWeeklyMinutes} min`}
                  icon={<Target className="h-5 w-5" />}
                  accent="yellow"
                  progress={goalPct}
                />
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="border-t border-zinc-200 bg-white">
            <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Chart */}
              <div className="lg:col-span-2 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">
                      Weekly activity
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Minutes studied each day
                    </p>
                  </div>

                  <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100/60 px-3 py-1 text-[11px] font-semibold text-yellow-800">
                    {data.focusThisWeekMinutes} min total
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-7 gap-2 items-end h-40">
                  {data.weekly.map((d) => {
                    const h = Math.round((d.minutes / max) * 100);
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
                    Your strongest day is <span className="font-semibold text-zinc-800">{data.bestDay}</span>.
                    Try to repeat the same routine on weaker days.
                  </p>
                </div>
              </div>

              {/* Goals / Actions */}
              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-zinc-900">Goals</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Small targets keep you consistent.
                </p>

                <div className="mt-4 space-y-3">
                  <GoalRow
                    title="Study 4 days this week"
                    done={data.sessionsThisWeek >= 4}
                    meta={`${data.sessionsThisWeek}/4 days`}
                  />
                  <GoalRow
                    title="Reach weekly minutes goal"
                    done={data.focusThisWeekMinutes >= data.goalWeeklyMinutes}
                    meta={`${data.focusThisWeekMinutes}/${data.goalWeeklyMinutes} min`}
                  />
                  <GoalRow
                    title="Keep streak alive today"
                    done={true}
                    meta="On track"
                  />
                </div>

                <div className="mt-5">
                  <button
                    type="button"
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 hover:border-yellow-300 hover:bg-yellow-50 transition"
                  >
                    Adjust weekly goal
                    <ChevronRight className="inline-block ml-2 h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-semibold text-zinc-900">Tip</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Short sessions daily are better than one long session.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom strip */}
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
                      ? "You’re building a solid routine. Keep the streak alive and aim for your weekly minutes goal."
                      : "Monthly view can show trends and improvements. You can plug real monthly data here."}
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

/* ----------------- Components ----------------- */

function Pill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-2xl px-3 py-2 text-sm font-semibold transition",
        active
          ? "bg-white border border-zinc-200 text-zinc-900 shadow-sm"
          : "text-zinc-600 hover:bg-white/60"
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
  progress?: number; // 0..100
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

        <div
          className={cx(
            "h-10 w-10 rounded-2xl border flex items-center justify-center",
            accentClasses
          )}
        >
          {icon}
        </div>
      </div>

      {typeof progress === "number" ? (
        <div className="mt-4">
          <div className="h-2 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200">
            <div
              className="h-full bg-yellow-300"
              style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-zinc-500">
            Progress to weekly goal
          </div>
        </div>
      ) : null}
    </div>
  );
}

function GoalRow({
  title,
  meta,
  done,
}: {
  title: string;
  meta: string;
  done: boolean;
}) {
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
            done
              ? "border-yellow-200 bg-yellow-100/70 text-yellow-900"
              : "border-zinc-200 bg-zinc-50 text-zinc-600"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
