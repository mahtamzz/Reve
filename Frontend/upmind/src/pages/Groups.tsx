import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import type { Variants } from "framer-motion";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import { logout } from "@/utils/authToken";


import { GroupCard, type Group } from "@/components/Groups/GroupCard";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT, staggerChildren: 0.06 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.99 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: EASE_OUT },
  },
};

export default function Groups() {
  const [query, setQuery] = useState<string>("");

  const groups = useMemo<Group[]>(
    () => [
      { id: "1", name: "Up Mind", score: 1043, goal: 100000 },
      { id: "2", name: "Math Masters", score: 8420, goal: 20000 },
      { id: "3", name: "Physics Crew", score: 1211, goal: 5000 },
    ],
    []
  );

  const filtered = useMemo<Group[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, query]);

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="groups" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar username={"User"} />

          <div className="mx-auto max-w-6xl px-4 py-6">
            {/* header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
            >
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
                    className="
                      w-full rounded-2xl
                      border border-zinc-200 bg-white
                      pl-11 pr-4 py-3
                      text-sm text-zinc-700
                      placeholder:text-zinc-400
                      shadow-sm
                      outline-none
                      focus:ring-2 focus:ring-yellow-300/60
                    "
                  />
                </div>
              </div>
            </motion.div>

            {/* main panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="relative mt-6 rounded-3xl bg-white p-6 shadow-sm border border-zinc-200"
            >
              <div className="pointer-events-none absolute -top-16 -right-20 h-56 w-56 rounded-full bg-yellow-200/35 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-yellow-100/55 blur-3xl" />

              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-900">Your groups</p>
                  <span className="text-xs text-zinc-500">{filtered.length} items</span>
                </div>

                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.map((g) => (
                      <motion.div key={g.id} variants={item} layout>
                        <GroupCard
                        group={g}
                        onClick={() => navigate(`/groups/${g.id}`, { state: { groupName: g.name } })}
                        />

                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>

                {filtered.length === 0 && (
                  <div className="mt-10 rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-6 text-center">
                    <p className="text-sm font-semibold text-zinc-900">No groups found</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Try a different search or create a new group.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => console.log("create group")}
                  className="
                    group
                    fixed md:absolute
                    right-6 bottom-6 md:right-7 md:bottom-7
                    z-50
                    rounded-2xl
                    border border-zinc-200
                    bg-white
                    shadow-lg
                    px-4 py-3
                    flex items-center gap-3
                    transition-all duration-300
                    hover:-translate-y-0.5 hover:shadow-xl
                    hover:border-yellow-300
                  "
                >
                  <span
                    className="
                      relative h-10 w-10 rounded-xl
                      bg-yellow-100
                      border border-yellow-200
                      flex items-center justify-center
                    "
                  >
                    <Plus className="h-5 w-5 text-yellow-700" />
                    <span
                      className="
                        pointer-events-none absolute inset-0
                        translate-x-[-120%] group-hover:translate-x-[120%]
                        transition-transform duration-700 ease-in-out
                        bg-[linear-gradient(90deg,transparent,rgba(250,204,21,0.18),transparent)]
                      "
                    />
                  </span>

                  <div className="text-left leading-tight">
                    <div className="text-sm font-semibold text-zinc-900">New group</div>
                    <div className="text-xs text-zinc-500">Create and invite</div>
                  </div>
                </button>
              </div>
            </motion.div>

            <footer className="mt-10 text-center text-xs text-zinc-400">
              REVE dashboard
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
