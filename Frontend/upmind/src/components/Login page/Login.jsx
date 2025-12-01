export default function Login() {
    return (
      <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">
        
        {/* Header */}
        <header className="w-full max-w-5xl flex justify-between items-center px-10 pt-10 text-white">
          <div className="text-3xl tracking-widest text-creamtext">REVE</div>
  
          <nav className="flex gap-12 text-lg">
            <span className="cursor-pointer hover:opacity-80 text-creamtext">About</span>
            <span className="cursor-pointer hover:opacity-80 text-creamtext">Services</span>
            <span className="cursor-pointer hover:opacity-80 text-creamtext">Contact us</span>
          </nav>
        </header>
  
        {/* Card */}
        <div className="mt-20 bg-creamtext text-brand-text rounded-xl px-16 py-12 w-[460px] shadow">
  
          <h1 className="text-center text-3xl text-chocolate mb-10">Login</h1>
  
          <p className="mb-8">
            don’t have an account?{" "}
            <a href="/signup" className="text-niceblue underline">
              sign up
            </a>
          </p>
  
          <form className="space-y-8">
  
            <div>
              <label className="block text-sm mb-2">email</label>
              <input 
                className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
              />
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
  
            <button className="w-full bg-chocolate text-creamtext py-3 rounded-md mt-6">
              Login
            </button>
  
          </form>
        </div>
      </div>
    );
  }
  