import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { UsersRound, Trash2, Sparkles, ChevronRight, Zap } from "lucide-react";

export type Group = {
  id: string;
  name: string;
  score: number;
  xp: number; // ✅ امتیاز گروه (Group Points)
};

export function GroupCard({
  group,
  onClick,
  onDelete,
  deleteDisabled,
}: {
  group: Group;
  onClick?: (g: Group) => void;
  onDelete?: (g: Group) => void;
  deleteDisabled?: boolean;
}) {
  const handleOpen = () => onClick?.(group);

  const xpCap = useMemo(() => {
    const base = 200;
    const dyn = Math.ceil((group.xp || 0) / 250) * 250;
    return Math.max(base, dyn || base);
  }, [group.xp]);

  const progress =
    xpCap > 0 ? Math.min(100, Math.round(((group.xp || 0) / xpCap) * 100)) : 0;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpen();
        }
      }}
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -6, scale: 1.012 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      className="
        group relative w-full text-left outline-none
        overflow-hidden rounded-[30px]
        border border-white/25
        p-6
        shadow-[0_18px_60px_-26px_rgba(0,0,0,0.22)]
        hover:shadow-[0_28px_90px_-40px_rgba(0,0,0,0.28)]
        focus:ring-2 focus:ring-white/50
        transition-shadow
      "
      style={{
        background:
          // 🌿 pastel lofi aurora: warm بسیار کنترل‌شده، بدون جیغ
          "radial-gradient(900px 520px at 12% 8%, rgba(255,247,232,0.88), transparent 60%)," +
          "radial-gradient(820px 520px at 92% 16%, rgba(232,246,255,0.58), transparent 56%)," +
          "radial-gradient(920px 560px at 42% 112%, rgba(244,240,255,0.62), transparent 62%)," +
          "linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,255,255,0.36))",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
      }}
    >
      {/* --- soft noise (lofi texture) --- */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.30'/%3E%3C/svg%3E\")",
        }}
      />

      {/* --- gentle glass edge ring (breathing, very subtle) --- */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[30px]"
        initial={{ opacity: 0.18 }}
        animate={{ opacity: [0.14, 0.28, 0.14] }}
        transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(0,0,0,0.03)",
        }}
      />

      {/* --- calm grid sheen (only on top-left) --- */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.26) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.26) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(circle at 18% 12%, black 0%, transparent 66%)",
          WebkitMaskImage:
            "radial-gradient(circle at 18% 12%, black 0%, transparent 66%)",
        }}
      />

      {/* --- pastel orbs (floating very gently) --- */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-28 -right-28 h-72 w-72 rounded-full blur-[120px]"
        style={{ background: "rgba(255,244,228,0.55)" }}
        animate={{ y: [0, 10, 0], x: [0, -8, 0], opacity: [0.45, 0.6, 0.45] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full blur-[140px]"
        style={{ background: "rgba(229,246,255,0.46)" }}
        animate={{ y: [0, -12, 0], x: [0, 9, 0], opacity: [0.34, 0.55, 0.34] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* --- soft highlight sweep (not flashy) --- */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
        initial={{ x: "-120%" }}
        whileHover={{ x: "120%" }}
        transition={{ duration: 1.05, ease: "easeInOut" }}
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
          transform: "skewX(-14deg)",
        }}
      />

      <div className="relative">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 truncate">
                {group.name}
              </h3>

              <motion.span
                className="
                  inline-flex items-center gap-1
                  rounded-full border border-white/35 bg-white/25
                  px-2 py-1 text-[11px] font-semibold text-zinc-700
                  backdrop-blur
                "
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                title="Soft vibe"
              >
              </motion.span>
            </div>

            <p className="mt-1 text-xs text-zinc-600 flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-zinc-500" />
              Study group
            </p>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="
                rounded-full border border-white/35 bg-white/25
                px-2.5 py-1 text-[11px] font-semibold text-zinc-700
                backdrop-blur
              "
              title={`Progress: ${progress}%`}
            >
              {progress}%
            </div>

            {onDelete && (
              <button
                type="button"
                disabled={deleteDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(group);
                }}
                className="
                  rounded-xl border border-white/35 bg-white/25
                  p-2 text-zinc-700
                  hover:bg-white/35
                  hover:border-white/50
                  hover:text-rose-600
                  transition
                  disabled:opacity-60 disabled:cursor-not-allowed
                  backdrop-blur
                "
                aria-label="Delete group"
                title="Delete group"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* stats */}
        <div className="mt-5 grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="
              relative overflow-hidden rounded-2xl
              border border-white/30 bg-white/22
              p-4 backdrop-blur
            "
          >
            <div
              className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full blur-2xl opacity-70"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(16,185,129,0.18), transparent 62%)",
              }}
            />
            <p className="text-[11px] text-zinc-600">Score</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700 tabular-nums">
              {group.score}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Today impact</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="
              relative overflow-hidden rounded-2xl
              border border-white/30 bg-white/22
              p-4 backdrop-blur
            "
          >
            <div
              className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full blur-2xl opacity-70"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.16), transparent 62%)",
              }}
            />
            <p className="text-[11px] text-zinc-600">Group Points</p>
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-zinc-900 tabular-nums">
                {group.xp}
              </p>
              <span className="text-[11px] font-semibold text-zinc-600 inline-flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" />
                pts
              </span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">Total group score</p>
          </motion.div>
        </div>

        {/* progress */}
        <div className="mt-5">


          <div className="mt-2 h-3 rounded-full overflow-hidden border border-white/35 bg-white/22">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{
                // ✅ pastel gradient: warm خیلی کم + آبی ملایم + کرم
                background:
                  "linear-gradient(90deg, rgba(244,220,186,0.95), rgba(199,230,255,0.88), rgba(242,240,255,0.92))",
                boxShadow:
                  "0 0 20px rgba(199,230,255,0.20), 0 0 28px rgba(244,220,186,0.16)",
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-end">
            <span className="text-[11px] text-zinc-600">
              steady progress ·{" "}
              <span className="font-semibold text-zinc-800">{progress}%</span>
            </span>
          </div>
        </div>

        {/* open hint */}
        <div className="mt-4 flex items-center justify-end">
          <motion.span
            className="
              inline-flex items-center gap-1
              text-xs font-semibold text-zinc-700
              opacity-80 group-hover:opacity-100
              transition-opacity
            "
            whileHover={{ x: 2 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            Open
            <ChevronRight className="h-4 w-4" />
          </motion.span>
        </div>
      </div>

      {/* corner glow (soft) */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 top-0 h-24 w-24 opacity-70"
        style={{
          background:
            "radial-gradient(circle at 100% 0%, rgba(255,255,255,0.38), transparent 62%)",
        }}
      />
    </motion.div>
  );
}
