export default function Signup() {
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
        <div className="mt-20 bg-creamtext text-brand-text rounded-xl px-16 py-12 w-[500px] shadow">
  
          <h1 className="text-center text-3xl text-chocolate mb-10">Create an account</h1>
  
          <p className="text-niceblue  mb-8">
            Already have an account?{" "}
            <a href="/login" className=" text-niceblue underline">
              login
            </a>
          </p>
  
          <form className="space-y-8">
  
            <div>
              <label className="block text-sm mb-2">name</label>
              <input 
                className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
              />
            </div>
  
            <div>
              <label className="block text-sm mb-2">email or phone</label>
              <input 
                className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
              />
            </div>
  
            <div>
              <div className="flex justify-between text-sm mb-2">
                <label>password</label>
                <a href="#" className="text-brand-link underline text-niceblue">forgot password?</a>
              </div>
              <input 
                type="password"
                className="w-full bg-transparent border-b border-brand-text/50 outline-none pb-1"
              />
            </div>
  
            <button className="w-full bg-chocolate text-creamtext py-3 rounded-md mt-6">
              Sign up
            </button>
  
          </form>
        </div>
      </div>
    );
  }
  