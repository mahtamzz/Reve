import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

const CODE_LENGTH = 6;
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Step = "request" | "verify";

const OtpLoginPage: React.FC = () => {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [shake, setShake] = useState(false);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const emailRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (step === "request") emailRef.current?.focus();
    if (step === "verify") inputsRef.current[0]?.focus();
  }, [step]);

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const finalCode = useMemo(() => code.join(""), [code]);

  const resetMessages = () => {
    setError("");
    setSuccess("");
  };

  const triggerShake = () => {
    setShake(true);
    window.setTimeout(() => setShake(false), 350);
  };

  // ------------------ REQUEST OTP ------------------
  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetMessages();

    if (!email) {
      setError("Please enter your email.");
      triggerShake();
      return;
    }
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      triggerShake();
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/login/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as any)?.error || (data as any)?.message || "Could not send OTP.");
        triggerShake();
        return;
      }

      setSuccess((data as any)?.message || "An OTP has been sent to your email address.");
      setCode(Array(CODE_LENGTH).fill(""));
      setStep("verify");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  // ------------------ OTP INPUT ------------------
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

    if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
    }
  };

  // Paste full OTP in any box (fills from that index)
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

  // ------------------ RESEND OTP (optional) ------------------
  const handleResendOtp = async () => {
    resetMessages();

    if (!email) {
      setError("Email is missing.");
      triggerShake();
      return;
    }

    try {
      setResendLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/login/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as any)?.error || (data as any)?.message || "Could not resend OTP.");
        triggerShake();
        return;
      }

      setSuccess((data as any)?.message || "A new code has been sent.");
      setCode(Array(CODE_LENGTH).fill(""));
      window.setTimeout(() => inputsRef.current[0]?.focus(), 60);
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
      triggerShake();
    } finally {
      setResendLoading(false);
    }
  };

  // ------------------ VERIFY OTP ------------------
  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetMessages();

    if (!email) {
      setError("Email is missing.");
      triggerShake();
      return;
    }
    if (finalCode.length !== CODE_LENGTH) {
      setError("Code must be 6 digits.");
      triggerShake();
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp: finalCode }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError((data as any)?.error || (data as any)?.message || "Invalid or expired code.");
        triggerShake();
        setCode(Array(CODE_LENGTH).fill(""));
        window.setTimeout(() => inputsRef.current[0]?.focus(), 60);
        return;
      }

      // check session
      const meRes = await fetch("http://localhost:8080/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!meRes.ok) {
        setError("Session invalid. Please try again.");
        triggerShake();
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("There is a problem. Please try again.");
      triggerShake();
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
        {/* accents */}
        <div className="pointer-events-none absolute -top-28 -right-28 h-[420px] w-[420px] rounded-full bg-yellow-200/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[480px] w-[480px] rounded-full bg-orange-300/20 blur-3xl" />

        {/* LEFT */}
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
              Login with OTP
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Fast login via one-time code — no password required.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-yellow-200/70 bg-white/70 backdrop-blur px-3 py-2 shadow-sm">
              <span className="text-[11px] text-zinc-500">Step</span>
              <span className="text-[11px] font-semibold text-zinc-800">
                {step === "request" ? "Request OTP" : "Verify OTP"}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="text-[11px] text-zinc-500">User</span>
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
              Tip: You can paste the full 6-digit code into any box.
            </p>

            <div className="mt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-xs font-semibold text-amber-700 hover:underline"
              >
                Back to normal login
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

        {/* RIGHT */}
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
              {step === "request" ? "Request your OTP" : "Enter your OTP"}
            </h2>
            <p className="mt-2 text-sm text-zinc-600 text-center">
              {step === "request"
                ? "Enter your email to receive a one-time login code."
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

            {step === "request" && (
              <form onSubmit={handleRequestOtp} className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="otpEmail"
                    className="block text-sm font-semibold text-zinc-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    ref={emailRef}
                    id="otpEmail"
                    name="otpEmail"
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
                    placeholder="you@example.com"
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
                        id={`otp-${index}`}
                        name={`otp-${index}`}
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

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendLoading || loading}
                    className="text-xs font-semibold text-amber-700 hover:underline disabled:opacity-60"
                  >
                    {resendLoading ? "Resending…" : "Resend code"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      resetMessages();
                      setStep("request");
                      setCode(Array(CODE_LENGTH).fill(""));
                      window.setTimeout(() => emailRef.current?.focus(), 60);
                    }}
                    className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition"
                  >
                    Use a different email
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </section>
      </motion.main>
    </div>
  );
};

export default OtpLoginPage;
