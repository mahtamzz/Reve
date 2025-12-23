import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const CODE_LENGTH = 6;
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface LocationState {
  email?: string;
  role?: "admin" | "user";
}

type Strength = "empty" | "weak" | "medium" | "strong";

const ResetPassword: React.FC = () => {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<Strength>("empty");

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const location = useLocation() as { state: LocationState | null };
  const email = location.state?.email;
  const role = location.state?.role || "user";

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const endpoint = useMemo(() => {
    return role === "admin"
      ? "http://localhost:8080/api/auth/admin/reset-password"
      : "http://localhost:8080/api/auth/reset-password";
  }, [role]);

  const updateCode = (index: number, value: string) => {
    setCode((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const loginEndpoint = useMemo(() => {
    return role === "admin"
      ? "http://localhost:8080/api/auth/admin/login"
      : "http://localhost:8080/api/auth/login";
  }, [role]);
  
  async function ensureSessionOrThrow() {
    // داشبورد شما از /api/auth/me استفاده می‌کنه
    const meRes = await fetch("http://localhost:8080/api/auth/me", {
      method: "GET",
      credentials: "include",
    });
    if (!meRes.ok) throw new Error("SESSION_INVALID");
  }
  
  async function autoLoginOrThrow(emailValue: string, passwordValue: string) {
    const res = await fetch(loginEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: emailValue, password: passwordValue }),
    });
  
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as any)?.error || (data as any)?.message || "AUTO_LOGIN_FAILED");
    }
  }  

  const handleOtpChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value) {
      updateCode(index, "");
      return;
    }

    // اگر paste شد، فقط آخرین رقم
    updateCode(index, value.slice(-1));

    if (index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) inputsRef.current[index + 1]?.focus();
  };

  const evaluatePasswordStrength = (password: string): Strength => {
    if (!password) return "empty";

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return "weak";
    if (score === 2 || score === 3) return "medium";
    return "strong";
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordStrength(evaluatePasswordStrength(value));
  };

  const strengthConfig: Record<
    Strength,
    { label: string; barClass: string; colorClass: string }
  > = {
    empty: { label: "", barClass: "w-0", colorClass: "bg-transparent" },
    weak: { label: "Weak password", barClass: "w-1/3", colorClass: "bg-red-400" },
    medium: { label: "Medium strength", barClass: "w-2/3", colorClass: "bg-amber-400" },
    strong: { label: "Strong password", barClass: "w-full", colorClass: "bg-emerald-500" },
  };

  const { label, barClass, colorClass } = strengthConfig[passwordStrength];

  const goBack = () => {
    navigate("/forgot-password", { state: { role } });
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");
  
    const finalCode = code.join("");
  
    if (!email) {
      setError("No email found. Please go back and request a reset code again.");
      return;
    }
    if (finalCode.length !== CODE_LENGTH) {
      setError("Code must be 6 digits.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("Passwords do not match.");
      return;
    }
  
    try {
      setLoading(true);
  
      // 1) reset password
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          otp: finalCode,
          newPassword,
        }),
      });
  
      const data = await res.json().catch(() => ({}));
  
      if (!res.ok) {
        setError((data as any)?.error || (data as any)?.message || "Invalid code or password.");
        return;
      }
  
      setSuccess((data as any)?.message || "Password reset successfully.");
  
      try {
        await ensureSessionOrThrow();
      } catch {
        await autoLoginOrThrow(email, newPassword);
        await ensureSessionOrThrow();
      }
  
      navigate(role === "admin" ? "/dashboard-admin" : "/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
  
      setError("Password changed, but you are not logged in. Please login again.");
      navigate(role === "admin" ? "/admin/login" : "/login", { replace: true });
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
          min-h-[680px]
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
          <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-orange-400/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />

          <div className="relative">
            <p className="text-xs tracking-[0.35em] text-zinc-500 mb-2">REVE</p>
            <h1 className="text-2xl font-semibold text-zinc-900 leading-snug">
              Reset your password
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Enter the 6-digit code and choose a new secure password.
            </p>

            {email && (
              <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-2xl border border-yellow-200/70 bg-white/70 backdrop-blur px-3 py-2 shadow-sm">
                <span className="text-[11px] text-zinc-500">Email</span>
                <span className="text-[11px] font-semibold text-zinc-800 truncate">
                  {email}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Step indicator */}
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-yellow-200/70 bg-white/70 backdrop-blur px-3 py-2 shadow-sm">
                <span className="text-[11px] font-semibold text-zinc-700">
                  Step 2 of 2
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-[11px] text-zinc-500">Set password</span>
              </div>

              <button
                type="button"
                onClick={goBack}
                className="text-xs font-semibold text-amber-700 hover:underline"
              >
                Back
              </button>
            </div>

            <p className="mt-3 text-xs text-zinc-600 max-w-[260px]">
              Use at least 8 characters for stronger security.
            </p>
          </div>
        </section>

        {/* RIGHT */}
        <section className="col-span-12 md:col-span-7 p-6 sm:p-10 flex items-center">
          <div className="w-full max-w-md mx-auto">
            <div className="flex justify-center mb-6">
              <div
                className="
                  h-14 w-14 rounded-2xl
                  bg-amber-100
                  border border-amber-200
                  shadow-sm
                  flex items-center justify-center
                "
                aria-hidden
              >
                <svg
                  className="w-7 h-7 text-amber-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 17v-2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  <rect x="6" y="11" width="12" height="10" rx="2" />
                </svg>
              </div>
            </div>

            <h2 className="text-center text-2xl font-semibold text-zinc-900">
              Set a new password
            </h2>
            <p className="mt-2 text-sm text-zinc-600 text-center">
              Enter the code and your new password below.
            </p>

            {(error || success) && (
              <div className="mt-5 space-y-2">
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* OTP */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">
                  6-digit code
                </label>
                <div className="flex justify-center gap-3">
                  {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                    <input
                      key={index}
                      ref={(el: HTMLInputElement | null) => {
                        inputsRef.current[index] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={code[index]}
                      onChange={(e) => handleOtpChange(index, e)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="
                        w-12 h-14
                        rounded-xl
                        border border-zinc-200
                        bg-white
                        text-center text-xl font-semibold
                        shadow-sm
                        outline-none
                        transition
                        focus:ring-2 focus:ring-amber-400/70
                        focus:border-amber-400
                      "
                    />
                  ))}
                </div>
              </div>

              {/* New password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-zinc-700">
                    New password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-amber-700 hover:underline"
                    onClick={() => setShowNewPassword((p) => !p)}
                  >
                    {showNewPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={handleNewPasswordChange}
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
                  placeholder="••••••••"
                />

                <div className="mt-3">
                  <div className="h-2 rounded-full bg-zinc-200 overflow-hidden">
                    <div
                      className={`h-full ${barClass} ${colorClass} transition-all duration-300`}
                    />
                  </div>
                  {label && <p className="mt-2 text-xs text-zinc-600">{label}</p>}
                </div>
              </div>

              {/* Confirm */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-zinc-700">
                    Confirm password
                  </label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-amber-700 hover:underline"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
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
                  placeholder="••••••••"
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
                {loading ? "Resetting…" : "Reset password"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={goBack}
                  className="text-xs text-zinc-500 hover:text-zinc-800 transition"
                >
                  Back to forgot password
                </button>
              </div>
            </form>
          </div>
        </section>
      </motion.main>
    </div>
  );
};

export default React.memo(ResetPassword);
