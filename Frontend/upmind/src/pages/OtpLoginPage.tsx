import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const CODE_LENGTH = 6;

const OtpLoginPage: React.FC = () => {
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

  // -------------- Email validation --------------
  const isValidEmail = (value: string): boolean => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(value);
  };

  // -------------- Request OTP (مرحله اول) --------------
  const handleRequestOtp = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "http://localhost:8080/api/auth/login/send-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();
      console.log("LOGIN OTP REQUEST RESPONSE:", data);

      if (!res.ok) {
        setError(data.error || data.message || "Could not send OTP.");
        return;
      }

      setSuccess(
        data.message || "An OTP has been sent to your email address."
      );
      setStep("verify");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // -------------- OTP input handlers --------------
  const updateCode = (index: number, value: string) => {
    setCode((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleOtpChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value.replace(/[^0-9]/g, "");

    if (!value) {
      updateCode(index, "");
      return;
    }

    const digit = value.slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
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

  // -------------- Verify OTP (مرحله دوم) --------------
  const handleVerifyOtp = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const finalCode = code.join("");

    if (!email) {
      setError("Email is missing.");
      return;
    }

    if (finalCode.length !== CODE_LENGTH) {
      setError("Code must be 6 digits.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "http://localhost:8080/api/auth/login/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, otp: finalCode }),
        }
      );

      const data = await res.json();
      console.log("LOGIN OTP VERIFY RESPONSE:", data);

      if (!res.ok) {
        setError(data.error || data.message || "Invalid or expired code.");
        return;
      }

      // اگر accessToken هم برمی‌گرده و بعداً خواستی تو Context نگه‌داری، اینجا بگیرش
      // const accessToken = data.accessToken;

      try {
        console.log("OTP verified, checking session via /users/me");

        const meRes = await fetch("http://localhost:8080/api/users/me", {
          method: "GET",
          credentials: "include",
        });

        if (!meRes.ok) {
          setError("Session invalid. Please try again.");
          return;
        }

        const meData = await meRes.json();
        console.log("ME RESPONSE:", meData);

        // اگر خواستی user رو نگه داری (اختیاری)
        // localStorage.setItem("user", JSON.stringify(meData.user ?? meData));

        navigate("/dashboard");
      } catch (err) {
        console.error(err);
        setError("Could not verify session. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("There is a problem. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center px-10 pt-10 text-white">
        <div className="text-3xl tracking-widest text-creamtext">REVE</div>

        <nav className="flex gap-12 text-lg">
          <NavLink
            to="/about"
            className="cursor-pointer hover:opacity-80 text-creamtext transition-colors"
          >
            About
          </NavLink>
          <NavLink
            to="/services"
            className="cursor-pointer hover:opacity-80 text-creamtext transition-colors"
          >
            Services
          </NavLink>
          <NavLink
            to="/contact"
            className="cursor-pointer hover:opacity-80 text-creamtext transition-colors"
          >
            Contact us
          </NavLink>
        </nav>
      </header>

      {/* Card */}
      <div className="mt-16 bg-creamtext text-brand-text rounded-xl px-8 sm:px-10 py-10 w-full max-w-[460px] shadow">
        <h1 className="text-center text-2xl sm:text-3xl text-chocolate mb-4">
          Login with OTP
        </h1>
        <p className="text-center text-sm text-chocolate/70 mb-6">
          Enter your email and we will send you a one-time code to log in.
        </p>

        {error && (
          <p className="text-red-600 text-sm mb-3 text-center">{error}</p>
        )}
        {success && (
          <p className="text-green-700 text-sm mb-3 text-center">{success}</p>
        )}

        {step === "request" && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-chocolate text-creamtext py-3 rounded-md mt-2 disabled:opacity-60 hover:bg-chocolate/90 transition-colors"
            >
              {loading ? "Please wait..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <p className="text-sm text-chocolate/80">
              We have sent a 6-digit code to{" "}
              <span className="font-semibold">{email}</span>.  
              Enter it below to complete your login.
            </p>

            <div className="flex justify-center gap-2 md:gap-3 mb-2">
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
                  className="w-10 h-12 md:w-12 md:h-14 border border-chocolate/30 rounded-md text-center text-lg md:text-xl tracking-widest bg-white
                           focus:outline-none focus:ring-2 focus:ring-niceblue focus:border-niceblue"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-chocolate text-creamtext py-3 rounded-md mt-2 disabled:opacity-60 hover:bg-chocolate/90 transition-colors"
            >
              {loading ? "Please wait..." : "Verify & Login"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <span className="text-chocolate/70">Want to use password instead? </span>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="text-niceblue underline"
          >
            Back to normal login
          </button>
        </div>
      </div>
    </div>
  );
};

export default OtpLoginPage;
