import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, RotateCcw, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

export default function FocusPage() {
  const navigate = useNavigate();

  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);

  // 1=هر ثانیه، 60=هر دقیقه، 300=هر 5 دقیقه
  const tickEverySeconds = 1;

  const startedAtRef = useRef<number | null>(null);
  const baseAtStartRef = useRef(0);

  const mins = String(Math.floor(time / 60)).padStart(2, "0");
  const secs = String(time % 60).padStart(2, "0");

  useEffect(() => {
    if (!running) return;

    if (startedAtRef.current == null) startedAtRef.current = performance.now();

    const t = window.setInterval(() => {
      const now = performance.now();
      const elapsedMs = now - (startedAtRef.current ?? now);
      const elapsedSeconds = Math.floor(elapsedMs / 1000);

      const stepped =
        Math.floor(elapsedSeconds / tickEverySeconds) * tickEverySeconds;

      setTime(baseAtStartRef.current + stepped);
    }, 200);

    return () => window.clearInterval(t);
  }, [running]);

  const studiedSeconds = time;

  const finish = () => {
    navigate("/dashboard", {
      state: { focusSeconds: studiedSeconds },
      replace: true,
    });
  };

  const reset = () => {
    setRunning(false);
    setTime(0);
    startedAtRef.current = null;
    baseAtStartRef.current = 0;
  };

  const toggle = () => {
    setRunning((v) => {
      const next = !v;
      if (next) {
        startedAtRef.current = performance.now();
        baseAtStartRef.current = time;
      } else {
        startedAtRef.current = null;
        baseAtStartRef.current = time;
      }
      return next;
    });
  };

  // ✅ REAL warm pastel green = sage/olive + butter/ivory undertone
  const bg = useMemo(() => {
    return running
      ? {
          // warm sage base (ivory → warm-sage → warm-mint)
          outer: "from-[#FBF7EA] via-[#EEF6E6] to-[#DDEED8]",

          // blobs: olive-sage + butter-lime (warm)
          glow1: "bg-[#CFE2B9]/55",
          glow2: "bg-[#BFD8A7]/45",

          // status dot + underline (warm green)
          dot: "bg-[#6E8F5B]",
          underline: "bg-[#CFE2B9]",

          status: "Active",
          hint: "Session running — stay with it.",

          // warm wash: butter + sage + a tiny peach warmth
          wash:
            "radial-gradient(1200px 640px at 16% 14%, rgba(251, 247, 234, 0.85), transparent 62%), radial-gradient(950px 560px at 82% 86%, rgba(207, 226, 185, 0.60), transparent 64%), radial-gradient(900px 520px at 62% 18%, rgba(255, 228, 200, 0.22), transparent 62%)",
        }
      : {
          outer: "from-[#FBF4D6] via-[#FAF2D0] to-[#F3E7B9]",
          glow1: "bg-yellow-200/45",
          glow2: "bg-amber-200/25",
          dot: "bg-yellow-600",
          underline: "bg-yellow-300/80",
          status: "Idle",
          hint: "Ready when you are.",
          wash:
            "radial-gradient(1200px 600px at 20% 10%, rgba(250, 204, 21, 0.22), transparent 55%), radial-gradient(900px 500px at 80% 90%, rgba(251, 191, 36, 0.16), transparent 55%)",
        };
  }, [running]);

  const sceneFlash = {
    initial: { opacity: 0, scale: 0.985, filter: "blur(10px)" },
    animate: { opacity: 1, scale: 1, filter: "blur(0px)" },
    exit: { opacity: 0, scale: 1.015, filter: "blur(10px)" },
    transition: { duration: 0.55, ease: EASE_OUT },
  };

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${bg.outer} flex items-center justify-center`}
    >
      {/* warm pastel wash (animated) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={running ? "wash-active" : "wash-idle"}
          {...sceneFlash}
          className="absolute inset-0"
          aria-hidden
        >
          <motion.div
            className="absolute inset-0 opacity-80"
            style={{ background: bg.wash }}
            animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: EASE_IN_OUT }}
          />
        </motion.div>
      </AnimatePresence>

      {/* blobs */}
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute -top-24 -right-28 h-80 w-80 rounded-full ${bg.glow1} blur-3xl`}
        animate={{ y: [0, 10, 0], x: [0, -8, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: EASE_IN_OUT }}
      />
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute -bottom-28 -left-24 h-96 w-96 rounded-full ${bg.glow2} blur-3xl`}
        animate={{ y: [0, -12, 0], x: [0, 10, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 13, repeat: Infinity, ease: EASE_IN_OUT }}
      />

      {/* card */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE_OUT }}
        className="relative w-[92%] max-w-[560px] rounded-[32px] bg-[#FBFAF3]/92 backdrop-blur border border-black/10 shadow-2xl"
      >
        <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.55),transparent_45%)]" />

        <div className="relative p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-800">Focus Timer</p>
              <p className="mt-1 text-xs text-zinc-500">{bg.hint}</p>
            </div>

            <motion.span
              animate={{ opacity: running ? 1 : 0.78 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] font-medium text-zinc-600"
            >
              <span className={`h-2 w-2 rounded-full ${bg.dot}`} />
              {bg.status}
            </motion.span>
          </div>

          <div className="mt-10 text-center">
            <motion.div
              className="text-[72px] sm:text-[84px] font-semibold tracking-tight text-[#2B1A14]"
              animate={{ opacity: running ? 1 : 0.98 }}
              transition={{ duration: 0.25, ease: EASE_OUT }}
            >
              {mins}:{secs}
            </motion.div>
          </div>


          {/* Controls */}
          <div className="mt-10 flex items-center justify-between gap-4">
            {/* Start/Stop (glass + premium highlight) */}
            <motion.button
              onClick={toggle}
              whileHover={{ y: -2 }}
              whileTap={{ y: 1, scale: 0.99 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className={[
                "relative h-16 w-16 rounded-2xl overflow-hidden",
                "border border-black/10 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.45)]",
                "bg-white/70 backdrop-blur-xl",
                "ring-1 ring-white/60",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30",
              ].join(" ")}
              aria-label={running ? "Stop" : "Start"}
            >
              <motion.div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: running
                    ? "linear-gradient(145deg, rgba(207,226,185,0.85), rgba(251,247,234,0.55), rgba(255,255,255,0.40))"
                    : "linear-gradient(145deg, rgba(250,204,21,0.26), rgba(251,191,36,0.14), rgba(255,255,255,0.62))",
                }}
              />

              <motion.div
                aria-hidden
                className="absolute -inset-10 opacity-55"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.78), transparent)",
                  transform: "rotate(18deg)",
                }}
                animate={{ x: ["-40%", "140%"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: EASE_IN_OUT }}
              />

              <div
                aria-hidden
                className="absolute inset-0 rounded-2xl"
                style={{
                  background:
                    "radial-gradient(120px 70px at 30% 15%, rgba(255,255,255,0.75), transparent 65%)",
                  mixBlendMode: "soft-light",
                }}
              />

              <div className="relative z-10 flex h-full w-full items-center justify-center">
                <AnimatePresence mode="wait" initial={false}>
                  {running ? (
                    <motion.div
                      key="stop"
                      initial={{ opacity: 0, y: 6, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.92 }}
                      transition={{ duration: 0.18, ease: EASE_OUT }}
                    >
                      <Square className="h-6 w-6 text-[#2B1A14]" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="play"
                      initial={{ opacity: 0, y: 6, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.92 }}
                      transition={{ duration: 0.18, ease: EASE_OUT }}
                    >
                      <Play className="h-6 w-6 text-[#2B1A14]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>

            <div className="flex items-center gap-3">
              <motion.button
                onClick={reset}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="group inline-flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2 text-xs font-semibold text-zinc-600 border border-black/10 shadow-sm hover:text-zinc-900 hover:border-black/15 transition-colors"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </motion.button>

              <motion.button
                onClick={finish}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="relative overflow-hidden rounded-2xl bg-white/85 px-6 py-2.5 text-sm font-semibold text-[#2B1A14] border border-black/10 shadow-sm hover:border-yellow-300 hover:bg-white transition-colors"
              >
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute -inset-10 opacity-0"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.75), transparent)",
                    transform: "rotate(12deg)",
                  }}
                  whileHover={{ opacity: 1, x: ["-30%", "130%"] }}
                  transition={{ duration: 0.9, ease: EASE_OUT }}
                />
                <span className="relative inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Finish studying
                </span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
