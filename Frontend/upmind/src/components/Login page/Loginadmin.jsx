import { Link, NavLink, useNavigate } from "react-router-dom";
import GoogleButton from "../GoogleButton/GoogleButton";
import { useEffect, useState, useRef } from "react";
import React from "react";

function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const inputsRef = useRef([]);

  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("LOGIN RESPONSE:", data);

      if (!res.ok) {
        if (res.status === 401) {
          setError("Email or password is incorrect.");
        } else if (res.status === 429) {
          setError("Too many attempts. Please try again later.");
        } else {
          setError(data.error || "Login failed. Please try again.");
        }
        return;
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      navigate("/dashboard-admin");
    } catch (err) {
      console.error(err);
      setError("There is a problem. Please try again.");
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
      <div
        className={`
          mt-20 bg-creamtext text-brand-text rounded-xl px-10 py-12 
          w-full max-w-[460px] shadow-lg
          transition-all duration-700 ease-out
          ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
        `}
      >
        <h1 className="text-center text-3xl text-chocolate mb-5">
          Login 
        </h1>
        <p className="text-center text-gray mb-5">Admin</p>

        <form className="space-y-8" onSubmit={handleLogin}>

          {/* Email */}
          <div>
            <label className="block text-sm mb-2">Email</label>
            <input 
              ref={(el) => (inputsRef.current[0] = el)}
              className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
              type="email"
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
                forgot password?
              </button>

            </div>

            <input 
              ref={(el) => (inputsRef.current[0] = el)}
              type="password"
              className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <p className="text-sm text-chocolate/70 -mt-4">
            Don’t have an account?{" "}
            <Link to="/" className="text-niceblue underline">
              Sign up
            </Link>
          </p>

          {/* Error */}
          {error && <p className="text-red-600 text-sm text-center -mt-2">{error}</p>}

          {/* Login button */}
          <button 
            className="w-full bg-chocolate text-creamtext py-3 rounded-md mt-4 mb-1 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Please wait..." : "Login"}
          </button>

          {/* OR */}
          <div className="flex items-center gap-2 m-5">
            <div className="flex-1 h-px bg-chocolate/40"></div>
            <span className="text-chocolate/70 text-sm font-medium">OR</span>
            <div className="flex-1 h-px bg-chocolate/40"></div>
          </div>

          <GoogleButton text="Continue with Google" origin="login" />

          </form>

      </div>
    </div>
  );
}

export default React.memo(LoginAdmin)
