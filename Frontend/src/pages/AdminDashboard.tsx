// src/pages/Dashboard.tsx  (Admin Dashboard)
// ساختار کلی حفظ شده، اما همه چیزهای user حذف شده و به admin وصل شده.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

import { ApiError } from "@/api/client";
import { authApi } from "@/api/auth";

// همون کامپوننت‌های فعلی داشبورد رو نگه می‌داریم (فقط رفتارها عوض می‌شه)
import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import LookAtBuddy from "@/components/LookAtBuddy";

// local helper for cx in this file
function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function getHttpStatus(err: unknown): number | undefined {
  return err instanceof ApiError ? err.status : (err as any)?.status;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function playSoftNotify() {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    if (!Ctx) return;

    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = "sine";
    o.frequency.value = 660;
    g.gain.value = 0.0001;

    o.connect(g);
    g.connect(ctx.destination);

    const now = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.05, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

    o.start(now);
    o.stop(now + 0.28);

    o.onended = () => ctx.close().catch(() => {});
  } catch {
    // ignore
  }
}

export default function Dashboard() {
  const navigate = useNavigate();

  // ----------------- Mobile Drawer -----------------
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (mobileSidebarOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileSidebarOpen]);

  // ----------------- Admin session -----------------
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<unknown>(null);

  // یک toast ساده نگه می‌داریم (فعلاً برای تست/پیام‌های admin)
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const toastDedupeRef = useRef<string>("");

  const logoutAdmin = () => {
    // اگر بعداً endpoint logout داشتی اینجا صدا بزن
    navigate("/admin/login?loggedOut=true");
  };

  // ✅ فقط adminMe
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await authApi.adminMe(); // GET /auth/admin/me
        if (!alive) return;

        setAdmin(res?.admin ?? null);

        // یک toast خوش‌آمد (اختیاری)
        const key = `welcome-${res?.admin?.id ?? res?.admin?.admin_id ?? "x"}`;
        if (toastDedupeRef.current !== key) {
          toastDedupeRef.current = key;
          setToast({
            title: "Admin session ready",
            message: "You are signed in as admin.",
          });
          playSoftNotify();
        }
      } catch (e) {
        if (!alive) return;
        setErr(e);

        const status = getHttpStatus(e);
        if (status === 401) {
          navigate("/admin/login?expired=true", { replace: true });
          return;
        }
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const anyLoading = loading;
  const anyError = !!err;

  const status = useMemo(() => getHttpStatus(err), [err]);

  if (anyLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <p className="text-zinc-600">Loading admin dashboard…</p>
      </div>
    );
  }

  if (anyError) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-zinc-900 font-semibold">Failed to load admin dashboard</p>
          <p className="mt-2 text-sm text-zinc-600">
            {status === 401 ? "Session expired. Please login again." : "Something went wrong."}
          </p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => navigate("/admin/login")}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:border-yellow-300 transition"
            >
              Go to admin login
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:border-yellow-300 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // admin display name
  const adminName: string =
    admin?.username ?? admin?.name ?? admin?.email ?? admin?.admin_id ?? "Admin";

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden md:block">
          <Sidebar activeKey="dashboard-admin" onLogout={logoutAdmin} />
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(true)}
          className={cx(
            "md:hidden fixed left-4 top-4 z-[90]",
            "inline-flex h-10 w-10 items-center justify-center",
            "rounded-2xl border border-zinc-200 bg-white shadow-sm",
            "active:scale-95 transition",
            mobileSidebarOpen ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-zinc-800" />
        </button>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                className="md:hidden fixed inset-0 z-[80] bg-black/40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
              />

              <motion.aside
                className="
                  md:hidden fixed left-0 top-0 z-[85] h-full
                  w-[280px] max-w-[85vw]
                  shadow-2xl
                "
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
              >
                <div className="relative h-full bg-white">
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(false)}
                    className="
                      absolute right-3 top-3 z-10
                      inline-flex h-9 w-9 items-center justify-center
                      rounded-2xl border border-zinc-200 bg-white shadow-sm
                      active:scale-95 transition
                    "
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5 text-zinc-800" />
                  </button>

                  <Sidebar
                    variant="drawer"
                    activeKey="dashboard-admin"
                    onLogout={() => {
                      setMobileSidebarOpen(false);
                      logoutAdmin();
                    }}
                    onNavigate={() => setMobileSidebarOpen(false)}
                  />
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar />

          <div className="mx-auto max-w-6xl px-4 py-6">
            {/* ---- Admin Hero ---- */}
            <div className="grid grid-cols-12 gap-6">
              <section className="col-span-12 lg:col-span-5">
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="pointer-events-none absolute -top-12 -right-14 h-48 w-48 rounded-full bg-yellow-200/45 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-yellow-100/60 blur-3xl" />

                  <div className="relative">
                    <p className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
                      Welcome, <span className="text-zinc-800">{adminName}</span>
                    </p>

                    <div className="mt-3 text-xs text-zinc-600">
                      Admin dashboard is connected. User widgets have been removed.
                    </div>

                    <div className="mt-5">
                      <LookAtBuddy label="Admin buddy" />
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        onClick={() => navigate("/admin/users")}
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm hover:border-yellow-300 transition"
                      >
                        Users (soon)
                      </button>
                      <button
                        onClick={logoutAdmin}
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm hover:border-yellow-300 transition"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* ---- Placeholder panel (keep structure) ---- */}
              <section className="col-span-12 lg:col-span-7">
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-200"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Admin Overview</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Placeholder — later you tell me what admin needs here.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-creamtext px-3 py-2">
                      <p className="text-[11px] text-zinc-500">Status</p>
                      <p className="text-sm font-semibold text-zinc-900">Connected</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4">
                    <p className="text-sm font-semibold text-zinc-900">Next steps</p>
                    <ul className="mt-2 text-xs text-zinc-600 list-disc pl-4 space-y-1">
                      <li>Define admin widgets (users list, audit logs, reports, ...)</li>
                      <li>Wire endpoints under /auth/admin/*</li>
                      <li>Add protected routes for admin only</li>
                    </ul>
                  </div>
                </motion.div>
              </section>
            </div>

            {/* ---- Keep 2-column grid structure but empty content ---- */}
            <div className="mt-6 grid grid-cols-12 gap-6">
              <section className="col-span-12 lg:col-span-6 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">Admin Panel</p>
                    <p className="mt-0.5 text-xs text-zinc-500">Placeholder</p>
                  </div>

                  <button
                    onClick={() =>
                      setToast({
                        title: "Not implemented",
                        message: "Tell me what admin should manage here.",
                      })
                    }
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:border-yellow-300 hover:text-zinc-900 transition"
                  >
                    Configure
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4 text-sm text-zinc-600">
                  User-related blocks removed. This area is reserved for admin features.
                </div>
              </section>

              <section className="col-span-12 lg:col-span-6 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900">Admin Alerts</p>
                  <span className="text-xs text-zinc-500">Placeholder</span>
                </div>

                <div className="mt-4 rounded-2xl bg-[#FFFBF2] border border-zinc-200 p-4">
                  <p className="text-sm font-semibold text-zinc-900">Tip</p>
                  <p className="text-xs text-zinc-600 mt-1">
                    When you define admin requirements, we’ll map each to an endpoint and a widget.
                  </p>
                </div>
              </section>
            </div>

            <footer className="mt-10 text-center text-xs text-zinc-400">
              REVE · admin dashboard
            </footer>
          </div>

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="fixed right-6 top-24 z-50 w-[320px] rounded-3xl border border-zinc-200 bg-white shadow-xl p-4"
              >
                <p className="text-sm font-semibold text-zinc-900">{toast.title}</p>
                <p className="mt-1 text-xs text-zinc-600">{toast.message}</p>

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
