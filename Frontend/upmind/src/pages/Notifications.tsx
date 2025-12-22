import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import { logout } from "@/utils/authToken";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Thread = {
  id: string;
  name: string;
  last: string;
  time: string;
  unread?: number;
};

export default function Notifications() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  // Example threads (replace later with API data)
  const threads: Thread[] = useMemo(
    () => [
      {
        id: "1",
        name: "Group Chat",
        last: "The latest message will appear here…",
        time: "12:03",
        unread: 2,
      },
      {
        id: "2",
        name: "Project Team",
        last: "Tomorrow's meeting is at 10 AM.",
        time: "11:22",
      },
      {
        id: "3",
        name: "Study Buddies",
        last: "Did you read Chapter 3?",
        time: "09:10",
        unread: 5,
      },
      {
        id: "4",
        name: "Design Review",
        last: "I uploaded the new file.",
        time: "Yesterday",
      },
    ],
    []
  );

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return threads;
    return threads.filter(
      (t) =>
        t.name.toLowerCase().includes(s) || t.last.toLowerCase().includes(s)
    );
  }, [query, threads]);

  return (
    <div className="h-screen overflow-hidden bg-creamtext text-zinc-900">
      <div className="flex h-full">
        <Sidebar activeKey="groups" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64 flex flex-col h-full">
          <Topbar username="User" />

          <div className="flex-1 min-h-0 w-full px-4 py-4">
            <div className="max-w-4xl mx-auto h-full min-h-0">
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className="
                  h-full min-h-0 flex flex-col overflow-hidden
                  rounded-3xl border border-zinc-200
                  bg-white/80 backdrop-blur shadow-sm
                "
              >
                {/* Header */}
                <div className="shrink-0 p-4 border-b border-zinc-200 bg-white/70">
                  <p className="text-sm font-semibold text-zinc-900">
                    Group Chats
                  </p>

                  <div className="mt-3 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2">
                    <Search className="h-4 w-4 text-zinc-400" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search…"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                    />
                  </div>
                </div>

                {/* List (scroll) */}
                <div className="flex-1 min-h-0 overflow-y-auto p-2">
                  {filtered.map((t) => (
                    <button
                      key={t.id}
                      className="
                        w-full text-left
                        flex items-center gap-3
                        rounded-2xl px-3 py-3
                        transition hover:bg-zinc-50
                      "
                      onClick={() =>
                        navigate(`/groups/${t.id}/chat`, {
                          state: { groupName: t.name },
                        })
                      }
                    >
                      <div className="h-10 w-10 rounded-2xl bg-zinc-100 border border-zinc-200 grid place-items-center text-xs font-bold text-zinc-600">
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            {t.name}
                          </p>
                          <span className="text-[11px] text-zinc-500">
                            {t.time}
                          </span>
                        </div>
                        <p className="truncate text-xs text-zinc-500 mt-0.5">
                          {t.last}
                        </p>
                      </div>

                      {t.unread ? (
                        <span className="min-w-[24px] h-6 px-2 rounded-full bg-yellow-400 text-white text-[11px] font-bold grid place-items-center">
                          {t.unread}
                        </span>
                      ) : null}
                    </button>
                  ))}

                  {!filtered.length ? (
                    <div className="p-6 text-center text-sm text-zinc-500">
                      No results found.
                    </div>
                  ) : null}
                </div>
              </motion.section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
