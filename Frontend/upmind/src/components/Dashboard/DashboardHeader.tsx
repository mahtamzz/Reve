import { Search, Bell } from "lucide-react";
import CommandPalette from "../ui/CommandPalette";
import React, { useEffect, useState } from "react";


export default function Topbar({ username }: { username: string }) {
  const [openCmd, setOpenCmd] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpenCmd(true);
      }
      if (e.key === "Escape") setOpenCmd(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
    <CommandPalette open={openCmd} onClose={() => setOpenCmd(false)} />
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-[#F7F8FA]/75 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-3">
              <div className="text-[17px] font-semibold tracking-tight text-zinc-900">
                Dashboard
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
                <span className="text-zinc-300">/</span>
                <span className="truncate">Study overview</span>
              </div>
            </div>

            {/* subtle accent line */}
            <div className="mt-1 h-[2px] w-14 rounded-full bg-yellow-300/70" />
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div
              className="
                hidden md:flex items-center gap-2
                rounded-xl border border-zinc-200 bg-white
                px-3 py-2
                shadow-sm
                transition-all duration-300
                hover:border-yellow-300 hover:shadow-md
                focus-within:border-yellow-400 focus-within:shadow-md
                focus-within:ring-4 focus-within:ring-yellow-200/40
              "
            >
              <Search className="h-4 w-4 text-zinc-400 transition-colors duration-300 group-focus-within:text-zinc-600" />
              <input
                className="
                  w-44 outline-none bg-transparent text-sm
                  placeholder:text-zinc-400
                  transition-all duration-300
                  focus:w-64
                "
                placeholder="Search..."
              />
              <kbd className="ml-1 hidden lg:inline-flex rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[10px] text-zinc-500">
                ⌘ K
              </kbd>
            </div>

            {/* Notifications */}
            <button
              className="
                group relative h-10 w-10 rounded-xl
                border border-zinc-200 bg-white
                flex items-center justify-center
                shadow-sm transition-all duration-300
                hover:-translate-y-0.5 hover:shadow-md
                hover:border-yellow-300
              "
            >
              {/* tiny ping dot */}
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-yellow-400" />
              <Bell className="h-4 w-4 text-zinc-600 transition-transform duration-300 group-hover:-rotate-6" />
            </button>

            {/* Profile */}
            <div
              className="
                flex items-center gap-2
                rounded-xl border border-zinc-200 bg-white
                px-2.5 py-2
                shadow-sm
              "
            >
              {/* Avatar placeholder (replace with <img />) */}
              <div className="h-8 w-8 rounded-full overflow-hidden border border-zinc-200 bg-zinc-100">
                {/* Replace this div with an <img src="..." /> */}
                <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(250,204,21,0.35),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.04),transparent_60%)]" />
              </div>

              <div className="hidden sm:block">
                <div className="text-sm font-medium text-zinc-800 leading-none">
                  {username}
                </div>
                <div className="mt-1 text-[11px] text-zinc-500 leading-none">
                  Student
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile search (optional) */}
        <div className="mt-3 md:hidden">
          <div
            className="
              flex items-center gap-2
              rounded-xl border border-zinc-200 bg-white
              px-3 py-2 shadow-sm
              transition-all duration-300
              focus-within:border-yellow-400 focus-within:ring-4 focus-within:ring-yellow-200/40
            "
          >
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              className="w-full outline-none bg-transparent text-sm placeholder:text-zinc-400"
              placeholder="Search..."
            />
          </div>
        </div>
      </div>
    </header>
    </>
    
  );
}
