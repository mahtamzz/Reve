import { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const CODE_LENGTH = 6;

export default function ResetPassword() {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef([]);
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  const updateCode = (index, value) => {
    setCode((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (index, e) => {
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

  const handleKeyDown = (index, e) => {
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

  const handleSubmit = async (e) => {
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

      const res = await fetch("http://localhost:3000/api/users/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
    navigate("/forgot-password");
  };

  return (
    <div className="min-h-screen bg-loginbg flex flex-col justify-center items-center px-4 font-serif text-brand-text">
      <main className="w-full max-w-xl">
        <div className="bg-creamtext w-full rounded-md shadow px-8 md:px-16 py-10">
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
            <p>
              Enter the code and your new password below.
            </p>
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

          <form onSubmit={handleSubmit} className="space-y-5">
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
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-10 h-12 md:w-12 md:h-14 border border-chocolate/30 rounded-md text-center text-lg md:text-xl tracking-widest bg-white
                             focus:outline-none focus:ring-2 focus:ring-niceblue focus:border-niceblue"
                />
              ))}
            </div>

            {/* New password */}
            <div>
              <label className="block text-sm mb-2">New password</label>
              <input
                type="password"
                className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm mb-2">Confirm password</label>
              <input
                type="password"
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
            <button
              onClick={goBack}
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
