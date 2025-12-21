// src/pages/Analytics.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";

import { WeeklyStudyChart } from "@/components/Dashboard/LineChart";
import type { WeeklyPoint } from "@/components/Dashboard/LineChart";

import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { logout } from "@/utils/authToken";

interface User {
  id: number;
  username: string;
  email: string;
}

type SubjectAnalytics = {
  id: string;
  title: string;
  weekly: WeeklyPoint[];
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
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

// داده نمونه (فعلاً) — بعداً از API بگیر
function makeMockSubjects(): SubjectAnalytics[] {
  const days = lastNDays(7);

  const mk = (title: string, arr: number[]) => ({
    id: title.toLowerCase(),
    title,
    weekly: days.map((date, i) => ({ date, hours: arr[i] ?? 0 })),
  });

  return [
    mk("Math", [1, 2, 1.5, 3, 2, 4, 2.5]),
    mk("Physics", [0.5, 1, 0, 2, 1.5, 1, 2]),
    mk("English", [1, 1, 1, 1.5, 2, 2.5, 1]),
    mk("Biology", [0, 0.5, 1, 1, 1, 1.5, 2]),
  ];
}

function sumHours(weekly: WeeklyPoint[]) {
  return weekly.reduce((s, x) => s + x.hours, 0);
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const fetchedRef = useRef(false);

  // اینجا دیتاهای درس‌ها
  const [subjects, setSubjects] = useState<SubjectAnalytics[]>(() => makeMockSubjects());

  // می‌تونی مجموع کل همه درس‌ها رو هم نشون بدی
  const totalAll = useMemo(
    () => subjects.reduce((s, sub) => s + sumHours(sub.weekly), 0),
    [subjects]
  );

  // ====== Fetch user (مثل Dashboard) ======
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchMe = async () => {
      try {
        const res = await fetchWithAuth("http://localhost:8080/api/auth/me");
        if (!res.ok) {
          await logout();
          return;
        }
        const data = await res.json();
        setUser(data.user ?? data);
      } catch {
        await logout();
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  // اگر بعداً خواستی از API درس‌ها رو بگیری، اینجا بزن
  // useEffect(() => {
  //   const fetchSubjects = async () => {
  //     const res = await fetchWithAuth("http://localhost:8080/api/subjects/analytics");
  //     const data = await res.json();
  //     setSubjects(data.subjects);
  //   };
  //   fetchSubjects();
  // }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-600">Loading analytics…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-600">Session expired. Please login again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="analytics" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar username={user.username} />

          <div className="mx-auto max-w-6xl px-4 py-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
                  Analytics
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Weekly study per subject (last 7 days)
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[11px] text-zinc-500">Total (all subjects)</p>
                <p className="text-lg font-semibold text-zinc-900">{totalAll.toFixed(1)}h</p>
              </div>
            </div>

            {/* Subjects grid */}
            <div className="mt-6 grid grid-cols-12 gap-6">
              {subjects.map((sub) => {
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
                        <p className="text-sm font-semibold text-zinc-900">
                          {total.toFixed(1)}h
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <WeeklyStudyChart data={sub.weekly} />
                    </div>
                  </motion.section>
                );
              })}
            </div>

            <footer className="mt-10 text-center text-xs text-zinc-400">
              REVE analytics
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
