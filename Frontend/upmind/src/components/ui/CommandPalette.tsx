import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, LayoutDashboard, LogOut, Users } from "lucide-react";

type Command = {
  label: string;
  icon: React.ReactNode;
  action: () => void;
};

export default function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const commands: Command[] = [
    { label: "Go to Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, action: onClose },
    { label: "Open Users", icon: <Users className="h-4 w-4" />, action: onClose },
    { label: "Sign out", icon: <LogOut className="h-4 w-4" />, action: onClose },
  ];

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="
              fixed left-1/2 top-[20%] z-50 w-[92%] max-w-lg
              -translate-x-1/2 rounded-2xl
              border border-zinc-200 bg-white shadow-xl
            "
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Search */}
            <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-3">
              <Search className="h-4 w-4 text-zinc-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command..."
                className="w-full outline-none text-sm placeholder:text-zinc-400"
              />
              <kbd className="rounded border px-1.5 py-0.5 text-[10px] text-zinc-500">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-64 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-zinc-500">
                  No results found
                </div>
              )}

              {filtered.map((c) => (
                <button
                  key={c.label}
                  onClick={c.action}
                  className="
                    group flex w-full items-center gap-3 rounded-xl px-3 py-2
                    text-sm text-zinc-700
                    transition-colors
                    hover:bg-yellow-50 hover:text-zinc-900
                  "
                >
                  <span className="text-zinc-400 group-hover:text-yellow-600">
                    {c.icon}
                  </span>
                  <span className="flex-1 text-left">{c.label}</span>
                  <span className="text-[10px] text-zinc-400">↵</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
