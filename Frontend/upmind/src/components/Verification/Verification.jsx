import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const CODE_LENGTH = 6;
const OTP_DURATION = 10 * 60; // 10 minutes in seconds

export default function Verification() {
  const [code, setCode] = useState(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [timeLeft, setTimeLeft] = useState(() => {
    // سعی کن از localStorage بخونی
    const storedExpiry = localStorage.getItem("otpExpiry");

    if (storedExpiry) {
      const expiry = parseInt(storedExpiry, 10);
      const diff = Math.floor((expiry - Date.now()) / 1000); // ثانیه

      // اگر هنوز زمان مونده
      if (diff > 0) return diff;

      // اگر منقضی شده
      return 0;
    }

    // اگر چیزی تو localStorage نبود، یعنی اولین باره این صفحه رو باز کرده
    const expiry = Date.now() + OTP_DURATION * 1000;
    localStorage.setItem("otpExpiry", String(expiry));
    return OTP_DURATION;
  });
  

  // ------------------ TIMER LOGIC ------------------
  useEffect(() => {
    if (timeLeft <= 0) return;
  
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
  
    return () => clearInterval(interval);
  }, [timeLeft]);
  

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");
  const isExpired = timeLeft <= 0;
  

  // circle progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / OTP_DURATION; // از ۱ به ۰
  const strokeDashoffset = circumference * (1 - progress);

  function goback(e) {
    e.preventDefault();
    navigate("/");
  }

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

  const updateCode = (index, value) => {
    setCode((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");
    setResendMessage("");

    if (!email) {
      setError("no email found to resend code");
      return;
    }

    try {
      setResendLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      console.log("RESEND OTP RESPONSE:", data);

      if (!res.ok) {
        setError(data.error || "could not resend code");
        return;
      }

      setResendMessage(
        data.message || "A new code has been sent to your email."
      );
      const newExpiry = Date.now() + OTP_DURATION * 1000;
      localStorage.setItem("otpExpiry", String(newExpiry));
      setTimeLeft(OTP_DURATION);
      // ریست تایمر به ۱۰ دقیقه
      setTimeLeft(OTP_DURATION);
    } catch (err) {
      console.error(err);
      setError("there is a problem while resending code");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (isExpired) {
      setError("code has expired, please resend a new one.");
      return;
    }

    const finalCode = code.join("");

    if (!email) {
      setError("no such email found");
      return;
    }

    if (finalCode.length !== CODE_LENGTH) {
      setError("it has to be 6 digits!");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: finalCode,
        }),
      });

      const data = await res.json();
      console.log("VERIFY RESPONSE:", data);

      if (!res.ok) {
        setError(data.error || "invalid code");
        return;
      }

      setSuccess("email validated successfully");

      const token = data.token;
      if (token) {
        localStorage.setItem("token", token);
      }

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("there is a problem");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-loginbg flex flex-col justify-center items-center px-4">
      <main className="w-full max-w-xl">
        <div className="bg-creamtext w-full rounded-md shadow px-8 md:px-16 py-10">
          {/* HEADER + CIRCULAR TIMER */}
          <div className="flex flex-col items-center gap-3 mb-6">
            {/* دایره‌ی تایمر */}
            <div className="relative w-24 h-24">
              <svg
                viewBox="0 0 100 100"
                className="w-24 h-24 transform -rotate-90"
              >
                {/* پس‌زمینه‌ی دایره */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="rgba(34,197,94,0.2)" // سبز کم‌رنگ
                  strokeWidth="8"
                  fill="none"
                />
                {/* دایره‌ی پرشونده */}
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

              {/* متن داخل دایره */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-gray-500 mb-0.5">time left </span>
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
            <p className="text-green-700 text-sm mb-2 text-center">{success}</p>
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
                  ref={(el) => (inputsRef.current[index] = el)}
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
}
