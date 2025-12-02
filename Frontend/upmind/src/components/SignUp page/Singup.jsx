import { Link, NavLink } from "react-router-dom";
import GoogleButton from "../GoogleButton/GoogleButton";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  function handleSignup(e) {
    e.preventDefault();
    navigate("/verification");
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
        <div className="
          mt-10 bg-creamtext text-brand-text 
          rounded-xl 
          px-6 sm:px-14 py-10 
          w-full max-w-sm sm:max-w-md md:max-w-lg 
          shadow
        ">

          <h1 className="text-center text-3xl text-chocolate mb-10">
            Create an account
          </h1>

          <p className="mb-8">
            Already have an account?{" "}
            <Link to="/login" className="text-niceblue underline">login</Link>
          </p>

          <form className="space-y-8">

            <div>
              <label className="block text-sm mb-2">name</label>
              <input className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1" />
            </div>

            <div>
              <label className="block text-sm mb-2">email or phone</label>
              <input className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <label>password</label>
                <a href="#" className="text-niceblue underline">forgot password?</a>
              </div>
              <input 
                type="password"
                className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
              />
            </div>

            <button onClick={handleSignup} className="w-full bg-chocolate text-creamtext py-3 rounded-md mt-6">
              Sign up
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
  