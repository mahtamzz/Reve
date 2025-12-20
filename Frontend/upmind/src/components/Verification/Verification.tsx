import React from "react";
import { motion } from "framer-motion";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface VerificationViewProps {
  CODE_LENGTH: number;
  code: string[];
  inputsRef: React.MutableRefObject<(HTMLInputElement | null)[]>;
  minutes: string;
  seconds: string;
  isExpired: boolean;
  error?: string | unknown;
  success?: string;
  resendMessage?: string;
  loading: boolean;
  resendLoading: boolean;
  radius: number;
  circumference: number;
  strokeDashoffset: number;
  handleChange: (index: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  handleResend: () => void | Promise<void>;
  goback: (e: React.MouseEvent<HTMLButtonElement>) => void;
  email?: string | null;
}

const VerificationView: React.FC<VerificationViewProps> = ({
  CODE_LENGTH,
  code,
  inputsRef,
  minutes,
  seconds,
  isExpired,
  error,
  success,
  resendMessage,
  loading,
  resendLoading,
  radius,
  circumference,
  strokeDashoffset,
  handleChange,
  handleKeyDown,
  handleSubmit,
  handleResend,
  goback,
  email,
}) => {
  return (
    <div
      className="
        min-h-screen bg-creamtext
        flex items-center justify-center
        px-4 py-10
      "
    >
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
          min-h-[640px] md:min-h-[680px]
        "
      >
        {/* subtle global accents */}
        <div className="pointer-events-none absolute -top-28 -right-28 h-[420px] w-[420px] rounded-full bg-yellow-200/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-[480px] w-[480px] rounded-full bg-orange-300/20 blur-3xl" />

        {/* LEFT – visual / context */}
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
              Verify your email
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              One last step before entering your dashboard.
            </p>
          </div>

          {/* spacer to make left side taller + balanced */}
          <div className="flex-1" />

          {/* timer */}
          <div className="relative mt-10 flex items-center gap-4">
            <div className="relative h-20 w-20 shrink-0">
              <svg viewBox="0 0 100 100" className="-rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="rgba(251,191,36,0.25)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#f59e0b"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] text-zinc-500">time left</span>
                <span className="text-sm font-semibold text-amber-600 tabular-nums">
                  {minutes}:{seconds}
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <p className="text-xs text-zinc-700 font-semibold">
                Code expires automatically
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                If it expires, just resend a new one.
              </p>
              {isExpired && (
                <p className="mt-2 text-xs font-semibold text-orange-600">
                  Code expired — resend to continue.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* RIGHT – OTP form */}
        <section
          className="
            col-span-12 md:col-span-7
            relative
            p-6 sm:p-10
            flex
            items-center
          "
        >
          <div className="w-full max-w-md mx-auto">
            <p className="text-sm text-zinc-600 mb-6">
              We sent a 6-digit code to{" "}
              <span className="font-semibold text-zinc-900">
                {email || "your email"}
              </span>
            </p>

            {(error || success || resendMessage) && (
              <div className="mb-4 space-y-2">
                {error && (
                  <p className="text-red-600 text-sm text-center">
                    {typeof error === "string" ? error : JSON.stringify(error)}
                  </p>
                )}
                {success && (
                  <p className="text-emerald-600 text-sm text-center">
                    {success}
                  </p>
                )}
                {resendMessage && (
                  <p className="text-emerald-600 text-xs text-center">
                    {resendMessage}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="flex justify-center gap-3 mb-7">
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
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading || isExpired}
                    className="
                      w-12 h-14
                      rounded-2xl
                      border border-zinc-200
                      bg-white
                      text-center text-xl font-semibold tabular-nums
                      shadow-sm
                      focus:outline-none
                      focus:ring-2 focus:ring-amber-400/70
                      focus:border-amber-400
                      transition
                      disabled:opacity-70
                    "
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={loading || isExpired}
                className="
                  w-full
                  rounded-2xl
                  bg-amber-500 hover:bg-amber-600
                  text-white font-semibold
                  py-3
                  shadow-sm
                  transition
                  disabled:opacity-60
                "
              >
                {loading ? "Verifying…" : "Verify"}
              </button>
            </form>

            <div className="mt-7 flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || loading}
                className="text-amber-700 hover:underline disabled:text-zinc-400"
              >
                {resendLoading ? "Resending…" : "Resend code"}
              </button>

              <button
                type="button"
                onClick={goback}
                className="text-zinc-500 hover:text-zinc-800 transition"
              >
                Change email
              </button>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={goback}
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

export default React.memo(VerificationView);
