// src/pages/Notifications.tsx
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Clock,
  Loader2,
  Search,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import { logout } from "@/utils/authToken";

import { useJoinRequestNotifications } from "@/hooks/useJoinRequestNotifications";
import {
  useApproveJoinRequestAction,
  useRejectJoinRequestAction,
} from "@/hooks/useJoinRequestActions";

import { useChatInbox } from "@/hooks/useChatInbox"; // ✅ NEW (connects Group chats to backend)

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

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
  const [query, setQuery] = useState("");

  // ✅ Join Requests
  const joinNotif = useJoinRequestNotifications(15_000, 20);
  const approveMut = useApproveJoinRequestAction();
  const rejectMut = useRejectJoinRequestAction();

  const [actionByKey, setActionByKey] = useState<ActionMap>({});
  const [dismissedKeys, setDismissedKeys] = useState<Record<string, boolean>>(
    {}
  );

  const keyOf = (it: any) => `${it.groupId}-${it.uid}-${it.createdAt}`;

  const setItemState = (key: string, patch: ActionMap[string]) => {
    setActionByKey((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const dismissItemSoon = (key: string, ms = 800) => {
    window.setTimeout(() => {
      setDismissedKeys((prev) => ({ ...prev, [key]: true }));
    }, ms);
  };

  // ✅ Group chats inbox (real backend)
  const inbox = useChatInbox(15_000);

  const filteredInbox = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return inbox.items;

    return inbox.items.filter((it) => {
      const name = (it.group?.name ?? "").toLowerCase();
      const last = (it.latestMessage?.text ?? "").toLowerCase();
      return name.includes(s) || last.includes(s);
    });
  }, [query, inbox.items]);

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
                  {/* ✅ Join Requests */}
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
                              const isPending =
                                st === "approving" || st === "rejecting";
                              const didSucceed = st === "success";
                              const didFail = st === "error";
                              const kind = actionByKey[k]?.kind;

                              return (
                                <motion.div
                                  key={k}
                                  initial={{ opacity: 0, y: 6, scale: 0.99 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                                  transition={{
                                    duration: 0.18,
                                    ease: EASE_OUT,
                                  }}
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
                                      Group:{" "}
                                      <span className="font-semibold">
                                        {it.groupName}
                                      </span>
                                    </p>

                                    <div
                                      className="mt-1.5 flex items-center gap-2"
                                      aria-live="polite"
                                    >
                                      {isPending ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-600">
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          {st === "approving"
                                            ? "Approving…"
                                            : "Rejecting…"}
                                        </span>
                                      ) : didSucceed ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700">
                                          <Check className="h-3.5 w-3.5" />
                                          {kind === "approve"
                                            ? "Approved"
                                            : "Rejected"}
                                        </span>
                                      ) : didFail ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700">
                                          <AlertTriangle className="h-3.5 w-3.5" />
                                          {actionByKey[k]?.message ??
                                            "Failed. Try again."}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>

                                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                                    <Clock className="h-3 w-3" />
                                    {formatWhen(it.createdAt)}
                                  </span>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={isPending || didSucceed}
                                      onClick={async () => {
                                        setItemState(k, {
                                          state: "approving",
                                          message: undefined,
                                          kind: "approve",
                                        });
                                        try {
                                          await approveMut.mutateAsync({
                                            groupId: it.groupId,
                                            userId: it.uid,
                                          });
                                          setItemState(k, {
                                            state: "success",
                                            message: undefined,
                                            kind: "approve",
                                          });
                                          dismissItemSoon(k, 800);
                                        } catch (e: any) {
                                          setItemState(k, {
                                            state: "error",
                                            kind: "approve",
                                            message: e?.message
                                              ? String(e.message)
                                              : "Approve failed.",
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
                                      {st === "approving"
                                        ? "Approving"
                                        : "Approve"}
                                    </button>

                                    <button
                                      type="button"
                                      disabled={isPending || didSucceed}
                                      onClick={async () => {
                                        setItemState(k, {
                                          state: "rejecting",
                                          message: undefined,
                                          kind: "reject",
                                        });
                                        try {
                                          await rejectMut.mutateAsync({
                                            groupId: it.groupId,
                                            userId: it.uid,
                                          });
                                          setItemState(k, {
                                            state: "success",
                                            message: undefined,
                                            kind: "reject",
                                          });
                                          dismissItemSoon(k, 800);
                                        } catch (e: any) {
                                          setItemState(k, {
                                            state: "error",
                                            kind: "reject",
                                            message: e?.message
                                              ? String(e.message)
                                              : "Reject failed.",
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
                                      {st === "rejecting"
                                        ? "Rejecting"
                                        : "Reject"}
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                        </AnimatePresence>
                      )}
                    </div>

                    {joinNotif.loading ? (
                      <div className="mt-2 px-1 text-xs text-zinc-500">
                        Updating…
                      </div>
                    ) : null}
                  </div>

                  {/* ✅ Group chats (REAL) */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between px-1">
                      <p className="text-sm font-semibold text-zinc-900">
                        Group chats
                      </p>
                      <span className="text-xs text-zinc-500">
                        {inbox.loading ? "Loading…" : `${inbox.count}`}
                      </span>
                    </div>

                    <div className="mt-2">
                      {inbox.error ? (
                        <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-sm text-red-700">
                          {inbox.error}
                        </div>
                      ) : inbox.loading ? (
                        <div className="p-4 text-sm text-zinc-500">
                          Loading chats…
                        </div>
                      ) : (
                        <>
                          {filteredInbox.map((it) => {
                            const hasMsg = !!it.latestMessage;
                            const lastText = hasMsg
                              ? it.latestMessage!.text
                              : "No messages yet.";
                            const timeText = hasMsg
                              ? formatWhen(it.latestMessage!.createdAt)
                              : "—";

                            return (
                              <button
                                key={it.group.id}
                                className="
                                  w-full text-left
                                  flex items-center gap-3
                                  rounded-2xl px-3 py-3
                                  transition hover:bg-zinc-50
                                "
                                onClick={() =>
                                  navigate(`/groups/${it.group.id}/chat`, {
                                    state: { groupName: it.group.name },
                                  })
                                }
                                type="button"
                              >
                                <div className="h-10 w-10 rounded-2xl bg-zinc-100 border border-zinc-200 grid place-items-center text-xs font-bold text-zinc-600">
                                  {(it.group.name || "G")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-semibold text-zinc-900">
                                      {it.group.name}
                                    </p>
                                    <span className="text-[11px] text-zinc-500">
                                      {timeText}
                                    </span>
                                  </div>
                                  <p className="truncate text-xs text-zinc-500 mt-0.5">
                                    {lastText}
                                  </p>
                                </div>
                              </button>
                            );
                          })}

                          {!filteredInbox.length ? (
                            <div className="p-6 text-center text-sm text-zinc-500">
                              No results found.
                            </div>
                          ) : null}
                        </>
                      )}
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
