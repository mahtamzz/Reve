// src/components/auth/ResetPasswordView.jsx

export default function ResetPasswordView({
  CODE_LENGTH,
  code,
  inputsRef,
  newPassword,
  confirm,
  error,
  success,
  loading,
  showNewPassword,
  showConfirmPassword,
  passwordLabel,
  passwordBarClass,
  passwordColorClass,
  email,
  onOtpChange,
  onOtpKeyDown,
  onNewPasswordChange,
  onConfirmChange,
  onToggleShowNewPassword,
  onToggleShowConfirmPassword,
  onSubmit,
  onGoBack,
}) {
  return (
    <div className="min-h-screen bg-loginbg flex flex-col justify-center items-center px-4 font-serif text-brand-text">
      <main className="w-full max-w-xl">
        <div className="bg-creamtext w-full rounded-md shadow px-8 md:px-16 py-10">
          {/* Step indicator */}
          <div className="flex justify-between items-center mb-3 text-xs text-gray-500">
            <span>Step 2 of 2</span>
            <span
              className="text-niceblue cursor-pointer"
              onClick={onGoBack}
            >
              Back to previous step
            </span>
          </div>

          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-loginbg flex items-center justify-center shadow-md border border-creamtext/40">
              <svg
                className="w-6 h-6 text-creamtext"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
                <polyline points="3,7 12,13 21,7" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-[10px] tracking-[0.35em] text-chocolate/70 mb-1">
                REVE
              </p>
              <h1 className="tracking-wide text-base md:text-lg font-semibold text-chocolate">
                RESET YOUR PASSWORD
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Enter the code we sent and choose a new secure password.
              </p>
            </div>
          </div>

          <hr className="mb-6 border-chocolate/10" />

          <div className="text-sm text-brand-text mb-6 space-y-1 text-center md:text-left">
            <p>
              A reset code has been sent to{" "}
              <span className="font-semibold">
                {email || "your-email@example.com"}
              </span>
            </p>
            <p>Enter the code and your new password below.</p>
          </div>

          {error && (
            <p className="text-red-600 text-sm mb-3 text-center">
              {typeof error === "string" ? error : JSON.stringify(error)}
            </p>
          )}
          {success && (
            <p className="text-green-700 text-sm mb-3 text-center">
              {success}
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            {/* OTP inputs */}
            <div className="flex justify-center gap-2 md:gap-3 mb-4">
              {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                <input
                  key={index}
                  ref={(el) => (inputsRef.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={code[index]}
                  onChange={(e) => onOtpChange(index, e)}
                  onKeyDown={(e) => onOtpKeyDown(index, e)}
                  className="w-10 h-12 md:w-12 md:h-14 border border-chocolate/30 rounded-md text-center text-lg md:text-xl tracking-widest bg-white
                             focus:outline-none focus:ring-2 focus:ring-niceblue focus:border-niceblue"
                />
              ))}
            </div>

            {/* New password */}
            <div>
              <div className="flex justify_between items-center mb-2">
                <label className="block text-sm">New password</label>
                <button
                  type="button"
                  className="text-xs text-niceblue hover:underline"
                  onClick={onToggleShowNewPassword}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showNewPassword ? "text" : "password"}
                className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
                value={newPassword}
                onChange={onNewPasswordChange}
                required
              />
              {/* Password strength */}
              <div className="mt-2">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordBarClass} ${passwordColorClass} transition-all duration-300`}
                  />
                </div>
                {passwordLabel && (
                  <p className="mt-1 text-xs text-gray-600">{passwordLabel}</p>
                )}
                <p className="mt-1 text-[11px] text-gray-500">
                  Use at least 8 characters, including uppercase, numbers and
                  symbols for a stronger password.
                </p>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm">Confirm password</label>
                <button
                  type="button"
                  className="text-xs text-niceblue hover:underline"
                  onClick={onToggleShowConfirmPassword}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
                value={confirm}
                onChange={onConfirmChange}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-chocolate hover:bg-chocolate/90 text-creamtext font-medium py-2.5 rounded-md transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? "Please wait..." : "Reset password"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <button
              onClick={onGoBack}
              className="text-niceblue hover:underline"
              type="button"
            >
              Back to forgot password
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
