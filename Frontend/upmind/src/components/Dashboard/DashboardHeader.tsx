import React from "react";
import { Search, Bell } from "lucide-react";

export default function Topbar({
  username,
}: {
  username: string;
}) {
  return (
    <header className="sticky top-0 z-10 bg-[#F7F8FA]/80 backdrop-blur border-b border-zinc-200">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-zinc-900">Dashboard</div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
            <span>/</span>
            <span>Minimal</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              className="w-56 outline-none placeholder:text-zinc-400"
              placeholder="Search..."
            />
          </div>

          <button className="h-9 w-9 rounded-lg border border-zinc-200 bg-white flex items-center justify-center hover:bg-zinc-50">
            <Bell className="h-4 w-4 text-zinc-500" />
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
            <div className="h-7 w-7 rounded-full bg-zinc-200" />
            <div className="text-sm font-medium text-zinc-800">{username}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
