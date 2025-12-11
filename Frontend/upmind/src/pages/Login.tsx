import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import LoginForm from "@/components/Login page/Login";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [showLogoutMessage, setShowLogoutMessage] = useState(false);


  const navigate = useNavigate();

  const timer = setTimeout(() => {
    setShowLogoutMessage(false);
  }, 2000); 
  

  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    const loggedOut = searchParams.get("loggedOut") === "true";
  
    if (loggedOut) {
      setShowLogoutMessage(true);
  
      // بعد از چند ثانیه پیام رو ببند
      const timer = setTimeout(() => {
        setShowLogoutMessage(false);
      }, 3000); // 3 ثانیه
  
      // اختیاری: پاک کردن پارامتر از آدرس (که اگر رفرش کرد، دوباره پیام نیاد)
      const sp = new URLSearchParams(searchParams);
      sp.delete("loggedOut");
      setSearchParams(sp, { replace: true });
  
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);
  

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const text = await res.text();


      let data: any;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Server did NOT return JSON:", text);
        setError("Server error: invalid response format.");
        return;
      }

      console.log("STATUS:", res.status);
      console.log("TEXT:", text);
      console.log("PARSED DATA:", data);


      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }
      console.log("TOKEN:", data.token);

      if (data.token) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      }
    } catch (err) {
      console.log("chishod")
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleForgotPassword() {
    navigate("/forgot-password");
  }

  return (
    <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">
    {showLogoutMessage && (
      <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-md bg-emerald-600 text-white shadow-lg">
        you logged out successfully
      </div>
    )}

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

      {/* Login Form component */}
      <LoginForm
        mounted={mounted}
        email={email}
        password={password}
        error={error}
        loading={loading}
        onChangeEmail={(e: React.ChangeEvent<HTMLInputElement>) =>
          setEmail(e.target.value)
        }
        onChangePassword={(e: React.ChangeEvent<HTMLInputElement>) =>
          setPassword(e.target.value)
        }
        onSubmit={handleLogin}
        onForgotPassword={handleForgotPassword}
      />
    </div>
  );
};

export default LoginPage;
