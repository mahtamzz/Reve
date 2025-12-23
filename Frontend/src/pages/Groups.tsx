import React, { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import CreateGroupModal from "@/components/Groups/CreateGroupModal";
import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import { logout } from "@/utils/authToken";
import { GroupCard, type Group } from "@/components/Groups/GroupCard";

type CreateGroupPayload = {
  name: string;
  description: string;
  privacy: "public" | "private";
  goalXp: number;
  minDailyMinutes: number;
  invites: string[];
};

export default function Groups() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  // ✅ groups باید state باشد
  const [groups, setGroups] = useState<Group[]>([
    { id: "1", name: "Up Mind", score: 1043, goal: 100000 },
    { id: "2", name: "Math Masters", score: 8420, goal: 20000 },
    { id: "3", name: "Physics Crew", score: 1211, goal: 5000 },
  ]);

  const [createOpen, setCreateOpen] = useState(false);

  // ✅ برای اسکرول/هایلایت کارت جدید
  const newCardIdRef = useRef<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  const handleCreateGroup = async (payload: CreateGroupPayload) => {
    // ✅ حتماً id یکتا
    const newId = crypto.randomUUID();
    newCardIdRef.current = newId;

    const newGroup: Group = {
      id: newId,
      name: payload.name,
      score: 0,
      goal: payload.goalXp, // 👈 تبدیل payload -> Group
    };

    // ✅ اول لیست اضافه کن تا دیده بشه
    setGroups((prev) => [newGroup, ...prev]);

    // ✅ فیلتر سرچ رو پاک کن که قایم نشه
    setQuery("");

    // ✅ مودال بسته
    setCreateOpen(false);

    // ✅ یک لحظه بعد اسکرول به بالا / یا کارت جدید
    window.setTimeout(() => {
      const el = document.getElementById(`group-card-${newId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="groups" onLogout={logout} />
        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar username={"User"} />

          <div className="mx-auto max-w-6xl px-4 py-6">
            {/* header */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-500">My Groups</p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                  Groups
                </h1>
                <p className="mt-1 text-sm text-zinc-600">
                  Find a group to study with and stay accountable.
                </p>
              </div>

              <div className="w-full sm:w-[420px]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search groups..."
                    className="w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-4 py-3 text-sm text-zinc-700 shadow-sm outline-none focus:ring-2 focus:ring-yellow-300/60"
                    id="group-search"
                    name="groupSearch"
                  />
                </div>
              </div>
            </div>

            {/* list */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {filtered.map((g) => (
                  <motion.div
                    key={g.id}
                    layout
                    id={`group-card-${g.id}`} // ✅ برای scrollIntoView
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={
                      newCardIdRef.current === g.id
                        ? "ring-2 ring-yellow-300/60 rounded-3xl"
                        : ""
                    }
                  >
                    <GroupCard
                      group={g}
                      onClick={() =>
                        navigate(`/groups/${g.id}`, { state: { groupName: g.name } })
                      }
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* floating create */}
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="group fixed right-6 bottom-6 z-50 rounded-2xl border border-zinc-200 bg-white shadow-lg px-4 py-3 flex items-center gap-3 hover:-translate-y-0.5 hover:shadow-xl hover:border-yellow-300 transition"
            >
              <span className="h-10 w-10 rounded-xl bg-yellow-100 border border-yellow-200 flex items-center justify-center">
                <Plus className="h-5 w-5 text-yellow-700" />
              </span>
              <div className="text-left leading-tight">
                <div className="text-sm font-semibold text-zinc-900">New group</div>
                <div className="text-xs text-zinc-500">Create and invite</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateGroup}
      />
    </div>
  );
}
