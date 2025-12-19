// src/components/Dashboard/SidebarIcon.tsx
import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UsersRound,
  BarChart3,
  ShoppingBag,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Flame,
  PlayCircle,
} from "lucide-react";

type NavItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  to?: string;
  badge?: string;  
  onClick?: () => void; 
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold text-yellow-600 px-3 mb-2 tracking-wide">
      {children}
    </div>
  );
}

function SidebarItem({
  item,
  active,
  onSelect,
}: {
  item: NavItem;
  active: boolean;
  onSelect: (it: NavItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className={cx(
        "group relative w-full",
        "flex items-center justify-between",
        "rounded-xl px-3 py-2 text-sm",
        "transition-all duration-300",
        active ? "bg-yellow-100/70 text-zinc-900" : "text-zinc-600 hover:bg-yellow-50"
      )}
    >
      {/* left accent */}
      <span
        className={cx(
          "absolute left-0 top-1/2 -translate-y-1/2",
          "h-6 w-1 rounded-full transition-all duration-300",
          active ? "bg-yellow-400" : "bg-transparent group-hover:bg-yellow-300"
        )}
      />

      <div className="flex items-center gap-3">
        <span
          className={cx(
            "transition-all duration-300 group-hover:-translate-y-0.5",
            active ? "text-yellow-600" : "text-zinc-500 group-hover:text-yellow-600"
          )}
        >
          {item.icon}
        </span>

        <span className="font-medium">{item.label}</span>
      </div>

      {item.badge && (
        <span className="rounded-full bg-yellow-200 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
          {item.badge}
        </span>
      )}
    </button>
  );
}

export default function Sidebar({
  activeKey = "dashboard",
  onLogout,
}: {
  activeKey?: string;
  onLogout: () => void;
}) {
  const navigate = useNavigate();

  const { quick, main, bottom } = useMemo(() => {
    const quick: NavItem[] = [
      { key: "focus", label: "Start Focus", icon: <PlayCircle className="h-4 w-4" />, to: "/focus" },
      { key: "streak", label: "View streak", icon: <Flame className="h-4 w-4" />, to: "/streak" },
    ];

    const main: NavItem[] = [
      { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, to: "/dashboard" },
      { key: "groups", label: "Groups", icon: <UsersRound className="h-4 w-4" />, to: "/groups" },
      { key: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" />, to: "/analytics", badge: "New" },
      { key: "commerce", label: "Commerce", icon: <ShoppingBag className="h-4 w-4" />, to: "/commerce" },
      { key: "users", label: "Users", icon: <Users className="h-4 w-4" />, to: "/users", badge: "12" },
    ];

    const bottom: NavItem[] = [
      { key: "settings", label: "Settings", icon: <Settings className="h-4 w-4" />, to: "/settings" },
      { key: "help", label: "Help", icon: <HelpCircle className="h-4 w-4" />, to: "/help" },
      { key: "logout", label: "Logout", icon: <LogOut className="h-4 w-4" /> },
    ];
    

    return { quick, main, bottom };
  }, [onLogout]);

  const onSelect = (it: NavItem) => {
    if (it.key === "logout") {
      onLogout();
      return;
    }
    if (it.to) navigate(it.to);
  };
  

  return (
    <aside
      className={cx(
        "hidden md:flex md:flex-col",
        "fixed left-0 top-0",
        "h-screen w-64",
        "border-r border-zinc-200",
        "bg-gradient-to-b from-yellow-50/60 to-white",
        "z-40"
      )}
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
            transition={{ delay: 0.35, duration: 0.6 }}
            className="absolute -inset-6 rounded-2xl bg-yellow-200/40 blur-2xl"
          />

          <motion.div
            initial={{ letterSpacing: "0.2em", scale: 0.96 }}
            animate={{ letterSpacing: "0.12em", scale: 1 }}
            transition={{ delay: 0.12, duration: 0.6, ease: "easeOut" }}
            className="relative"
          >
            <div className="text-[20px] font-semibold tracking-[0.12em] text-zinc-900">
              REVE
            </div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 0.45, ease: "easeOut" }}
              className="mt-1 h-[2px] rounded-full bg-yellow-400"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-1 text-xs text-zinc-500"
          >
            Study dashboard
          </motion.div>
        </motion.div>
      </div>

      {/* Quick */}
      <div className="px-3 py-4">
        <SectionTitle>QUICK ACTIONS</SectionTitle>
        <div className="space-y-1">
          {quick.map((it) => (
            <SidebarItem key={it.key} item={it} active={it.key === activeKey} onSelect={onSelect} />
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="px-3 py-2">
        <SectionTitle>MENU</SectionTitle>
        <div className="space-y-1">
          {main.map((it) => (
            <SidebarItem key={it.key} item={it} active={it.key === activeKey} onSelect={onSelect} />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto px-3 pb-5">
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-3 mb-3">
          <p className="text-xs text-yellow-700">Stay consistent. Small steps daily.</p>
        </div>

        <div className="space-y-1">
          {bottom.map((it) => (
            <SidebarItem key={it.key} item={it} active={it.key === activeKey} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </aside>
  );
}
