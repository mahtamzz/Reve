import { Link, NavLink } from "react-router-dom";
import GoogleButton from "../GoogleButton/GoogleButton";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
        setLoading(false);
        return;
      }

      navigate("/verification", {
        state: {
          email: email,
          userId: data.user_id,
        },
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
      <header className="w-full max-w-6xl flex justify-between items-center px-10 pt-10 text-white">
        <div className="text-3xl tracking-widest text-creamtext">REVE</div>

        <nav className="flex gap-12 text-lg">
          <NavLink to="/about" className="cursor-pointer hover:opacity-80 text-creamtext">
            About
          </NavLink>
          <NavLink to="/services" className="cursor-pointer hover:opacity-80 text-creamtext">
            Services
          </NavLink>
          <NavLink to="/contact" className="cursor-pointer hover:opacity-80 text-creamtext">
            Contact us
          </NavLink>
        </nav>
      </header>

      {/* Card */}
      <div
        className="
          mt-10 bg-creamtext text-brand-text 
          rounded-xl 
          px-6 sm:px-14 py-10 
          w-full max-w-sm sm:max-w-md md:max-w-lg 
          shadow
        "
      >
        <h1 className="text-center text-3xl text-chocolate mb-10">
          Create an account
        </h1>

        <p className="mb-8">
          Already have an account?{" "}
          <Link to="/login" className="text-niceblue underline">
            login
          </Link>
        </p>

        <form className="space-y-8" onSubmit={handleSignup}>
          <div>
            <label className="block text-sm mb-2">name</label>
            <input
              className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-2">email or phone</label>
            <input
              type="email"
              className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
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
            <p className="text-red-600 text-sm mt-2">
              {typeof error === "string" ? error : JSON.stringify(error)}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-chocolate text-creamtext py-3 rounded-md mt-6 disabled:opacity-60"
          >
            {loading ? "Please wait..." : "Sign up"}
          </button>

          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-px bg-chocolate/40"></div>
            <span className="text-chocolate/70 font-medium">OR</span>
            <div className="flex-1 h-px bg-chocolate/40"></div>
          </div>

          <GoogleButton text="Continue with Google" />
        </form>
      </div>
    </div>
  );
}
