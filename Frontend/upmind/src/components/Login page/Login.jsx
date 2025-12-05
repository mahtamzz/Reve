import { Link, NavLink, useNavigate } from "react-router-dom";
import GoogleButton from "../GoogleButton/GoogleButton";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("LOGIN RESPONSE:", data);

      if (!res.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // for using in saving token /me
      localStorage.setItem("token", data.token);

      navigate("/dashboard");

    } catch (err) {
      console.error(err);
      setError("there is a problem");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">
      
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center px-10 pt-10 text-white">
        <div className="text-3xl tracking-widest text-creamtext">REVE</div>

        <nav className="flex gap-12 text-lg">
          <NavLink className="cursor-pointer hover:opacity-80 text-creamtext">About</NavLink>
          <NavLink className="cursor-pointer hover:opacity-80 text-creamtext">Services</NavLink>
          <NavLink className="cursor-pointer hover:opacity-80 text-creamtext">Contact us</NavLink>
        </nav>
      </header>

      {/* Card */}
      <div className="mt-20 bg-creamtext text-brand-text rounded-xl px-10 py-12 w-full max-w-[460px] shadow">
        
        <h1 className="text-center text-3xl text-chocolate mb-10">Login</h1>

        <p className="mb-8">
          don’t have an account?{" "}
          <Link to="/" className="text-niceblue underline">
            sign up
          </Link>
        </p>

        <form className="space-y-8" onSubmit={handleLogin}>

          <div>
            <label className="block text-sm mb-2">email</label>
            <input 
              className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <label>password</label>
              <a
                href="#"
                className="text-niceblue underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/forgot-password");
                }}
              >
                forgot password?
              </a>            
            </div>
            <input 
              type="password"
              className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm -mt-4">{error}</p>
          )}

          <button 
            className="w-full bg-chocolate text-creamtext py-3 rounded-md mt-6 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Please wait..." : "Login"}
          </button>

          {/* OR */}
          <div className="flex items-center gap-2 -mt-4">
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
