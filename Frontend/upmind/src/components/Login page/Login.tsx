import React, { useRef } from "react";
import { Link } from "react-router-dom";
import GoogleButton from "../GoogleButton/GoogleButton";

interface LoginFormProps {
  mounted: boolean;
  email: string;
  password: string;
  error?: string;
  loading: boolean;
  onChangeEmail: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangePassword: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onForgotPassword: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
  mounted,
  email,
  password,
  error,
  loading,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  onForgotPassword,
}) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  return (
    <div
      className={`
        mt-20 bg-creamtext text-brand-text rounded-xl px-10 py-12 
        w-full max-w-[460px] shadow-lg
        transition-all duration-700 ease-out
        ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
    >
      <h1 className="text-center text-3xl text-chocolate mb-10">Login</h1>

      <form className="space-y-8" onSubmit={onSubmit}>
        {/* Email */}
        <div>
          <label className="block text-sm mb-2">Email</label>
          <input
            ref={(el: HTMLInputElement | null) => {
              inputsRef.current[0] = el;
            }}
            className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
            type="email"
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
              forgot password?
            </button>
          </div>

          <input
            ref={(el: HTMLInputElement | null) => {
              inputsRef.current[1] = el;
            }}
            type="password"
            className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
            value={password}
            onChange={onChangePassword}
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
        {error && (
          <p className="text-red-600 text-sm text-center -mt-2">{error}</p>
        )}

        {/* Login button */}
        <button
          type="submit"
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
  );
};

export default React.memo(LoginForm);
