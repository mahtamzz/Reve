import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import FullBodyBuddy from "@/components/FullBodyBuddy";
import GoogleButton from "../GoogleButton/GoogleButton";
import { Link } from "react-router-dom";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => setMounted(true), []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();

      let data: unknown = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        if (!res.ok) {
          setError("Login failed (invalid server response).");
          return;
        }
      }

      if (!res.ok) {
        const d = data as any;
        setError(d?.error || d?.message || "Login failed");
        return;
      }

      const d = data as any;
      if (d?.token) localStorage.setItem("token", d.token);

      navigate("/dashboard-admin");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    navigate("/forgot-password", { state: { role: "admin" } });
  }

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-24 -right-28 h-[520px] w-[520px] rounded-full bg-yellow-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[620px] w-[620px] rounded-full bg-yellow-100/60 blur-3xl" />

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
          className="
            relative
            grid grid-cols-12
            rounded-[32px]
            border border-zinc-200
            bg-white
            shadow-2xl
            overflow-hidden
          "
        >
          {/* soft yellow accent */}
          <div className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-yellow-200/40 blur-3xl" />

          {/* LEFT – buddy */}
          <section className="col-span-12 md:col-span-5 flex items-center justify-center bg-gradient-to-b from-yellow-50 to-white">
            <FullBodyBuddy />
          </section>

          {/* RIGHT – admin login form (هم‌استایل LoginForm عادی) */}
          <section className="col-span-12 md:col-span-7 p-10 flex items-center">
            <div className="w-full max-w-[440px] mx-auto">
              <motion.div
                initial={false}
                animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
                transition={{ duration: 0.45, ease: EASE_OUT }}
                className="
                  relative w-full
                  overflow-hidden
                  rounded-3xl border border-yellow-200/70
                  bg-[#FFFBF2]
                  p-7 sm:p-8
                  shadow-sm
                "
              >
                {/* zard accents */}
                <div className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-yellow-200/45 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-yellow-100/70 blur-3xl" />

                <div className="relative">
                  <p className="text-xs font-semibold text-yellow-700/80">
                    Welcome back
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
                    Login
                  </h1>
                  <p className="mt-1 text-sm text-zinc-600">
                    Continue your routine and stay focused.
                  </p>

                  <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 mb-2">
                        Email
                      </label>
                      <input
                        className="
                          w-full rounded-2xl
                          border border-yellow-200/70 bg-white/70
                          px-4 py-3
                          text-sm text-zinc-800
                          placeholder:text-zinc-400
                          outline-none
                          focus:ring-2 focus:ring-yellow-300/70
                        "
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-semibold text-zinc-700">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors"
                        >
                          forgot password?
                        </button>
                      </div>

                      <input
                        type="password"
                        className="
                          w-full rounded-2xl
                          border border-yellow-200/70 bg-white/70
                          px-4 py-3
                          text-sm text-zinc-800
                          placeholder:text-zinc-400
                          outline-none
                          focus:ring-2 focus:ring-yellow-300/70
                        "
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        required
                      />
                    </div>

                    <div className="pt-1 space-y-2">
                      <p className="text-xs text-zinc-600">
                        Don’t have an account?{" "}
                        <Link
                          to="/"
                          className="font-semibold text-zinc-900 hover:text-yellow-800 transition-colors"
                        >
                          Sign up
                        </Link>
                      </p>

                      <p className="text-xs text-zinc-600">
                        <Link
                          to="/admin/login-otp"
                          className="font-semibold text-zinc-900 hover:text-yellow-800 transition-colors"
                        >
                          login with OTP
                        </Link>
                      </p>
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                        <p className="text-xs font-semibold text-red-700 text-center">
                          {error}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="
                        group relative w-full overflow-hidden
                        rounded-2xl
                        border border-yellow-300/70
                        bg-yellow-200/60
                        px-4 py-3
                        text-sm font-semibold text-zinc-900
                        shadow-sm
                        transition-all duration-300
                        hover:-translate-y-0.5 hover:shadow-md
                        hover:bg-yellow-200/80
                        disabled:opacity-60 disabled:hover:translate-y-0
                      "
                    >
                      <span className="pointer-events-none absolute inset-0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-700 ease-in-out bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.55),transparent)]" />
                      <span className="relative">
                        {loading ? "Please wait..." : "Login"}
                      </span>
                    </button>

                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-yellow-300/40" />
                      <span className="text-[11px] font-semibold text-zinc-600">
                        OR
                      </span>
                      <div className="flex-1 h-px bg-yellow-300/40" />
                    </div>

                    <div className="rounded-2xl border border-yellow-200/70 bg-white/55 p-3">
                      <GoogleButton text="Continue with Google" origin="login" />
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </section>
        </motion.div>
      </main>

      <footer className="pb-8 text-center text-xs text-zinc-400 relative z-10">
        REVE · Study dashboard
      </footer>
    </div>
  );
};

export default React.memo(AdminLoginPage);
