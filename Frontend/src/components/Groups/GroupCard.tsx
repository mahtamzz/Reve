import React, { useMemo } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { UsersRound, Trash2, ChevronRight, Zap, Sparkles } from "lucide-react";
import type { Variants } from "framer-motion";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];


export type Group = {
  id: string;
  name: string;
  score: number;
  xp: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

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

  // 3D tilt (match with clean dashboard feel; subtle)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rX = useTransform(my, [-0.5, 0.5], [9, -9]);
  const rY = useTransform(mx, [-0.5, 0.5], [-11, 11]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    mx.set(clamp(px, -0.5, 0.5));
    my.set(clamp(py, -0.5, 0.5));
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  const container: Variants = {
    hidden: { opacity: 0, y: 12, scale: 0.99 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.42, ease: EASE_OUT, staggerChildren: 0.06 },
    },
  };
  
  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.38, ease: EASE_OUT },
    },
  };
  

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
      variants={container}
      initial="hidden"
      animate="show"
      whileHover={{ y: -7 }}
      whileTap={{ scale: 0.992 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="
        group relative w-full text-left outline-none
        overflow-hidden rounded-[30px]
        border border-zinc-200/70
        p-6
        shadow-[0_18px_60px_-35px_rgba(0,0,0,0.25)]
        hover:shadow-[0_34px_110px_-52px_rgba(0,0,0,0.34)]
        focus:ring-2 focus:ring-yellow-300/60
        transition-shadow
        will-change-transform
      "
      style={{
        transformStyle: "preserve-3d",
        rotateX: rX as any,
        rotateY: rY as any,
        background:
        "radial-gradient(900px 520px at 12% 10%, rgba(255,228,210,0.85), transparent 62%)," +
        "radial-gradient(860px 520px at 88% 14%, rgba(238,225,255,0.72), transparent 58%)," +
        "radial-gradient(720px 520px at 82% 92%, rgba(255,244,200,0.55), transparent 58%)," +
        "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.54))",      
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      {/* soft noise */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.30'/%3E%3C/svg%3E\")",
        }}
      />

      {/* breathing ring */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[30px]"
        initial={{ opacity: 0.22 }}
        animate={{ opacity: [0.16, 0.32, 0.16] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          border: "1px solid rgba(255,255,255,0.24)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
        }}
      />

      {/* gentle aurora drift */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-20 blur-3xl opacity-[0.28]"
        animate={{ x: [0, 22, -10, 0], y: [0, -12, 16, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "conic-gradient(from 220deg at 50% 50%, rgba(253,224,71,0.14), rgba(210,245,255,0.30), rgba(225,215,255,0.30), rgba(210,255,232,0.26), rgba(253,224,71,0.14))",
        }}
      />

      {/* hover sweep */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
        initial={{ x: "-130%" }}
        whileHover={{ x: "130%" }}
        transition={{ duration: 1.05, ease: "easeInOut" }}
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
          transform: "skewX(-14deg)",
        }}
      />

      {/* mini badge (matches search dropdown vibe) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute right-5 top-5"
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >

      </motion.div>

      <div className="relative" style={{ transform: "translateZ(1px)" }}>
        {/* header */}
        <motion.div variants={item} className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 truncate">
                {group.name}
              </h3>
              <span
                className="
                  inline-flex items-center gap-1
                  rounded-full border border-zinc-200/80 bg-white/55
                  px-2 py-1 text-[11px] font-semibold text-zinc-700
                  backdrop-blur
                "
                title="Study group"
              >
                <UsersRound className="h-3.5 w-3.5 text-zinc-600" />
                Group
              </span>
            </div>

            <p className="mt-1 text-sm text-zinc-600">
              Tap to open details & members
            </p>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="
                rounded-full border border-zinc-200/80 bg-white/55
                px-2.5 py-1 text-[11px] font-semibold text-zinc-700
                backdrop-blur
              "
              title={`Progress: ${progress}%`}
            >
              {progress}%
            </motion.div>

            {onDelete && (
              <motion.button
                type="button"
                disabled={deleteDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(group);
                }}
                whileHover={{ scale: 1.06, rotate: -2 }}
                whileTap={{ scale: 0.97 }}
                className="
                  rounded-2xl border border-zinc-200/80 bg-white/55
                  p-2 text-zinc-700
                  hover:bg-white/70 hover:border-yellow-300/70
                  hover:text-rose-600
                  transition
                  disabled:opacity-60 disabled:cursor-not-allowed
                  backdrop-blur
                "
                aria-label="Delete group"
                title="Delete group"
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* divider */}
        <motion.div
          variants={item}
          className="my-5 h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(250,204,21,0.35), rgba(228,228,231,0.7), transparent)",
          }}
        />

        {/* stats */}
        <motion.div variants={item} className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="
              relative overflow-hidden rounded-3xl
              border border-zinc-200/70 bg-white/55
              p-4 backdrop-blur
            "
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full blur-2xl"
              animate={{ scale: [1, 1.08, 1], opacity: [0.45, 0.72, 0.45] }}
              transition={{ duration: 5.6, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(34,197,94,0.16), transparent 62%)",
              }}
            />
            <p className="text-[11px] text-zinc-600">Score</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700 tabular-nums">
              {group.score}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">Today impact</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="
              relative overflow-hidden rounded-3xl
              border border-zinc-200/70 bg-white/55
              p-4 backdrop-blur
            "
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full blur-2xl"
              animate={{ scale: [1, 1.09, 1], opacity: [0.42, 0.74, 0.42] }}
              transition={{ duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.14), transparent 62%)",
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
        </motion.div>

        {/* progress */}
        <motion.div variants={item} className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-700">
              Progress to next cap
            </span>
            <span className="text-[11px] text-zinc-600">
              {group.xp} / {xpCap}
            </span>
          </div>

          <div className="mt-2 h-3.5 rounded-full overflow-hidden border border-zinc-200/70 bg-white/45">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 110, damping: 18 }}
              className="relative h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(253,224,71,0.55), rgba(195,232,255,0.88), rgba(224,214,255,0.90), rgba(199,255,226,0.82))",
                boxShadow:
                  "0 0 18px rgba(253,224,71,0.14), 0 0 26px rgba(195,232,255,0.18)",
              }}
            >
              {/* shimmer */}
              <motion.span
                aria-hidden
                className="absolute inset-0"
                animate={{ x: ["-60%", "120%"] }}
                transition={{ duration: 1.55, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.34), transparent)",
                  transform: "skewX(-18deg)",
                  opacity: 0.9,
                }}
              />
            </motion.div>
          </div>

          <div className="mt-2 flex items-center justify-end">
            <span className="text-[11px] text-zinc-600">
              steady progress ·{" "}
              <span className="font-semibold text-zinc-800">{progress}%</span>
            </span>
          </div>
        </motion.div>

        {/* open hint */}
        <motion.div variants={item} className="mt-4 flex items-center justify-end">
          <motion.span
            className="
              inline-flex items-center gap-1
              text-xs font-semibold text-zinc-700
              opacity-80 group-hover:opacity-100
              transition-opacity
            "
            whileHover={{ x: 3 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            Open
            <ChevronRight className="h-4 w-4" />
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}
