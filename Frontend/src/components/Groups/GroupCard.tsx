import React from "react";
import { motion } from "framer-motion";
import { UsersRound, Trash2 } from "lucide-react";

export type Group = {
  id: string;
  name: string;
  score: number;
  goal: number;
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
  const progress =
    group.goal > 0 ? Math.min(100, Math.round((group.score / group.goal) * 100)) : 0;

  const handleOpen = () => onClick?.(group);

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
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="
        group relative w-full text-left
        overflow-hidden
        rounded-3xl
        border border-zinc-200
        bg-white
        p-6
        shadow-sm
        hover:shadow-md
        transition-shadow
        outline-none
        focus:ring-2 focus:ring-yellow-300/60
      "
    >
      {/* accents */}
      <div className="pointer-events-none absolute -top-14 -right-20 h-44 w-44 rounded-full bg-yellow-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-yellow-100/50 blur-3xl" />

      <div className="relative">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 truncate">
              {group.name}
            </h3>
            <p className="mt-1 text-xs text-zinc-500 flex items-center gap-2">
              <UsersRound className="h-4 w-4 text-zinc-400" />
              Study group
            </p>
          </div>

          {/* right side actions (no overlap) */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="
                rounded-full
                border border-yellow-200
                bg-yellow-50
                px-2.5 py-1
                text-[11px] font-semibold text-yellow-700
              "
            >
              {progress}%
            </span>

            {onDelete && (
              <button
                type="button"
                disabled={deleteDisabled}
                onClick={(e) => {
                  e.stopPropagation(); // مهم: کلیک کارت اجرا نشه
                  onDelete(group);
                }}
                className="
                  rounded-xl border border-zinc-200 bg-white/90
                  p-2 text-zinc-600 shadow-sm
                  hover:text-rose-600 hover:border-rose-200
                  transition
                  disabled:opacity-60 disabled:cursor-not-allowed
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
          <div className="rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4">
            <p className="text-[11px] text-zinc-500">Score</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">
              {group.score}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4">
            <p className="text-[11px] text-zinc-500">Goal</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900">
              {group.goal}
            </p>
          </div>
        </div>

        {/* progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">Progress</p>
            <p className="text-xs font-semibold text-zinc-700">
              {group.score}/{group.goal}
            </p>
          </div>

          <div className="mt-2 h-2 rounded-full bg-zinc-100 overflow-hidden border border-zinc-200">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-yellow-400"
            />
          </div>
        </div>

        {/* hover hint */}
        <div className="mt-4 flex items-center justify-end">
          <span className="text-xs font-semibold text-zinc-500 group-hover:text-zinc-800 transition-colors">
            Open →
          </span>
        </div>
      </div>

      {/* subtle shine */}
      <span
        className="
          pointer-events-none absolute inset-0
          translate-x-[-120%] group-hover:translate-x-[120%]
          transition-transform duration-700 ease-in-out
          bg-[linear-gradient(90deg,transparent,rgba(250,204,21,0.14),transparent)]
        "
      />
    </motion.div>
  );
}
