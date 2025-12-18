import React from "react";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Timer,
  Flame,
} from "lucide-react";
import { motion } from "framer-motion";
import { PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";


type Item = {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  onClick?: () => void;
};

export default function Sidebar({
  activeKey = "dashboard",
  onLogout,
}: {
  activeKey?: string;
  onLogout: () => void;
}) {
  const main: Item[] = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" />, badge: "New" },
    { key: "commerce", label: "Commerce", icon: <ShoppingBag className="h-4 w-4" /> },
    { key: "users", label: "Users", icon: <Users className="h-4 w-4" />, badge: "12" },
  ];
  const navigate = useNavigate();

  const quick: Item[] = [
    {
      key: "focus",
      label: "Start Focus",
      icon: <PlayCircle className="h-4 w-4" />,
      onClick: () => navigate("/focus"),
    },
    { key: "streak", label: "View streak", icon: <Flame className="h-4 w-4" /> },
  ];

  const bottom: Item[] = [
    { key: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
    { key: "help", label: "Help", icon: <HelpCircle className="h-4 w-4" /> },
    { key: "logout", label: "Logout", icon: <LogOut className="h-4 w-4" />, onClick: onLogout },
  ];

  const ItemRow = (it: Item) => {
    const active = it.key === activeKey;


    return (
      <button
        key={it.key}
        onClick={it.onClick}
        type="button"
        className={`
          group relative w-full
          flex items-center justify-between
          rounded-xl px-3 py-2 text-sm
          transition-all duration-300
          ${
            active
              ? "bg-yellow-100/70 text-zinc-900"
              : "text-zinc-600 hover:bg-yellow-50"
          }
        `}
      >
        {/* left accent */}
        <span
          className={`
            absolute left-0 top-1/2 -translate-y-1/2
            h-6 w-1 rounded-full
            transition-all duration-300
            ${active ? "bg-yellow-400" : "bg-transparent group-hover:bg-yellow-300"}
          `}
        />

        <div className="flex items-center gap-3">
          <span
            className={`
              transition-all duration-300
              group-hover:-translate-y-0.5
              ${active ? "text-yellow-600" : "text-zinc-500 group-hover:text-yellow-600"}
            `}
          >
            {it.icon}
          </span>

          <span className="font-medium">{it.label}</span>
        </div>

        {it.badge && (
          <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
            {it.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside
      className="
        hidden md:flex md:flex-col
        fixed left-0 top-0
        h-screen w-64
        border-r border-zinc-200
        bg-gradient-to-b from-yellow-50/60 to-white
        z-40
      "
    >
    {/* Brand */}
    <div className="px-5 py-6 border-b border-yellow-100 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative"
      >
        {/* Glow */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="absolute -inset-6 rounded-2xl bg-yellow-200/40 blur-2xl"
        />

        {/* Brand text */}
        <motion.div
          initial={{ letterSpacing: "0.2em", scale: 0.96 }}
          animate={{ letterSpacing: "0.12em", scale: 1 }}
          transition={{ delay: 0.15, duration: 0.6, ease: "easeOut" }}
          className="relative"
        >
          <div className="text-[20px] font-semibold tracking-[0.12em] text-zinc-900">
            REVE
          </div>

          {/* underline */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.55, duration: 0.45, ease: "easeOut" }}
            className="mt-1 h-[2px] rounded-full bg-yellow-400"
          />
        </motion.div>

        {/* subtitle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75, duration: 0.4 }}
          className="mt-1 text-xs text-zinc-500"
        >
          Study dashboard
        </motion.div>
      </motion.div>
    </div>


      {/* Quick */}
      <div className="px-3 py-4">
        <div className="text-[11px] font-semibold text-yellow-600 px-3 mb-2">
          QUICK ACTIONS
        </div>
        <div className="space-y-1">
          {quick.map(ItemRow)}
        </div>
      </div>

      {/* Main */}
      <div className="px-3 py-2">
        <div className="text-[11px] font-semibold text-yellow-600 px-3 mb-2">
          MENU
        </div>
        <div className="space-y-1">
          {main.map(ItemRow)}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto px-3 pb-5">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 mb-3">
          <p className="text-xs text-yellow-700">
            Stay consistent. Small steps daily.
          </p>
        </div>

        <div className="space-y-1">
          {bottom.map(ItemRow)}
        </div>
      </div>
    </aside>
  );
}
