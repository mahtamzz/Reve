// src/pages/SignupPage.tsx
import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import SignupForm from "@/components/SignUp page/Singup";
import FullBodyBuddy from "@/components/FullBodyBuddy";
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: name,
          email,
          password,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok) {
        setError(data?.error || data?.message || "Signup failed");
        return;
      }

      navigate("/verification", { state: { email, from: "signup" } });
    } catch (err) {
      console.error(err);
      setError("There is a problem. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    navigate("/forgot-password");
  }

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      {/* Header */}
      <header className="mx-auto max-w-6xl px-6 pt-8 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="flex items-center justify-between"
        >
          <div className="text-xl font-semibold tracking-[0.18em]">
            REVE
            <div className="mt-1 h-[2px] w-full rounded-full bg-yellow-400" />
          </div>

          <nav className="hidden sm:flex items-center gap-8 text-sm">
            <NavLink to="/about" className="text-zinc-600 hover:text-zinc-900 transition">
              About
            </NavLink>
            <NavLink to="/services" className="text-zinc-600 hover:text-zinc-900 transition">
              Services
            </NavLink>
            <NavLink to="/contact" className="text-zinc-600 hover:text-zinc-900 transition">
              Contact
            </NavLink>
          </nav>
        </motion.div>
      </header>

      {/* Main card */}
      <main className="mx-auto max-w-6xl px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
          className="
          relative
          grid grid-cols-12
          rounded-[32px]
          border border-zinc-200
          bg-white
          shadow-2xl
          overflow-hidden
        "        
        >
          {/* Left – Buddy */}
          <section
            className="
              col-span-12 md:col-span-5
              relative
              flex items-center justify-center
              p-8 md:p-10
              bg-gradient-to-br from-yellow-50 via-orange-50 to-white
              border-b md:border-b-0 md:border-r border-yellow-200/60
            "
          >
            {/* accents */}
            <div className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-orange-400/25 blur-3xl" />
            <div className="pointer-events-none absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-yellow-200/40 blur-3xl" />

            <div className="relative flex flex-col items-center">
              <FullBodyBuddy label="Let’s study ✏️" />
              <div className="mt-4 max-w-[260px] text-center">
                <p className="text-sm font-semibold text-zinc-900">
                  Start your study journey
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  Create an account and build powerful study habits.
                </p>
              </div>
            </div>
          </section>

          {/* Right – Signup form */}
          <section className="col-span-12 md:col-span-7 p-6 sm:p-10 flex items-center justify-center">
            <div className="w-full max-w-[560px]">
              <SignupForm
                mounted={mounted}
                name={name}
                email={email}
                password={password}
                error={error}
                loading={loading}
                onChangeName={(e) => setName(e.target.value)}
                onChangeEmail={(e) => setEmail(e.target.value)}
                onChangePassword={(e) => setPassword(e.target.value)}
                onSubmit={handleSignup}
                onForgotPassword={handleForgotPassword}
              />
            </div>
          </section>
        </motion.div>
      </main>
    </div>
  );
};

export default React.memo(SignupPage);
