import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import FullBodyBuddy from "@/components/FullBodyBuddy";
import AdminLoginForm from "@/components/Login page/Loginadmin";
import { useAdminLogin } from "@/hooks/useAdminLogin";
import { ApiError } from "@/api/client";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);

  const navigate = useNavigate();
  const loginMut = useAdminLogin();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const loggedOut = searchParams.get("loggedOut") === "true";
    if (!loggedOut) return;

    setShowLogoutMessage(true);
    const timer = window.setTimeout(() => setShowLogoutMessage(false), 2500);

    const sp = new URLSearchParams(searchParams);
    sp.delete("loggedOut");
    setSearchParams(sp, { replace: true });

    return () => window.clearTimeout(timer);
  }, [searchParams, setSearchParams]);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      await loginMut.mutateAsync({ email, password });
      navigate("/dashboard-admin");
    } catch (err) {
      const e2 = ApiError.from(err);
      setError(e2.message || "Login failed");
    }
  }

  function handleForgotPassword() {
    navigate("/forgot-password", { state: { role: "admin" } });
  }

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-28 h-[520px] w-[520px] rounded-full bg-yellow-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[620px] w-[620px] rounded-full bg-yellow-100/60 blur-3xl" />

      <AnimatePresence>
        {showLogoutMessage && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            className="fixed right-5 top-5 z-50 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-lg"
          >
            <p className="text-sm font-semibold text-emerald-700">
              You logged out successfully
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mx-auto max-w-6xl px-4 pt-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="flex items-center justify-between"
        >
          <div className="text-[18px] font-semibold tracking-[0.12em] text-zinc-900">
            REVE
            <div className="mt-1 h-[2px] w-12 rounded-full bg-yellow-400" />
          </div>
        </motion.div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="relative grid grid-cols-12 rounded-[32px] border border-zinc-200 bg-white shadow-2xl overflow-hidden"
        >
          <div className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-yellow-200/40 blur-3xl" />

          <section className="hidden md:flex md:col-span-5 items-center justify-center bg-gradient-to-b from-yellow-50 to-white">
            <FullBodyBuddy />
          </section>

          <section className="col-span-12 md:col-span-7 p-10 flex items-center">
            <div className="w-full max-w-[440px] mx-auto">
              <AdminLoginForm
                mounted={mounted}
                email={email}
                password={password}
                error={error}
                loading={loginMut.isPending}
                onChangeEmail={(e) => setEmail(e.target.value)}
                onChangePassword={(e) => setPassword(e.target.value)}
                onSubmit={handleLogin}
                onForgotPassword={handleForgotPassword}
              />
            </div>
          </section>
        </motion.div>
      </main>

      <footer className="pb-8 text-center text-xs text-zinc-400 relative z-10">
        REVE · Admin dashboard
      </footer>
    </div>
  );
};

export default AdminLoginPage;
