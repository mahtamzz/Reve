import React from "react";
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
  handleKeyDown: (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>
  ) => void | Promise<void>;
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
    <div className="min-h-screen bg-loginbg flex flex-col justify-center items-center px-4">
      <main className="w-full max-w-xl">
        <div className="bg-creamtext w-full rounded-md shadow px-8 md:px-16 py-10">
          {/* HEADER + CIRCULAR TIMER */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="relative w-24 h-24">
              <svg
                viewBox="0 0 100 100"
                className="w-24 h-24 transform -rotate-90"
              >
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="rgba(34,197,94,0.2)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="#22c55e"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500 mb-0.5">time left</span>
                <span className="text-sm font-semibold text-emerald-600">
                  {minutes}:{seconds}
                </span>
              </div>
            </div>

            <div className="text-center mt-2">
              <p className="text-[10px] tracking-[0.35em] text-chocolate/70 mb-1">
                REVE
              </p>
              <h1 className="tracking-wide text-base md:text-lg font-semibold text-chocolate">
                VERIFY YOUR EMAIL ADDRESS
              </h1>
            </div>
          </div>

          <hr className="mb-6 border-chocolate/10" />

          <div className="text-sm text-brand-text mb-6 space-y-1 text-center md:text-left">
            <p>
              A verification code has been sent to{" "}
              <span className="font-semibold">
                {email || "your-email@example.com"}
              </span>
            </p>
            <p>
              Please check your inbox and enter the verification code below to
              verify your email address. The code will expire in{" "}
              <span className="font-semibold">
                {minutes}:{seconds}
              </span>
              .
            </p>
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-2 text-center">
              {typeof error === "string" ? error : JSON.stringify(error)}
            </p>
          )}
          {success && (
            <p className="text-green-700 text-sm mb-2 text-center">
              {success}
            </p>
          )}
          {resendMessage && (
            <p className="text-emerald-600 text-xs mb-2 text-center">
              {resendMessage}
            </p>
          )}
          {isExpired && (
            <p className="text-red-500 text-xs mb-3 text-center">
              The code has expired. Please click "Resend code" to get a new one.
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex justify-center gap-2 md:gap-3 mb-6">
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
                className="w-10 h-12 md:w-12 md:h-14 border border-chocolate/30 rounded-md text-center text-lg md:text-xl tracking-widest bg-white
                          focus:outline-none focus:ring-2 focus:ring-niceblue focus:border-niceblue disabled:bg-gray-100"
              />
            ))}

            </div>

            <button
              type="submit"
              disabled={loading || isExpired}
              className="w-full bg-chocolate hover:bg-chocolate/90 text-creamtext font-medium py-2.5 rounded-md transition-colors disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Verify"}
            </button>
          </form>

          <div className="flex flex-col md:flex-row justify-center items-center gap-3 mt-5 text-sm">
            <button
              type="button"
              className="text-niceblue hover:underline disabled:text-gray-400"
              onClick={handleResend}
              disabled={resendLoading || loading}
            >
              {resendLoading ? "Resending..." : "Resend code"}
            </button>
            <span className="hidden md:inline text-gray-400">|</span>
            <button
              type="button"
              className="text-niceblue hover:underline"
              onClick={goback}
            >
              Change email
            </button>
          </div>

          <div className="mt-8 text-center text-sm">
            <button
              onClick={goback}
              type="button"
              className="text-niceblue hover:underline"
            >
              Back to previous page
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default React.memo(VerificationView);
