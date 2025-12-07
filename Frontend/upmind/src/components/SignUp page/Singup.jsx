import { Link, NavLink, useNavigate } from "react-router-dom";
import GoogleButton from "../GoogleButton/GoogleButton";
import { useEffect, useState, useRef } from "react";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [mounted, setMounted] = useState(false);

  const inputsRef = useRef([]);


  useEffect(() => {
    // trigger animation once component mounts
    setMounted(true);
  }, []);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          email: email,
          password: password,
        }),
      });

      const data = await res.json();
      console.log("REGISTER RESPONSE:", data);

      if (!res.ok) {
        setError(data.error || data);
        return;
      }

      navigate("/verification", {
        state: { email: email, userId: data.user_id },
      });
    } catch (err) {
      console.error(err);
      setError("there is a problem. try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">

      {/* Header */}
      <header
        className={`w-full max-w-6xl flex justify-between items-center px-10 pt-10 text-white transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"
        }`}
      >
        <div className="text-3xl tracking-widest text-creamtext">
          <span className="inline-block origin-left transition-transform duration-700 ease-out hover:scale-105">
            REVE
          </span>
        </div>

        <nav className="flex gap-12 text-lg">
          <NavLink to="/about" className="cursor-pointer hover:opacity-80 text-creamtext transition">
            About
          </NavLink>
          <NavLink to="/services" className="cursor-pointer hover:opacity-80 text-creamtext transition">
            Services
          </NavLink>
          <NavLink to="/contact" className="cursor-pointer hover:opacity-80 text-creamtext transition">
            Contact us
          </NavLink>
        </nav>
      </header>

      {/* Card */}
      <div
        className={`
          mt-10 bg-creamtext text-brand-text rounded-xl px-2 sm:px-14 py-10
          w-full max-w-sm sm:max-w-md md:max-w-lg shadow-lg
          transition-all duration-700 ease-out
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        `}
      >
        <h1 className="text-center text-3xl text-chocolate mb-10">
          Create an account
        </h1>

        <form className="space-y-6" onSubmit={handleSignup}>
          
          {/* Name */}
          <div>
            <label className="block text-sm mb-2">Name</label>
            <input
              ref={(el) => (inputsRef.current[0] = el)}
              className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1 focus:border-niceblue transition"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm mb-2">Email</label>
            <input
              ref={(el) => (inputsRef.current[1] = el)}
              type="email"
              className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1 focus:border-niceblue transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <label>Password</label>
              <button
                type="button"
                className="text-niceblue underline"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password?
              </button>
            </div>

            <input
              ref={(el) => (inputsRef.current[0] = el)}
              type="password"
              className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1 focus:border-niceblue transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Already have account */}
          <p className="text-sm text-chocolate/70">
            Already have an account?{" "}
            <Link to="/login" className="text-niceblue underline">
              Login
            </Link>
          </p>

          {/* Error */}
          {error && (
            <p className="text-red-600 text-sm">
              {typeof error === "string" ? error : JSON.stringify(error)}
            </p>
          )}

          {/* Signup button */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full bg-chocolate text-creamtext py-3 rounded-md mb-1 
              disabled:opacity-60 hover:bg-chocolate/90 transition-colors
              flex items-center justify-center gap-2 active:scale-[0.98]
            "
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-creamtext border-t-transparent rounded-full animate-spin"></span>
            )}
            {loading ? "Please wait..." : "Sign up"}
          </button>

          {/* OR */}
          <div className="flex items-center gap-1 m-5">
            <div className="flex-1 h-px bg-chocolate/40"></div>
            <span className="text-chocolate/70 font-medium">OR</span>
            <div className="flex-1 h-px bg-chocolate/40"></div>
          </div>

          {/* Google button */}
          <GoogleButton text="Continue with Google" origin="signup" />
        </form>
      </div>
    </div>
  );
}
