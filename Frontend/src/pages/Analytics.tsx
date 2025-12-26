// src/pages/Analytics.tsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import { WeeklyStudyChart } from "@/components/Dashboard/LineChart";
import type { WeeklyPoint } from "@/components/Dashboard/LineChart";

import { logout } from "@/utils/authToken";
import { ApiError } from "@/api/client";

import { useProfileMe } from "@/hooks/useProfileMe";
import { useSubjects, useSessions } from "@/hooks/useStudy";

// ---------- helpers (LOCAL time, starts at 00:00) ----------
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
// YYYY-MM-DD based on LOCAL time (نه UTC)
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
function toHours(mins: number) {
  return mins / 60;
}
function getHttpStatus(err: unknown): number | undefined {
  return err instanceof ApiError ? err.status : (err as any)?.status;
}

// session field readers (support snake/camel)
function readSubjectId(s: any): string {
  return (s.subjectId ?? s.subject_id ?? s.subject?.id ?? "") as string;
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

type SubjectAnalytics = {
  id: string;
  title: string;
  weekly: WeeklyPoint[];
};

function sumHours(weekly: WeeklyPoint[]) {
  return weekly.reduce((acc, x) => acc + x.hours, 0);
}

export default function Analytics() {
  // ✅ نمودار 7 روز اخیر بر اساس روزهای لوکال
  const days = useMemo(() => lastNLocalDays(7), []);

  // ✅ بازه‌ی API: از 00:00 شش روز قبل تا 00:00 فردا (کل امروز پوشش داده میشه)
  const fromIso = useMemo(() => addDays(startOfLocalDay(new Date()), -6).toISOString(), []);
  const toIso = useMemo(() => addDays(startOfLocalDay(new Date()), 1).toISOString(), []);

  const sessionsParams = useMemo(
    () => ({ from: fromIso, to: toIso, limit: 500, offset: 0 }),
    [fromIso, toIso]
  );

  const { data: profileData, isLoading: profileLoading, error: profileError } = useProfileMe();
  const { data: subjects, isLoading: subjectsLoading, error: subjectsError } = useSubjects();
  const { data: sessions, isLoading: sessionsLoading, error: sessionsError } = useSessions(sessionsParams);

  const isLoading = profileLoading || subjectsLoading || sessionsLoading;
  const anyError = profileError || subjectsError || sessionsError;

  const status =
    getHttpStatus(profileError) ?? getHttpStatus(subjectsError) ?? getHttpStatus(sessionsError);

  const username = profileData?.profile?.display_name ?? "User";

  const subjectAnalytics = useMemo<SubjectAnalytics[]>(() => {
    const subs = subjects ?? [];
    const sess = sessions ?? [];

    // subjectId -> (YYYY-MM-DD local) -> total minutes
    const bySubject = new Map<string, Map<string, number>>();

    for (const s of sess as any[]) {
      const sid = readSubjectId(s);
      if (!sid) continue;

      const startedAt = readStartedAtIso(s);
      if (!startedAt) continue;

      const dt = new Date(startedAt);
      if (Number.isNaN(dt.getTime())) continue;

      const dayKey = localDateKey(dt);
      const mins = readDurationMins(s);

      if (!bySubject.has(sid)) bySubject.set(sid, new Map());
      const dayMap = bySubject.get(sid)!;
      dayMap.set(dayKey, (dayMap.get(dayKey) ?? 0) + mins);
    }

    return subs.map((sub: any) => {
      const sid = String(sub.id ?? "");
      const title = String(sub.name ?? sub.title ?? "Subject");
      const dayMap = bySubject.get(sid) ?? new Map<string, number>();

      const weekly: WeeklyPoint[] = days.map((d) => ({
        date: d,
        hours: toHours(dayMap.get(d) ?? 0),
      }));

      return { id: sid, title, weekly };
    });
  }, [subjects, sessions, days]);

  const totalAll = useMemo(
    () => subjectAnalytics.reduce((acc, sub) => acc + sumHours(sub.weekly), 0),
    [subjectAnalytics]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-600">Loading analytics…</p>
      </div>
    );
  }

  if (anyError) {
    const isAuthError = status === 401;
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-600">
          {isAuthError ? "Session expired. Please login again." : "Failed to load analytics."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="analytics" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar username={username} />

          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
                  Analytics
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Weekly study per subject (last 7 days, from 00:00 local time)
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] text-zinc-500">Total (all subjects)</p>
                <p className="text-lg font-semibold text-zinc-900">{totalAll.toFixed(1)}h</p>
              </div>
            </div>

            {!subjectAnalytics.length ? (
              <div className="mt-10 rounded-3xl border border-zinc-200 bg-white p-10 text-center">
                <p className="text-sm font-semibold text-zinc-900">No subjects yet</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Create a subject and log sessions to see analytics.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid grid-cols-12 gap-6">
                {subjectAnalytics.map((sub) => {
                  const total = sumHours(sub.weekly);
                  return (
                    <motion.section
                      key={sub.id}
                      initial={{ opacity: 0, y: 10, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="col-span-12 lg:col-span-6 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">{sub.title}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">Last 7 days</p>
                        </div>

                        <div className="rounded-2xl border border-zinc-200 bg-creamtext px-3 py-2">
                          <p className="text-[11px] text-zinc-500">Total</p>
                          <p className="text-sm font-semibold text-zinc-900">{total.toFixed(1)}h</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <WeeklyStudyChart data={sub.weekly} />
                      </div>
                    </motion.section>
                  );
                })}
              </div>
            )}

            <footer className="mt-10 text-center text-xs text-zinc-400">REVE analytics</footer>
          </div>
        </div>
      </div>
    </div>
  );
}
