// src/components/auth/SignupForm.jsx
import { useRef } from "react";
import { Link } from "react-router-dom";
import GoogleButton from "../GoogleButton/GoogleButton"; // مسیر را با ساختار خودت هماهنگ کن

export default function SignupForm({
  mounted,
  name,
  email,
  password,
  error,
  loading,
  onChangeName,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  onForgotPassword,
}) {
  const inputsRef = useRef([]);

  return (
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

      <form className="space-y-6" onSubmit={onSubmit}>
        {/* Name */}
        <div>
          <label className="block text-sm mb-2">Name</label>
          <input
            ref={(el) => (inputsRef.current[0] = el)}
            className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1 focus:border-niceblue transition"
            value={name}
            onChange={onChangeName}
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
            onChange={onChangeEmail}
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
              onClick={onForgotPassword}
            >
              Forgot password?
            </button>
          </div>

          <input
            ref={(el) => (inputsRef.current[2] = el)}
            type="password"
            className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1 focus:border-niceblue transition"
            value={password}
            onChange={onChangePassword}
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
  );
}
