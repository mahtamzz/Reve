import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const CODE_LENGTH = 6;
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Step = "request" | "verify";

const AdminOtpLoginPage: React.FC = () => {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // for subtle shake on error
  const [shake, setShake] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (step === "request") {
      emailRef.current?.focus();
    } else {
      inputsRef.current[0]?.focus();
    }
  }, [step]);

  // Email validation
  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  // ------------------ REQUEST OTP ------------------
  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetMessages();

    if (!email) {
      setError("Please enter your email.");
      setShake(true);
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email.");
      setShake(true);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "http://localhost:8080/api/auth/admin/login/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as any)?.message || "Could not send OTP.");
        setShake(true);
        return;
      }

      setSuccess((data as any)?.message || "OTP has been sent to admin email.");
      setCode(Array(CODE_LENGTH).fill(""));
      setStep("verify");
    } catch (err) {
      console.error(err);
      setError("Network error. Try again.");
      setShake(true);
    } finally {
      setLoading(false);
      window.setTimeout(() => setShake(false), 350);
    }
  };

  // ------------------ OTP Helpers ------------------
  const updateCode = (index: number, value: string) => {
    setCode((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleOtpChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value) {
      updateCode(index, "");
      return;
    }

    const digit = value.slice(-1);
    updateCode(index, digit);

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

    if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
    }
  };

  // Paste full OTP into first input (or any)
  const handleOtpPaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const raw = e.clipboardData.getData("text");
    const digits = raw.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    if (!digits) return;

    e.preventDefault();

    setCode((prev) => {
      const next = [...prev];
      for (let i = 0; i < CODE_LENGTH; i++) {
        const targetIndex = index + i;
        if (targetIndex >= CODE_LENGTH) break;
        next[targetIndex] = digits[i] ?? "";
      }
      return next;
    });

    const focusIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  const finalCode = useMemo(() => code.join(""), [code]);

  // ------------------ VERIFY OTP ------------------
  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetMessages();

    if (!email) {
      setError("Email is missing.");
      setShake(true);
      return;
    }
    if (finalCode.length !== CODE_LENGTH) {
      setError("Code must be 6 digits.");
      setShake(true);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "http://localhost:8080/api/auth/admin/login/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, otp: finalCode }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as any)?.error || (data as any)?.message || "Invalid or expired OTP.");
        setShake(true);

        // clear inputs and focus first
        setCode(Array(CODE_LENGTH).fill(""));
        window.setTimeout(() => inputsRef.current[0]?.focus(), 60);
        return;
      }

      const token = (data as any)?.token;
      if (!token) {
        setError("Server did not send token.");
        setShake(true);
        return;
      }

      localStorage.setItem("token", token);

      // Get admin info
      try {
        const meRes = await fetch("http://localhost:8080/api/auth/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (meRes.ok) {
          const meData = await meRes.json().catch(() => ({}));
          localStorage.setItem("admin", JSON.stringify(meData.user ?? meData));
        }
      } catch (err) {
        console.error(err);
      }

      navigate("/dashboard-admin");
    } catch (err) {
      console.error(err);
      setError("There is a problem. Try again.");
      setShake(true);
    } finally {
      setLoading(false);
      window.setTimeout(() => setShake(false), 350);
    }
  };

  return (
    <div className="min-h-screen bg-creamtext flex items-center justify-center px-4 py-10">
      <motion.main
        initial={{ opacity: 0, y: 12, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
        className="
          relative w-full max-w-5xl
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

        {/* LEFT / INFO */}
        <section
          className="
            col-span-12 md:col-span-5
            relative p-8 md:p-10
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
              Admin OTP Login
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Secure admin access using one-time verification code.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-yellow-200/70 bg-white/70 backdrop-blur px-3 py-2 shadow-sm">
              <span className="text-[11px] text-zinc-500">Mode</span>
              <span className="text-[11px] font-semibold text-zinc-800">
                {step === "request" ? "Request OTP" : "Verify OTP"}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="text-[11px] text-zinc-500">Admin</span>
            </div>

            {email && (
              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-2xl border border-yellow-200/70 bg-white/70 backdrop-blur px-3 py-2 shadow-sm">
                <span className="text-[11px] text-zinc-500">Email</span>
                <span className="text-[11px] font-semibold text-zinc-800 truncate">
                  {email}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1" />

          <div className="relative">
            <p className="text-xs text-zinc-600 max-w-[280px]">
              Tip: You can paste the whole 6-digit code into the first box.
            </p>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/admin/login")}
                className="text-xs font-semibold text-amber-700 hover:underline"
              >
                Back to password login
              </button>

              {step === "verify" && (
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setCode(Array(CODE_LENGTH).fill(""));
                    setStep("request");
                    window.setTimeout(() => emailRef.current?.focus(), 50);
                  }}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition"
                >
                  Change email
                </button>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT / FORM */}
        <section className="col-span-12 md:col-span-7 p-6 sm:p-10 flex items-center">
          <motion.div
            animate={shake ? { x: [0, -4, 4, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.28 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="flex justify-center mb-6">
              <div
                className="
                  h-14 w-14 rounded-2xl
                  bg-amber-100 border border-amber-200
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
              {step === "request" ? "Request OTP" : "Enter OTP"}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 text-center">
              {step === "request"
                ? "We’ll send a one-time code to your admin email."
                : "Enter the 6-digit code we sent to your email."}
            </p>

            <div className="mt-5 space-y-2">
              <AnimatePresence mode="popLayout">
                {error && (
                  <motion.div
                    key="err"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    key="ok"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* STEP 1 */}
            {step === "request" && (
              <form onSubmit={handleRequestOtp} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="adminEmail"
                    className="block text-sm font-semibold text-zinc-700 mb-2"
                  >
                    Admin email
                  </label>
                  <input
                    ref={emailRef}
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    autoComplete="email"
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
                    placeholder="admin@reve.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
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
                  {loading ? "Sending…" : "Send OTP"}
                </button>
              </form>
            )}

            {/* STEP 2 */}
            {step === "verify" && (
              <form onSubmit={handleVerifyOtp} className="mt-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">
                    6-digit code
                  </label>

                  <div className="flex justify-center gap-3">
                    {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputsRef.current[index] = el;
                        }}
                        id={`adminOtp-${index}`}
                        name={`adminOtp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        autoComplete="one-time-code"
                        value={code[index]}
                        onChange={(e) => handleOtpChange(index, e)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={(e) => handleOtpPaste(index, e)}
                        disabled={loading}
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

                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                    <span>Press Enter to verify</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCode(Array(CODE_LENGTH).fill(""));
                        window.setTimeout(() => inputsRef.current[0]?.focus(), 50);
                      }}
                      className="text-amber-700 font-semibold hover:underline"
                    >
                      Clear
                    </button>
                  </div>
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
                  {loading ? "Verifying…" : "Verify & Login"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setStep("request");
                    setCode(Array(CODE_LENGTH).fill(""));
                    window.setTimeout(() => emailRef.current?.focus(), 60);
                  }}
                  className="w-full text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition"
                >
                  Use a different email
                </button>
              </form>
            )}
          </motion.div>
        </section>
      </motion.main>
    </div>
  );
};

export default React.memo(AdminOtpLoginPage);
