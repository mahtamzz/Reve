import React from "react";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Users,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";

type Item = {
  key: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
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
    { key: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "commerce", label: "Commerce", icon: <ShoppingBag className="h-4 w-4" /> },
    { key: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
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
        className={[
          "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
          active
            ? "bg-blue-50 text-blue-700 border border-blue-100"
            : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
        ].join(" ")}
        type="button"
      >
        <span className={active ? "text-blue-700" : "text-zinc-500"}>{it.icon}</span>
        <span className="font-medium">{it.label}</span>
      </button>
    );
  };

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-zinc-200 bg-white">
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600" />
          <div className="leading-tight">
            <div className="text-sm font-semibold text-zinc-900">REVE</div>
            <div className="text-xs text-zinc-500">Minimal Dashboard</div>
          </div>
        </div>
      </div>

      <div className="px-3">
        <div className="text-[11px] font-semibold text-zinc-400 px-3 mb-2">MENU</div>
        <div className="space-y-1">{main.map(ItemRow)}</div>
      </div>

      <div className="mt-auto px-3 pb-5">
        <div className="text-[11px] font-semibold text-zinc-400 px-3 mb-2">SYSTEM</div>
        <div className="space-y-1">{bottom.map(ItemRow)}</div>
      </div>
    </aside>
  );
}
