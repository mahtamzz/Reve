// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { logout } from "@/utils/authToken";

import { StatCard } from "@/components/Dashboard/StatCard";
import { ChallengeCard } from "@/components/Dashboard/ChallengeCard";
import { LineChart } from "@/components/Dashboard/LineChart";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";

interface User {
  id: number;
  username: string;
  email: string;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const fetchedRef = useRef(false);

  const weekly = useMemo(
    () => [
      { d: "Mon", h: 2 },
      { d: "Tue", h: 4 },
      { d: "Wed", h: 3 },
      { d: "Thu", h: 6 },
      { d: "Fri", h: 5 },
      { d: "Sat", h: 9 },
      { d: "Sun", h: 4 },
    ],
    []
  );

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchMe = async () => {
      try {
        const res = await fetchWithAuth("http://localhost:8080/api/users/me");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-600">Loading dashboard…</p>
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
    <div className="min-h-screen bg-[#F7F8FA] text-zinc-900">
      <div className="flex">
        {/* REAL sidebar like the template */}
        <Sidebar activeKey="dashboard" onLogout={logout} />

        <div className="flex-1 min-w-0">
          {/* REAL topbar like the template */}
          <Topbar username={user.username} />

          {/* Page content */}
          <div className="mx-auto max-w-6xl px-4 py-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Left */}
              <section className="col-span-12 lg:col-span-5 rounded-xl bg-white p-6 shadow-sm border border-zinc-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">
                      Welcome back, {user.username}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Manage your study activity and progress.
                    </p>
                  </div>
                  <button
                    onClick={logout}
                    className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    Sign out
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <StatCard title="Streak" value="20" accent="orange" />
                  <StatCard title="Score" value="1043" accent="blue" />
                </div>

                <div className="mt-5 rounded-xl bg-zinc-50 p-4 border border-zinc-200">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-900">StudyBuddy</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Find people to study with.
                      </p>
                      <p className="text-xs text-zinc-400 mt-2">
                        Signed in as: {user.email}
                      </p>
                    </div>

                    <div className="h-12 w-12 rounded-full bg-zinc-200 flex items-center justify-center">
                      <span className="text-sm">🙂</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Right */}
              <section className="col-span-12 lg:col-span-7 rounded-xl bg-white p-6 shadow-sm border border-zinc-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900">
                    Weekly Study
                  </p>
                  <span className="text-xs text-zinc-500">Last 7 days</span>
                </div>

                <div className="mt-4">
                  <LineChart data={weekly} />
                </div>
              </section>
            </div>

            <div className="mt-6 grid grid-cols-12 gap-6">
              <section className="col-span-12 lg:col-span-6 rounded-xl bg-white p-6 shadow-sm border border-zinc-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900">Subjects</p>
                  <button className="text-xs rounded-lg bg-zinc-100 px-3 py-1 hover:bg-zinc-200">
                    Manage
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {["Math", "Physics", "English", "Biology"].map((s) => (
                    <div
                      key={s}
                      className="rounded-xl bg-zinc-50 border border-zinc-200 p-3"
                    >
                      <p className="text-sm font-semibold text-zinc-900">{s}</p>
                      <p className="text-xs text-zinc-500 mt-1">Next: 25 min</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="col-span-12 lg:col-span-6 rounded-xl bg-white p-6 shadow-sm border border-zinc-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900">
                    Challenges
                  </p>
                  <span className="text-xs text-zinc-500">This week</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <ChallengeCard title="Challenge 1" percent={55} />
                  <ChallengeCard title="Challenge 2" percent={92} />
                </div>

                <div className="mt-4 rounded-xl bg-zinc-50 border border-zinc-200 p-4">
                  <p className="text-sm font-semibold text-zinc-900">Tip</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Stay consistent: 20–30 minutes per day beats cramming.
                  </p>
                </div>
              </section>
            </div>

            <footer className="mt-10 text-center text-xs text-zinc-400">
              REVE dashboard · React + Tailwind + Vite
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
