import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import LoginForm from "@/components/Login page/Login";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const navigate = useNavigate();

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

      if (data.token) {
        localStorage.setItem("token", data.token);
      
        try {
          const meRes = await fetch("http://localhost:8080/api/users/me", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${data.token}`,
              "Content-Type": "application/json"
            }
          });
      
          const meData = await meRes.json();
          console.log("ME RESPONSE:", meData);
      
          if (!meRes.ok) {
            setError("Could not fetch user info. Token may be invalid.");
            return;
          }
      
          localStorage.setItem("user", JSON.stringify(meData.user));
      
          if (meData.user.role === "admin") {
            navigate("/dashboard-admin");
          } else {
            navigate("/dashboard");
          }
      
        } catch (err) {
          console.error(err);
          setError("Network error while verifying token.");
        }
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
