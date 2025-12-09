// src/pages/SignupPage.jsx
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import SignupForm from "../components/SignUp page/Singup";

export default function SignupPage() {
  const navigate = useNavigate();

  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // trigger animation once component mounts
    setMounted(true);
  }, []);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
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

      navigate("/verification", { state: { email, from: "signup" } });
    } catch (err) {
      console.error(err);
      setError("there is a problem. try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    navigate("/forgot-password");
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
            className="cursor-pointer hover:opacity-80 text-creamtext transition"
          >
            About
          </NavLink>
          <NavLink
            to="/services"
            className="cursor-pointer hover:opacity-80 text-creamtext transition"
          >
            Services
          </NavLink>
          <NavLink
            to="/contact"
            className="cursor-pointer hover:opacity-80 text-creamtext transition"
          >
            Contact us
          </NavLink>
        </nav>
      </header>

      {/* فرم به عنوان یک کامپوننت UI */}
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
  );
}
