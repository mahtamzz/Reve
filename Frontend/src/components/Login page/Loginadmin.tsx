import React from "react";
import { motion } from "framer-motion";
import GoogleButton from "../GoogleButton/GoogleButton";

interface AdminLoginFormProps {
  mounted: boolean;
  email: string;
  password: string;
  error?: string;
  loading: boolean;
  onChangeEmail: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangePassword: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onForgotPassword: () => void;
}

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const AdminLoginForm: React.FC<AdminLoginFormProps> = ({
  mounted,
  email,
  password,
  error,
  loading,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  onForgotPassword,
}) => {
  return (
    <motion.div
      initial={false}
      animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="
        relative w-full max-w-[460px]
        overflow-hidden
        rounded-3xl border border-yellow-200/70
        bg-[#FFFBF2]
        p-7 sm:p-8
        shadow-sm
      "
    >
      <div className="pointer-events-none absolute -top-16 -right-16 h-52 w-52 rounded-full bg-yellow-200/45 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-yellow-100/70 blur-3xl" />

      <div className="relative">
        <p className="text-xs font-semibold text-yellow-700/80">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
          Login
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Continue to admin dashboard.
        </p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
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
              onChange={onChangeEmail}
              placeholder="admin@example.com"
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
                onClick={onForgotPassword}
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
              onChange={onChangePassword}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
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
            <span className="text-[11px] font-semibold text-zinc-600">OR</span>
            <div className="flex-1 h-px bg-yellow-300/40" />
          </div>

          <div className="rounded-2xl border border-yellow-200/70 bg-white/55 p-3">
            <GoogleButton text="Continue with Google" origin="login" />
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default React.memo(AdminLoginForm);
