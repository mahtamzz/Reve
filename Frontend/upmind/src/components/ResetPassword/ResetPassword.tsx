import React, { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const CODE_LENGTH = 6;

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

  const updateCode = (index: number, value: string) => {
    setCode((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const finalCode = code.join("");

    if (!email) {
      setError("no email found for reset");
      return;
    }

    if (finalCode.length !== CODE_LENGTH) {
      setError("code must be 6 digits");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError("password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirm) {
      setError("passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const endpoint =
        role === "admin"
          ? "http://localhost:8080/api/auth/admin/reset-password"
          : "http://localhost:8080/api/auth/reset-password";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp: finalCode,
          newPassword,
        }),
      });

      const data = await res.json();
      console.log("RESET PASSWORD RESPONSE:", data);

      if (!res.ok) {
        setError(data.error || "invalid code or password");
        return;
      }

      setSuccess(data.message || "Password reset successfully.");

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (err) {
      console.error(err);
      setError("there is a problem");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate("/forgot-password", { state: { role } });
  };

  const strengthConfig = {
    empty: { label: "", bar: "w-0", color: "bg-transparent" },
    weak: { label: "Weak password", bar: "w-1/3", color: "bg-red-400" },
    medium: { label: "Medium strength", bar: "w-2/3", color: "bg-amber-400" },
    strong: { label: "Strong password", bar: "w-full", color: "bg-emerald-500" },
  };

  const { label, bar, color } = strengthConfig[passwordStrength];

  return (
    <div className="min-h-screen bg-loginbg flex flex-col justify-center items-center px-4 font-serif text-brand-text">
      <main className="w-full max-w-xl">
        <div className="bg-creamtext w-full rounded-md shadow px-8 md:px-16 py-10">
          {/* Step indicator */}
          <div className="flex justify-between items-center mb-3 text-xs text-gray-500">
            <span>Step 2 of 2</span>
            <span className="text-niceblue cursor-pointer" onClick={goBack}>
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

          {error && (
            <p className="text-red-600 text-sm mb-3 text-center">
              {error}
            </p>
          )}
          {success && (
            <p className="text-green-700 text-sm mb-3 text-center">{success}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* OTP inputs */}
            <div className="flex justify-center gap-2 md:gap-3 mb-4">
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
                  className="w-10 h-12 md:w-12 md:h-14 border border-chocolate/30 rounded-md text-center text-lg md:text-xl tracking-widest bg-white
                             focus:outline-none focus:ring-2 focus:ring-niceblue focus:border-niceblue"
                />
              ))}
            </div>

            {/* New password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm">New password</label>
                <button
                  type="button"
                  className="text-xs text-niceblue hover:underline"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? "Hide" : "Show"}
                </button>
              </div>

              <input
                type={showNewPassword ? "text" : "password"}
                className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
                value={newPassword}
                onChange={handleNewPasswordChange}
                required
              />

              <div className="mt-2">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${bar} ${color} transition-all duration-300`}
                  />
                </div>
                {label && <p className="mt-1 text-xs text-gray-600">{label}</p>}
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm">Confirm password</label>
                <button
                  type="button"
                  className="text-xs text-niceblue hover:underline"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
            <button onClick={goBack} className="text-niceblue hover:underline">
              Back to forgot password
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default React.memo(ResetPassword);
