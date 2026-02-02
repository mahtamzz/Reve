// src/pages/Notifications.tsx
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, Clock, Check, X, Loader2, AlertTriangle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import { logout } from "@/utils/authToken";
import { useJoinRequestNotifications } from "@/hooks/useJoinRequestNotifications";
import {
  useApproveJoinRequestAction,
  useRejectJoinRequestAction,
} from "@/hooks/useJoinRequestActions";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

type Thread = {
  id: string;
  name: string;
  last: string;
  time: string;
  unread?: number;
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  const t = d.getTime();
  if (!Number.isFinite(t)) return "";
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const day = Math.floor(h / 24);
  return `${day}d`;
}

type ReqAction = "idle" | "approving" | "rejecting" | "success" | "error";
type ActionMap = Record<
  string,
  { state: ReqAction; message?: string; kind?: "approve" | "reject" }
>;

export default function Notifications() {
  const navigate = useNavigate();
  const location = useLocation();
  const focus = (location.state as any)?.focus ?? null;

  const [query, setQuery] = useState("");

  const joinNotif = useJoinRequestNotifications(15_000, 20);

  const approveMut = useApproveJoinRequestAction();
  const rejectMut = useRejectJoinRequestAction();

  const [actionByKey, setActionByKey] = useState<ActionMap>({});
  const [dismissedKeys, setDismissedKeys] = useState<Record<string, boolean>>({});

  const keyOf = (it: any) => `${it.groupId}-${it.uid}-${it.createdAt}`;

  const setItemState = (key: string, patch: ActionMap[string]) => {
    setActionByKey((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const dismissItemSoon = (key: string, ms = 800) => {
    window.setTimeout(() => {
      setDismissedKeys((prev) => ({ ...prev, [key]: true }));
    }, ms);
  };

  // Example threads (replace later with API data)
  const threads: Thread[] = useMemo(
    () => [
      { id: "1", name: "Group Chat", last: "The latest message will appear here…", time: "12:03", unread: 2 },
      { id: "2", name: "Project Team", last: "Tomorrow's meeting is at 10 AM.", time: "11:22" },
      { id: "3", name: "Study Buddies", last: "Did you read Chapter 3?", time: "09:10", unread: 5 },
      { id: "4", name: "Design Review", last: "I uploaded the new file.", time: "Yesterday" },
    ],
    []
  );

  const filteredThreads = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return threads;
    return threads.filter(
      (t) => t.name.toLowerCase().includes(s) || t.last.toLowerCase().includes(s)
    );
  }, [query, threads]);

  return (
    <div className="h-screen overflow-hidden bg-creamtext text-zinc-900">
      <div className="flex h-full">
        <Sidebar activeKey="notifications" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64 flex flex-col h-full">
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
                    Notifications
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

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3">
                  {/* ✅ Join Requests section */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-sm font-semibold text-zinc-900">
                        Join requests
                      </p>
                      <span className="text-xs text-zinc-500">
                        {joinNotif.loading ? "Loading…" : `${joinNotif.count}`}
                      </span>
                    </div>

                    <div className="mt-2 rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-2">
                      {joinNotif.error ? (
                        <div className="p-4 text-sm text-red-600">
                          {joinNotif.error}
                        </div>
                      ) : joinNotif.count === 0 && !joinNotif.loading ? (
                        <div className="p-4 text-sm text-zinc-600">
                          No new requests.
                        </div>
                      ) : (
                        <AnimatePresence initial={false}>
                          {joinNotif.items
                            .filter((it) => !dismissedKeys[keyOf(it)])
                            .map((it) => {
                              const k = keyOf(it);
                              const st = actionByKey[k]?.state ?? "idle";
                              const isPending = st === "approving" || st === "rejecting";
                              const didSucceed = st === "success";
                              const didFail = st === "error";
                              const kind = actionByKey[k]?.kind;

                              return (
                                <motion.div
                                  key={k}
                                  initial={{ opacity: 0, y: 6, scale: 0.99 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                  transition={{ duration: 0.18, ease: EASE_OUT }}
                                  className="
                                    w-full
                                    flex items-center gap-3
                                    rounded-2xl px-3 py-3
                                    bg-white border border-zinc-200
                                    hover:border-yellow-300 hover:bg-yellow-50/40 transition
                                    mb-2 last:mb-0
                                  "
                                >
                                  <div className="h-10 w-10 rounded-2xl bg-[#FFFBF2] border border-zinc-200 grid place-items-center">
                                    <Users className="h-4 w-4 text-zinc-700" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-zinc-900">
                                      User #{it.uid} wants to join
                                    </p>
                                    <p className="truncate text-xs text-zinc-600 mt-0.5">
                                      Group: <span className="font-semibold">{it.groupName}</span>
                                    </p>

                                    {/* ✅ inline feedback row */}
                                    <div className="mt-1.5 flex items-center gap-2" aria-live="polite">
                                      {isPending ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600">
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          {st === "approving" ? "Approving…" : "Rejecting…"}
                                        </span>
                                      ) : didSucceed ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700">
                                          <Check className="h-3.5 w-3.5" />
                                          {kind === "approve" ? "Approved" : "Rejected"}
                                        </span>
                                      ) : didFail ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700">
                                          <AlertTriangle className="h-3.5 w-3.5" />
                                          {actionByKey[k]?.message ?? "Failed. Try again."}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>

                                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                                    <Clock className="h-3 w-3" />
                                    {formatWhen(it.createdAt)}
                                  </span>

                                  {/* ✅ actions */}
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={isPending || didSucceed}
                                      onClick={async () => {
                                        setItemState(k, { state: "approving", message: undefined, kind: "approve" });
                                        try {
                                          await approveMut.mutateAsync({ groupId: it.groupId, userId: it.uid });
                                          setItemState(k, { state: "success", message: undefined, kind: "approve" });
                                          dismissItemSoon(k, 800);
                                        } catch (e: any) {
                                          setItemState(k, {
                                            state: "error",
                                            kind: "approve",
                                            message: e?.message ? String(e.message) : "Approve failed.",
                                          });
                                        }
                                      }}
                                      className="
                                        inline-flex items-center gap-1
                                        rounded-xl px-3 py-2 text-xs font-semibold
                                        border border-green-200 bg-green-50 text-green-700
                                        hover:bg-green-100 hover:border-green-300
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                      "
                                    >
                                      {st === "approving" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Check className="h-4 w-4" />
                                      )}
                                      {st === "approving" ? "Approving" : "Approve"}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isPending || didSucceed}
                                      onClick={async () => {
                                        setItemState(k, { state: "rejecting", message: undefined, kind: "reject" });
                                        try {
                                          await rejectMut.mutateAsync({ groupId: it.groupId, userId: it.uid });
                                          setItemState(k, { state: "success", message: undefined, kind: "reject" });
                                          dismissItemSoon(k, 800);
                                        } catch (e: any) {
                                          setItemState(k, {
                                            state: "error",
                                            kind: "reject",
                                            message: e?.message ? String(e.message) : "Reject failed.",
                                          });
                                        }
                                      }}
                                      className="
                                        inline-flex items-center gap-1
                                        rounded-xl px-3 py-2 text-xs font-semibold
                                        border border-red-200 bg-red-50 text-red-700
                                        hover:bg-red-100 hover:border-red-300
                                        disabled:opacity-50 disabled:cursor-not-allowed
                                      "
                                    >
                                      {st === "rejecting" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <X className="h-4 w-4" />
                                      )}
                                      {st === "rejecting" ? "Rejecting" : "Reject"}
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                        </AnimatePresence>
                      )}
                    </div>

                    {joinNotif.loading ? (
                      <div className="mt-2 px-1 text-xs text-zinc-500">Updating…</div>
                    ) : null}
                  </div>

                  {/* Existing list (threads) */}
                  <div className="mt-2">
                    <p className="px-1 text-sm font-semibold text-zinc-900">Group chats</p>
                    <div className="mt-2">
                      {filteredThreads.map((t) => (
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

                      {!filteredThreads.length ? (
                        <div className="p-6 text-center text-sm text-zinc-500">
                          No results found.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </motion.section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
