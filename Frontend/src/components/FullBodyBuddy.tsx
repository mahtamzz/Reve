import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

type Vec = { x: number; y: number };

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export default function FullBodyBuddy({ label = "Let’s study!" }: { label?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  const [target, setTarget] = useState<Vec>({ x: 0, y: 0 });
  const [pose, setPose] = useState<Vec>({ x: 0, y: 0 });

  const max = useMemo(
    () => ({
      head: { x: 10, y: 9, r: 9 },
      torso: { r: 5, x: 5 },
      arm: { r: 14 },
      pupil: { x: 8, y: 7 },
      book: { r: 8, x: 7, y: 4 },
    }),
    []
  );

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      setTarget({ x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setPose((p) => ({
        x: lerp(p.x, target.x, 0.11),
        y: lerp(p.y, target.y, 0.11),
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target.x, target.y]);

  const headX = pose.x * max.head.x;
  const headY = pose.y * max.head.y;
  const headR = pose.x * max.head.r;

  const torsoR = pose.x * max.torso.r;
  const torsoX = pose.x * max.torso.x;

  const leftArmR = pose.x * max.arm.r + pose.y * 4;
  const rightArmR = pose.x * -max.arm.r + pose.y * 4;

  const pupilX = pose.x * max.pupil.x;
  const pupilY = pose.y * max.pupil.y;

  const bookR = pose.x * max.book.r;
  const bookX = pose.x * max.book.x;
  const bookY = pose.y * max.book.y;

  return (
    <motion.div
      ref={hostRef}
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="relative w-[300px] h-[540px]"
    >
      {/* soft accents */}
      <div className="pointer-events-none absolute -top-14 -right-14 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-rose-400/20 blur-3xl" />

      {/* label bubble */}
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        className="
          absolute left-3 top-2
          rounded-2xl border border-sky-200/80
          bg-white/75 backdrop-blur
          px-3 py-1.5
          text-[11px] font-semibold text-zinc-800
          shadow-sm
        "
      >
        {label}
      </motion.div>

      {/* character */}
      <div className="absolute inset-0 flex items-end justify-center pb-5">
        <motion.div
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-[250px] flex flex-col items-center"
        >
          {/* head (in-flow) */}
          <motion.div
            animate={{ x: headX, y: headY, rotate: headR }}
            transition={{ type: "spring", stiffness: 190, damping: 20 }}
            className="relative z-30 -mb-6"
          >
            {/* hair */}
            <div className="absolute left-1/2 top-[-2px] -translate-x-1/2 w-[112px] z-10">
              <div
                className="
                  relative
                  h-[42px]
                  w-full
                  rounded-t-[42px]
                  border border-zinc-700/20
                  bg-gradient-to-b from-zinc-800 to-zinc-700
                  shadow-sm
                  overflow-hidden
                "
              >
                <div className="absolute left-6 top-4 h-9 w-18 rounded-full bg-white/10 blur-md" />
              </div>

              <div className="absolute left-1/2 top-[26px] -translate-x-1/2 flex gap-[1px]">
                <div className="h-5 w-5 rounded-b-[14px] bg-zinc-800 border border-zinc-700/20" />
                <div className="h-6 w-6 rounded-b-[16px] bg-zinc-800 border border-zinc-700/20" />
                <div className="h-6 w-6 rounded-b-[16px] bg-zinc-800 border border-zinc-700/20" />
                <div className="h-5 w-5 rounded-b-[14px] bg-zinc-800 border border-zinc-700/20" />
              </div>
            </div>

            {/* face */}
            <div
              className="
                relative
                h-[112px] w-[112px]
                rounded-[40px]
                border border-rose-200/60
                bg-gradient-to-b from-rose-50 to-white
                shadow-sm
                overflow-hidden
              "
            >
              <div className="absolute left-5 top-[72px] h-3.5 w-6 rounded-full bg-rose-300/55 blur-[0.5px]" />
              <div className="absolute right-5 top-[72px] h-3.5 w-6 rounded-full bg-rose-300/55 blur-[0.5px]" />

              <div className="absolute left-1/2 top-[42px] -translate-x-1/2 flex items-center gap-5 opacity-95">
                <div className="h-9 w-9 rounded-full border border-zinc-700/40 bg-white/35 backdrop-blur shadow-sm" />
                <div className="h-[2px] w-4 bg-zinc-700/30" />
                <div className="h-9 w-9 rounded-full border border-zinc-700/40 bg-white/35 backdrop-blur shadow-sm" />
              </div>

              <div className="absolute left-0 right-0 top-[40px] flex items-center justify-center gap-[26px]">
                <div className="relative h-10 w-10 rounded-full bg-white border border-zinc-200 shadow-inner">
                  <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-sky-500 to-indigo-600 opacity-95" />
                  <motion.div
                    animate={{ x: pupilX, y: pupilY }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900"
                  />
                  <div className="absolute left-[62%] top-[20%] h-2.5 w-2.5 rounded-full bg-white/95" />
                  <div className="absolute left-[52%] top-[44%] h-1.5 w-1.5 rounded-full bg-white/80" />
                  <div className="absolute left-1/2 bottom-2 h-2 w-6 -translate-x-1/2 rounded-full bg-white/20 blur-[0.5px]" />
                </div>

                <div className="relative h-10 w-10 rounded-full bg-white border border-zinc-200 shadow-inner">
                  <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-sky-500 to-indigo-600 opacity-95" />
                  <motion.div
                    animate={{ x: pupilX, y: pupilY }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900"
                  />
                  <div className="absolute left-[62%] top-[20%] h-2.5 w-2.5 rounded-full bg-white/95" />
                  <div className="absolute left-[52%] top-[44%] h-1.5 w-1.5 rounded-full bg-white/80" />
                  <div className="absolute left-1/2 bottom-2 h-2 w-6 -translate-x-1/2 rounded-full bg-white/20 blur-[0.5px]" />
                </div>
              </div>

              <div className="absolute left-1/2 top-[86px] -translate-x-1/2">
                <div className="relative h-3 w-10">
                  <div className="absolute left-1/2 top-1/2 h-2 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-400/60" />
                  <div className="absolute left-1/2 top-1/2 h-1 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30" />
                </div>
              </div>

              <div className="absolute left-1/2 top-[74px] -translate-x-1/2 h-1.5 w-1.5 rounded-full bg-zinc-400/60" />
              <div className="pointer-events-none absolute -top-10 -right-12 h-32 w-32 rounded-full bg-white/30 blur-2xl" />
            </div>

            <div className="mx-auto -mt-3 h-7 w-24 rounded-b-3xl border border-zinc-200 bg-white shadow-sm" />
          </motion.div>

          {/* torso */}
          <motion.div
            animate={{ x: torsoX, rotate: torsoR }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
            className="relative mx-auto w-[205px] origin-bottom z-20"
          >
            <div
              className="
                relative
                rounded-[34px]
                border border-zinc-200
                bg-gradient-to-b from-zinc-50 via-white to-zinc-50
                shadow-md
                px-6 pt-8 pb-7
                overflow-hidden
              "
            >
              <div className="pointer-events-none absolute -top-14 -right-12 h-40 w-40 rounded-full bg-white/60 blur-2xl" />
              <div className="pointer-events-none absolute left-6 top-5 h-2 w-28 rounded-full bg-zinc-900/5" />
              <div className="pointer-events-none absolute right-6 top-5 h-2 w-28 rounded-full bg-zinc-900/5" />

              <div className="absolute left-1/2 top-7 -translate-x-1/2 w-[92px]">
                <div className="relative mx-auto h-24 w-[92px] rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                  <div className="absolute left-1/2 top-0 h-full w-[1px] -translate-x-1/2 bg-zinc-200/70" />
                  <div className="absolute left-3 top-10 h-2 w-8 rounded-full bg-zinc-100" />
                  <div className="absolute right-3 top-14 h-2 w-7 rounded-full bg-zinc-100" />
                </div>

                <div className="absolute -top-2 left-1/2 -translate-x-1/2 flex gap-2">
                  <div className="h-6 w-8 rotate-[18deg] rounded-2xl border border-zinc-200 bg-white shadow-sm" />
                  <div className="h-6 w-8 rotate-[-18deg] rounded-2xl border border-zinc-200 bg-white shadow-sm" />
                </div>

                <div className="absolute top-6 left-1/2 -translate-x-1/2">
                  <div className="mx-auto h-4 w-5 rounded-lg border border-sky-300/70 bg-gradient-to-b from-sky-500 to-indigo-500 shadow-sm" />
                  <div className="mx-auto mt-1 h-14 w-6 rounded-2xl border border-sky-300/60 bg-gradient-to-b from-indigo-500 via-sky-500 to-rose-500 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-3 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-white/15 blur-lg" />
                  </div>
                </div>
              </div>

              <div className="absolute left-5 top-10 h-8 w-8 rounded-2xl border border-amber-200 bg-amber-50 shadow-sm flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-amber-400/80" />
              </div>

              <div className="mx-auto mt-24 h-11 w-[140px] rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm" />

              <motion.div
                animate={{ rotate: leftArmR }}
                transition={{ type: "spring", stiffness: 120, damping: 18 }}
                className="absolute left-[-18px] top-[52px] origin-top-right"
              >
                <div className="h-24 w-10 rounded-[26px] border border-zinc-200 bg-gradient-to-b from-zinc-50 to-zinc-100 shadow-sm" />
                <div className="mt-1 h-10 w-11 rounded-2xl border border-zinc-200 bg-yellow-50 shadow-sm" />
              </motion.div>

              <motion.div
                animate={{ rotate: rightArmR }}
                transition={{ type: "spring", stiffness: 120, damping: 18 }}
                className="absolute right-[-18px] top-[52px] origin-top-left"
              >
                <div className="h-24 w-10 rounded-[26px] border border-zinc-200 bg-gradient-to-b from-zinc-50 to-zinc-100 shadow-sm" />
                <div className="mt-1 h-10 w-11 rounded-2xl border border-zinc-200 bg-yellow-50 shadow-sm" />
              </motion.div>

              <motion.div
                animate={{ x: bookX, y: bookY, rotate: bookR }}
                transition={{ type: "spring", stiffness: 180, damping: 18 }}
                className="absolute left-1/2 bottom-5 -translate-x-1/2"
              >
                <div className="relative h-16 w-30 rounded-2xl border border-zinc-200 bg-white shadow-md overflow-hidden">
                  <div className="absolute inset-y-0 left-0 w-3 bg-indigo-600/80" />
                  <div className="absolute top-3 left-6 h-2 w-16 rounded-full bg-zinc-200" />
                  <div className="absolute top-7 left-6 h-2 w-12 rounded-full bg-zinc-200" />
                  <div className="absolute bottom-3 right-3 h-6 w-6 rounded-xl bg-rose-400/80" />
                </div>
              </motion.div>
            </div>
          </motion.div>



          {/* ground shadow (always under feet) */}
          <div className="mx-auto mt-3 h-4 w-[190px] rounded-full bg-zinc-900/10 blur-[1px]" />
        </motion.div>
      </div>
    </motion.div>
  );
}
