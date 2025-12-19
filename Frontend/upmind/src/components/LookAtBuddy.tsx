import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

type EyeOffset = { x: number; y: number };

export default function LookAtBuddy({
  label = "Study buddy",
}: {
  label?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [left, setLeft] = useState<EyeOffset>({ x: 0, y: 0 });
  const [right, setRight] = useState<EyeOffset>({ x: 0, y: 0 });

  const max = useMemo(() => ({ x: 6, y: 5 }), []);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    let raf = 0;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();

      // normalized [-1..1]
      const nx = ((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) || 0;
      const ny = ((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) || 0;

      const tx = clamp(nx, -1, 1) * max.x;
      const ty = clamp(ny, -1, 1) * max.y;

      // کمی تفاوت بین دو چشم برای طبیعی‌تر شدن
      const l = { x: tx * 0.95, y: ty * 0.95 };
      const rr = { x: tx * 1.05, y: ty * 1.0 };

      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setLeft(l);
        setRight(rr);
      });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
    };
  }, [max.x, max.y]);

  return (
    <motion.div
      ref={hostRef}
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="
        relative overflow-hidden
        rounded-3xl border border-zinc-200 bg-white
        shadow-sm
        p-5
      "
    >
      {/* subtle accents */}
      <div className="pointer-events-none absolute -top-14 -right-20 h-44 w-44 rounded-full bg-yellow-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-yellow-100/55 blur-3xl" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-900">{label}</p>
          <p className="mt-1 text-xs text-zinc-500">
            I’m watching 👀
          </p>
        </div>

        {/* Buddy face */}
        <div className="relative">
          <div
            className="
              h-14 w-20
              rounded-2xl
              border border-yellow-200
              bg-gradient-to-br from-yellow-50 to-white
              shadow-sm
              flex items-center justify-center
              gap-3
              px-3
            "
          >
            {/* left eye */}
            <div className="relative h-8 w-8 rounded-full bg-white border border-zinc-200 shadow-inner">
              <motion.div
                animate={{ x: left.x, y: left.y }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-800"
              />
              <div className="absolute left-[58%] top-[38%] h-1.5 w-1.5 rounded-full bg-white/90" />
            </div>

            {/* right eye */}
            <div className="relative h-8 w-8 rounded-full bg-white border border-zinc-200 shadow-inner">
              <motion.div
                animate={{ x: right.x, y: right.y }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-800"
              />
              <div className="absolute left-[58%] top-[38%] h-1.5 w-1.5 rounded-full bg-white/90" />
            </div>
          </div>

          {/* tiny smile */}
          <div className="mx-auto mt-1 h-1.5 w-8 rounded-full bg-yellow-300/70" />
        </div>
      </div>
    </motion.div>
  );
}
