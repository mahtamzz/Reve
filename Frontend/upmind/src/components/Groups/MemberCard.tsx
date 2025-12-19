import React from "react";
import { motion } from "framer-motion";

export type Member = {
  id: string;
  name: string;
  avatarUrl: string;
  time: string; // مثلا 01:12:14
  online?: boolean;
};

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function MemberCard({ m }: { m: Member }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      className="flex flex-col items-center text-center"
    >
      <div className="relative">
        <img
          src={m.avatarUrl}
          alt={m.name}
          className="h-16 w-16 rounded-full object-cover border border-zinc-200 shadow-sm"
        />
        <span
          className={[
            "absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-white",
            m.online ? "bg-emerald-500" : "bg-zinc-300",
          ].join(" ")}
        />
      </div>

      <p className="mt-2 text-sm font-semibold text-zinc-800">{m.name}</p>
      <p className="mt-0.5 text-[11px] text-zinc-500 tabular-nums">{m.time}</p>
    </motion.div>
  );
}
