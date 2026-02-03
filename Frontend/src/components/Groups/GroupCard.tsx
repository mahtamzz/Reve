import React, { useMemo } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { UsersRound, Trash2, ChevronRight, Zap } from "lucide-react";
import type { Variants } from "framer-motion";

const EASE_SOFT: [number, number, number, number] = [0.22, 1, 0.36, 1];

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

  // ------------------------------------------------------------
  // Soft 3D tilt (smaller range + spring smoothing)
  // ------------------------------------------------------------
  const mxRaw = useMotionValue(0);
  const myRaw = useMotionValue(0);

  const mx = useSpring(mxRaw, { stiffness: 120, damping: 22, mass: 1.1 });
  const my = useSpring(myRaw, { stiffness: 120, damping: 22, mass: 1.1 });

  // smaller tilt = calmer
  const rX = useTransform(my, [-0.5, 0.5], [6, -6]);
  const rY = useTransform(mx, [-0.5, 0.5], [-8, 8]);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    mxRaw.set(clamp(px, -0.5, 0.5));
    myRaw.set(clamp(py, -0.5, 0.5));
  };

  const onLeave = () => {
    mxRaw.set(0);
    myRaw.set(0);
  };

  // ------------------------------------------------------------
  // Variants (gentle entrance)
  // ------------------------------------------------------------
  const container: Variants = {
    hidden: { opacity: 0, y: 14, scale: 0.985 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.72,
        ease: EASE_SOFT,
        staggerChildren: 0.09,
        delayChildren: 0.04,
      },
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.56, ease: EASE_SOFT },
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
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      whileHover={{ y: -3 }} // calmer
      whileTap={{ scale: 0.993 }}
      transition={{
        duration: 0.55,
        ease: EASE_SOFT,
      }}
      className="
        group relative w-full text-left outline-none
        overflow-hidden rounded-[30px]
        border border-zinc-200/70
        p-6
        shadow-[0_18px_60px_-35px_rgba(0,0,0,0.22)]
        hover:shadow-[0_30px_95px_-52px_rgba(0,0,0,0.30)]
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
        className="pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.30'/%3E%3C/svg%3E\")",
        }}
      />

      {/* breathing ring (slow & subtle) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[30px]"
        initial={{ opacity: 0.18 }}
        animate={{ opacity: [0.14, 0.24, 0.14] }}
        transition={{ duration: 6.8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
        }}
      />

      {/* gentle aurora drift (slower + lower opacity) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-20 blur-3xl opacity-[0.22]"
        animate={{ x: [0, 16, -8, 0], y: [0, -9, 12, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "conic-gradient(from 220deg at 50% 50%, rgba(253,224,71,0.12), rgba(210,245,255,0.26), rgba(225,215,255,0.26), rgba(210,255,232,0.22), rgba(253,224,71,0.12))",
        }}
      />

      {/* hover sweep (slower + softer) */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100"
        initial={{ x: "-140%" }}
        whileHover={{ x: "140%" }}
        transition={{ duration: 1.75, ease: "easeInOut" }}
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
          transform: "skewX(-14deg)",
        }}
      />

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

            <p className="mt-1 text-sm text-zinc-600">Tap to open details & members</p>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2 shrink-0">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.99 }}
              transition={{ duration: 0.35, ease: EASE_SOFT }}
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
                whileHover={{ scale: 1.035, rotate: -1 }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.35, ease: EASE_SOFT }}
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
              "linear-gradient(90deg, transparent, rgba(250,204,21,0.32), rgba(228,228,231,0.7), transparent)",
          }}
        />

        {/* stats */}
        <motion.div variants={item} className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ y: -2 }}
            transition={{ duration: 0.38, ease: EASE_SOFT }}
            className="
              relative overflow-hidden rounded-3xl
              border border-zinc-200/70 bg-white/55
              p-4 backdrop-blur
            "
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full blur-2xl"
              animate={{ scale: [1, 1.06, 1], opacity: [0.38, 0.6, 0.38] }}
              transition={{ duration: 7.2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(34,197,94,0.14), transparent 62%)",
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
            transition={{ duration: 0.38, ease: EASE_SOFT }}
            className="
              relative overflow-hidden rounded-3xl
              border border-zinc-200/70 bg-white/55
              p-4 backdrop-blur
            "
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full blur-2xl"
              animate={{ scale: [1, 1.07, 1], opacity: [0.34, 0.6, 0.34] }}
              transition={{ duration: 7.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, rgba(59,130,246,0.13), transparent 62%)",
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
              transition={{
                type: "spring",
                stiffness: 65,
                damping: 24,
                mass: 1.15,
              }}
              className="relative h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(253,224,71,0.52), rgba(195,232,255,0.85), rgba(224,214,255,0.88), rgba(199,255,226,0.78))",
                boxShadow:
                  "0 0 18px rgba(253,224,71,0.12), 0 0 26px rgba(195,232,255,0.16)",
              }}
            >
              {/* shimmer (slower, softer) */}
              <motion.span
                aria-hidden
                className="absolute inset-0"
                animate={{ x: ["-70%", "130%"] }}
                transition={{ duration: 2.35, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
                  transform: "skewX(-18deg)",
                  opacity: 0.85,
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
            whileHover={{ x: 2 }}
            transition={{ duration: 0.32, ease: EASE_SOFT }}
          >
            Open
            <ChevronRight className="h-4 w-4" />
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  );
}
