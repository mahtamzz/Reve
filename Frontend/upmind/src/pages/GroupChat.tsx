import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Smile,
  Users,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
} from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import { logout } from "@/utils/authToken";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Message = {
  id: string;
  user: string;
  avatar?: string;
  text: string;
  mine?: boolean;
  time: string;
};

export default function GroupChat() {
  const { groupId } = useParams<{ groupId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const groupName =
    (location.state as { groupName?: string } | null)?.groupName ?? "Group Chat";

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      user: "nafas",
      text: "Hey everyone 👋 Ready to study?",
      time: "09:30",
    },
    {
      id: "2",
      user: "me",
      text: "Yes! Let’s start with math 📚",
      mine: true,
      time: "09:31",
    },
  ]);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        user: "me",
        text: input.trim(),
        mine: true,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setInput("");
  };

  return (
    <div className="h-screen overflow-hidden bg-creamtext text-zinc-900">
      <div className="flex h-full">
        <Sidebar activeKey="groups" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64 flex flex-col h-full">
          <Topbar username="User" />

          <div className="flex-1 min-h-0 w-full px-4 py-4">
            <div className="max-w-7xl mx-auto h-full min-h-0">
              {/* ✅ فقط چت + پنل اطلاعات گروه */}
              <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
                {/* Center panel (chat) */}
                <motion.section
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="
                    min-h-0 flex flex-col overflow-hidden
                    rounded-3xl border border-zinc-200
                    bg-white/80 backdrop-blur shadow-sm
                  "
                >
                  {/* Header */}
                  <div className="shrink-0 px-4 py-3 border-b border-zinc-200 bg-white/70">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* ✅ برگشت به لیست گروه‌ها */}
                        <button
                          onClick={() => navigate("/notifications")}
                          className="
                            rounded-xl border border-zinc-200 bg-white
                            p-2 text-zinc-600
                            hover:border-yellow-300 hover:text-zinc-900
                            transition-colors
                          "
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            {groupName}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            Group · {groupId}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-zinc-500">
                        <button className="rounded-xl p-2 hover:bg-zinc-50 transition">
                          <Phone className="h-4 w-4" />
                        </button>
                        <button className="rounded-xl p-2 hover:bg-zinc-50 transition">
                          <Video className="h-4 w-4" />
                        </button>
                        <button className="rounded-xl p-2 hover:bg-zinc-50 transition">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages scroller */}
                  <div
                    className="
                      flex-1 min-h-0 overflow-y-auto
                      bg-[radial-gradient(circle_at_20%_10%,rgba(250,204,21,0.12),transparent_40%),radial-gradient(circle_at_80%_90%,rgba(14,165,233,0.08),transparent_45%),linear-gradient(to_bottom,#ffffff,#fafafa)]
                      px-4 py-4
                    "
                  >
                    <div className="min-h-full flex flex-col justify-end">
                      <AnimatePresence initial={false}>
                        {messages.map((m) => (
                          <motion.div
                            key={m.id}
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className={`mb-3 flex ${
                              m.mine ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`
                                max-w-[78%] rounded-3xl px-4 py-2
                                text-sm shadow-sm break-words
                                ${
                                  m.mine
                                    ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white"
                                    : "bg-zinc-100 text-zinc-900"
                                }
                              `}
                            >
                              {!m.mine && (
                                <p className="mb-0.5 text-[11px] font-semibold opacity-70">
                                  {m.user}
                                </p>
                              )}
                              <p>{m.text}</p>
                              <p className="mt-1 text-[10px] opacity-70 text-right">
                                {m.time}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <div ref={bottomRef} />
                    </div>
                  </div>

                  {/* Input */}
                  <div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button className="text-zinc-400 hover:text-zinc-600 transition">
                        <Smile className="h-5 w-5" />
                      </button>

                      <button className="text-zinc-400 hover:text-zinc-600 transition">
                        <Paperclip className="h-5 w-5" />
                      </button>

                      <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type a message…"
                        className="
                          flex-1 bg-transparent outline-none
                          text-sm placeholder:text-zinc-400
                        "
                      />

                      <button
                        onClick={sendMessage}
                        className="
                          rounded-xl bg-yellow-400 p-2
                          text-white hover:bg-yellow-500
                          transition-colors
                        "
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.section>

                {/* Right panel (info) */}
                <motion.aside
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                  className="
                    hidden lg:flex min-h-0 flex-col
                    rounded-3xl border border-zinc-200 bg-white/80 backdrop-blur
                    shadow-sm overflow-hidden
                  "
                >
                  <div className="p-4 border-b border-zinc-200">
                    <p className="text-sm font-semibold text-zinc-900">
                      {groupName}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      Members · Online
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-zinc-600">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-semibold">Team</span>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                      <p className="text-xs font-semibold text-zinc-700">
                        About
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                        Working together, sharing ideas and communicating
                        effectively.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                      <p className="text-xs font-semibold text-zinc-700">
                        Shared files
                      </p>
                      <div className="mt-2 space-y-2">
                        {["terms_of_reference.docx", "contract.xlsx", "logo.svg"].map(
                          (f) => (
                            <div
                              key={f}
                              className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2"
                            >
                              <span className="text-xs text-zinc-600 truncate">
                                {f}
                              </span>
                              <button className="text-xs font-semibold text-yellow-600 hover:text-yellow-700">
                                View
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </motion.aside>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
