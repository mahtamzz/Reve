import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus on email input automatically
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const validateEmail = (email) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        "http://localhost:8080/api/users/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();
      console.log("FORGOT PASSWORD RESPONSE:", data);

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setMessage(
        data.message ||
          "If this email exists, a reset code has been sent to your inbox."
      );

      // Small delay for UX
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 600);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
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
          <button className="cursor-pointer hover:opacity-80 text-creamtext">
            About
          </button>
          <button className="cursor-pointer hover:opacity-80 text-creamtext">
            Services
          </button>
          <button className="cursor-pointer hover:opacity-80 text-creamtext">
            Contact us
          </button>
        </nav>
      </header>

      {/* Card */}
      <div className="mt-16 bg-creamtext text-brand-text rounded-xl px-8 sm:px-10 py-10 w-full max-w-[460px] shadow">

        {/* Step indicator */}
        <div className="flex justify-between items-center mb-4 text-xs text-gray-500">
          <span>Step 1 of 2</span>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="h-14 w-14 rounded-full bg-loginbg flex items-center justify-center shadow-md border border-creamtext/40">
            <svg
              className="w-7 h-7 text-creamtext"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
              <polyline points="3,7 12,13 21,7" />
            </svg>
          </div>
        </div>

        <h1 className="text-center text-2xl sm:text-3xl text-chocolate mb-3">
          Forgot Password?
        </h1>

        <p className="text-sm text-chocolate/80 mb-6 text-center px-2">
          Enter the email address associated with your account.  
          We'll send you a verification code to reset your password.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm mb-2">Email address</label>
            <input
              ref={inputRef}
              type="email"
              className="w-full bg-transparent border-b border-brand-text/40 outline-none pb-1 
                         focus:border-niceblue transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full bg-chocolate text-creamtext py-3 rounded-md 
              mt-2 disabled:opacity-60 hover:bg-chocolate/90 transition-colors 
              flex justify-center items-center gap-2
            "
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            {loading ? "Sending..." : "Send reset code"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-chocolate/70">Remembered your password? </span>
          <Link to="/login" className="text-niceblue underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
