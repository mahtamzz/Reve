import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

interface LocationState {
  role?: "admin" | "user";
}

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

function validateEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation() as { state: LocationState | null };
  const role = location.state?.role || "user";

  const endpoint = useMemo(() => {
    return role === "admin"
      ? "http://localhost:8080/api/auth/admin/forgot-password"
      : "http://localhost:8080/api/auth/forgot-password";
  }, [role]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as any)?.message || "Something went wrong");
        return;
      }

      setMessage(
        (data as any)?.message ||
          "If this email exists, a reset code has been sent to your inbox."
      );

      window.setTimeout(() => {
        navigate("/reset-password", { state: { email, role } });
      }, 650);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-creamtext flex items-center justify-center px-4 py-10">
      <motion.main
        initial={{ opacity: 0, y: 12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
        className="
          relative w-full max-w-4xl
          grid grid-cols-12
          overflow-hidden
          rounded-[36px]
          border border-yellow-200/70
          bg-gradient-to-b from-yellow-50/70 to-white
          shadow-[0_30px_90px_-60px_rgba(0,0,0,0.45)]
          min-h-[620px] md:min-h-[680px]
        "
      >
        {/* global accents */}
        <div className="pointer-events-none absolute -top-28 -right-28 h-[420px] w-[420px] rounded-full bg-yellow-200/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[480px] w-[480px] rounded-full bg-orange-300/20 blur-3xl" />

        {/* LEFT */}
        <section
          className="
            col-span-12 md:col-span-5
            relative
            p-8 md:p-10
            flex flex-col
            bg-gradient-to-br from-yellow-50 via-orange-50 to-white
            border-b md:border-b-0 md:border-r border-yellow-200/60
          "
        >
          {/* accents */}
          <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-orange-400/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />

          <div className="relative">
            <p className="text-xs tracking-[0.35em] text-zinc-500 mb-2">
              REVE
            </p>

            <h1 className="text-2xl font-semibold text-zinc-900 leading-snug">
              Reset your password
            </h1>

            <p className="mt-2 text-sm text-zinc-600">
              Enter your email and we’ll send you a reset code.
            </p>
          </div>

          <div className="flex-1" />

          {/* step indicator */}
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-yellow-200/70 bg-white/70 backdrop-blur px-3 py-2 shadow-sm">
              <span className="text-[11px] font-semibold text-zinc-700">
                Step 1 of 2
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="text-[11px] text-zinc-500">Send code</span>
            </div>

            <p className="mt-3 text-xs text-zinc-600 max-w-[260px]">
              Tip: check spam/junk if you don’t see the email.
            </p>
          </div>
        </section>

        {/* RIGHT */}
        <section className="col-span-12 md:col-span-7 p-6 sm:p-10 flex items-center">
          <div className="w-full max-w-md mx-auto">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div
                className="
                  h-14 w-14 rounded-2xl
                  bg-amber-100
                  border border-amber-200
                  shadow-sm
                  flex items-center justify-center
                "
              >
                <svg
                  className="w-7 h-7 text-amber-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
                  <polyline points="3,7 12,13 21,7" />
                </svg>
              </div>
            </div>

            <h2 className="text-center text-2xl font-semibold text-zinc-900">
              Forgot password?
            </h2>
            <p className="mt-2 text-sm text-zinc-600 text-center">
              We’ll send a verification code to your email.
            </p>

            {/* alerts */}
            {(error || message) && (
              <div className="mt-5 space-y-2">
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {message}
                  </div>
                )}
              </div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">
                  Email address
                </label>

                <input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEmail(e.target.value)
                  }
                  required
                  className="
                    w-full
                    rounded-2xl
                    border border-zinc-200
                    bg-white
                    px-4 py-3
                    text-sm text-zinc-800
                    shadow-sm
                    outline-none
                    transition
                    focus:ring-2 focus:ring-amber-400/70
                    focus:border-amber-400
                  "
                  placeholder="name@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  rounded-2xl
                  bg-amber-500 hover:bg-amber-600
                  text-white font-semibold
                  py-3
                  shadow-sm
                  transition
                  disabled:opacity-60
                  flex items-center justify-center gap-2
                "
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {loading ? "Sending…" : "Send reset code"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-600">
              Remembered your password?{" "}
              <Link
                to={role === "admin" ? "/admin/login" : "/login"}
                className="font-semibold text-amber-700 hover:underline"
              >
                Back to login
              </Link>
            </div>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(-1);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-600 transition"
              >
                Back to previous page
              </button>
            </div>
          </div>
        </section>
      </motion.main>
    </div>
  );
};

export default React.memo(ForgotPassword);
