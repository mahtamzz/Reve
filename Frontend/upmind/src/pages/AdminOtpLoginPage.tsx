import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const CODE_LENGTH = 6;

const AdminOtpLoginPage: React.FC = () => {
  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState<string>("");
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (step === "verify") {
      inputsRef.current[0]?.focus();
    }
  }, [step]);

  // Email Validation
  const isValidEmail = (value: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  // ------------------ REQUEST OTP ------------------
  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) return setError("Please enter your email.");
    if (!isValidEmail(email)) return setError("Please enter a valid email.");

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/admin/login/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      console.log("ADMIN OTP REQUEST RESPONSE:", data);

      if (!res.ok) {
        setError(data.message || "Could not send OTP.");
        return;
      }

      setSuccess(data.message || "OTP has been sent to admin email.");
      setStep("verify");

    } catch (err) {
      console.error(err);
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------ OTP Input Logic ------------------
  const updateCode = (index: number, value: string) => {
    setCode((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleOtpChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value) return updateCode(index, "");

    const digit = value.slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    if (e.key === "ArrowLeft" && index > 0) inputsRef.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < CODE_LENGTH - 1)
      inputsRef.current[index + 1]?.focus();
  };

  // ------------------ VERIFY OTP ------------------
  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const finalCode = code.join("");

    if (!email) return setError("Email is missing.");
    if (finalCode.length !== CODE_LENGTH) return setError("Code must be 6 digits.");

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/admin/login/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp: finalCode }),
      });

      const data = await res.json();
      console.log("ADMIN OTP VERIFY RESPONSE:", data);

      if (!res.ok) {
        setError(data.error || "Invalid or expired OTP.");
        return;
      }

      const token = data.token;
      if (!token) {
        setError("Server did not send token.");
        return;
      }

      localStorage.setItem("token", token);

      // GET admin info
      try {
        const meRes = await fetch("http://localhost:8080/api/users/me", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!meRes.ok) {
          setError("Session invalid. Try again.");
          return;
        }

        const meData = await meRes.json();
        console.log("ADMIN ME RESPONSE:", meData);

        localStorage.setItem("admin", JSON.stringify(meData.user ?? meData));
      } catch (err) {
        console.error(err);
      }

      navigate("/dashboard-admin");

    } catch (err) {
      console.error(err);
      setError("There is a problem. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">

      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center px-10 pt-10 text-white">
        <div className="text-3xl tracking-widest text-creamtext">REVE Admin</div>
      </header>

      {/* Card */}
      <div className="mt-16 bg-creamtext text-brand-text rounded-xl px-10 py-10 w-full max-w-[460px] shadow">

        <h1 className="text-center text-2xl text-chocolate mb-4">Admin OTP Login</h1>

        {error && <p className="text-red-600 text-center mb-2">{error}</p>}
        {success && <p className="text-green-700 text-center mb-2">{success}</p>}

        {/* STEP 1: request OTP */}
        {step === "request" && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Admin Email</label>
              <input
                type="email"
                className="w-full bg-transparent border-b border-brand-text/50 pb-1 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-chocolate text-creamtext py-3 rounded-md disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {/* STEP 2: verify OTP */}
        {step === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <p className="text-sm text-chocolate/80">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </p>

            <div className="flex justify-center gap-2">
              {Array.from({ length: CODE_LENGTH }).map((_, index) => (
                <input
                  key={index}
                  ref={(el: HTMLInputElement | null) => {
                    inputsRef.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  value={code[index]}
                  onChange={(e) => handleOtpChange(index, e)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="w-10 h-12 border border-chocolate/30 rounded-md text-center text-xl"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-chocolate text-creamtext py-3 rounded-md disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify OTP & Login"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <button
            className="text-niceblue underline"
            onClick={() => navigate("/admin/login")}
          >
            Back to admin password login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminOtpLoginPage;
