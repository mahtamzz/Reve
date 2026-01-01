import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Sparkles, Clock, UserPlus } from "lucide-react";

import type { ApiJoinRequest } from "@/api/types";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const diff = Date.now() - t;
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function SkeletonRow({ i }: { i: number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 overflow-hidden">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-zinc-100 animate-pulse" />
        <div className="flex-1">
          <div className="h-3 w-44 bg-zinc-100 rounded animate-pulse" />
          <div className="mt-2 h-2 w-28 bg-zinc-100 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-xl bg-zinc-100 animate-pulse" />
          <div className="h-9 w-24 rounded-xl bg-zinc-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function JoinRequestsPanel({
  requests,
  loading,
  error,
  onApprove,
  onReject,
  busyUserId,
}: {
  requests: ApiJoinRequest[];
  loading: boolean;
  error: boolean;
  onApprove: (uid: string | number) => void;
  onReject: (uid: string | number) => void;
  busyUserId?: string | number | null;
}) {
  const count = requests?.length ?? 0;

  const sorted = useMemo(() => {
    const r = [...(requests || [])];
    r.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return r;
  }, [requests]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="relative rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm overflow-hidden"
    >
      {/* glow blobs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-yellow-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-amber-100/50 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2">
            <span className="h-9 w-9 rounded-2xl border border-zinc-200 bg-[#FFFBF2] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-amber-700" />
            </span>
            <div>
              <p className="text-sm font-semibold text-zinc-900">Join Requests</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Approve or reject new members. Changes apply instantly.
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-700">
          <UserPlus className="h-4 w-4" />
          <span>{count} pending</span>
        </div>
      </div>

      <div className="relative mt-5">
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRow key={i} i={i} />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Failed to load join requests.
          </div>
        ) : count === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="rounded-3xl border border-zinc-200 bg-[#FFFBF2] p-6"
          >
            <p className="text-sm font-semibold text-zinc-900">All clear ✨</p>
            <p className="mt-1 text-sm text-zinc-600">
              No one is waiting right now. You’ll see requests here instantly.
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {sorted.map((r) => {
                const uid = r.uid;
                const busy = busyUserId != null && String(busyUserId) === String(uid);

                return (
                  <motion.div
                    key={`${r.group_id}-${uid}`}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="
                      group relative overflow-hidden
                      rounded-2xl border border-zinc-200 bg-white p-4
                      shadow-sm
                    "
                  >
                    {/* shimmer line */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition">
                      <div className="absolute -left-20 top-0 h-full w-24 bg-[linear-gradient(90deg,transparent,rgba(250,204,21,0.18),transparent)] rotate-12 animate-[shine_1.2s_ease-in-out_infinite]" />
                    </div>

                    <div className="relative flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl border border-zinc-200 bg-zinc-50 flex items-center justify-center">
                        <UserPlus className="h-4 w-4 text-zinc-700" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-900 truncate">
                          User #{String(uid)}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500 inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {timeAgo(r.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => onReject(uid)}
                          disabled={busy}
                          className="
                            rounded-xl border border-zinc-200 bg-white
                            px-3 py-2 text-xs font-semibold text-zinc-700
                            hover:border-rose-300 hover:text-rose-700
                            transition
                            disabled:opacity-60 disabled:cursor-not-allowed
                            inline-flex items-center gap-2
                          "
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => onApprove(uid)}
                          disabled={busy}
                          className="
                            rounded-xl border border-emerald-200 bg-emerald-50
                            px-3 py-2 text-xs font-semibold text-emerald-800
                            hover:bg-emerald-100 hover:border-emerald-300
                            transition
                            disabled:opacity-60 disabled:cursor-not-allowed
                            inline-flex items-center gap-2
                          "
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* keyframes (Tailwind doesn't ship this exact) */}
      <style>{`
        @keyframes shine {
          0% { transform: translateX(-120%) rotate(12deg); opacity: 0; }
          30% { opacity: 1; }
          100% { transform: translateX(320%) rotate(12deg); opacity: 0; }
        }
      `}</style>
    </motion.div>
  );
}
