import React, { useEffect, useRef, useState } from "react";
import { Play, Square } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function FocusPage() {
  const navigate = useNavigate();

  const TOTAL = 20 * 60; // 20 min fixed
  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(TOTAL);

  // برای اینکه "زمان مطالعه شده" دقیق باشد حتی اگر کاربر pause کند
  const startTotalRef = useRef(TOTAL);

  const mins = String(Math.floor(time / 60)).padStart(2, "0");
  const secs = String(time % 60).padStart(2, "0");

  useEffect(() => {
    if (!running) return;
    if (time <= 0) return;

    const t = window.setInterval(() => {
      setTime((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => window.clearInterval(t);
  }, [running, time]);

  const studiedSeconds = Math.max(0, startTotalRef.current - time);

  const finish = () => {
    // اگر چیزی نخونده بود، هم می‌تونی برگردونی هم می‌تونی جلوگیری کنی
    navigate("/dashboard", {
      state: { focusSeconds: studiedSeconds },
      replace: true,
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#E9E6D8] to-[#D8D5C6] flex items-center justify-center">
      {/* ambient blobs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-24 -right-28 h-80 w-80 rounded-full bg-yellow-200/40 blur-3xl"
        animate={{ y: [0, 12, 0], x: [0, -8, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-emerald-200/25 blur-3xl"
        animate={{ y: [0, -14, 0], x: [0, 10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* bigger card */}
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative w-[92%] max-w-[560px] rounded-[32px] bg-[#FBFAF3]/92 backdrop-blur border border-black/10 shadow-2xl"
      >
        <div className="pointer-events-none absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.55),transparent_45%)]" />

        <div className="relative p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-800">Focus Timer</p>
              <p className="mt-1 text-xs text-zinc-500">
                {running ? "Session running — stay with it." : "Ready when you are."}
              </p>
            </div>

            <motion.span
              animate={{ opacity: running ? 1 : 0.7 }}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] font-medium text-zinc-600"
            >
              <span className={running ? "h-2 w-2 rounded-full bg-emerald-500" : "h-2 w-2 rounded-full bg-yellow-400"} />
              {running ? "Active" : "Idle"}
            </motion.span>
          </div>

          <div className="mt-10 text-center">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={`${mins}:${secs}`}
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="text-[72px] sm:text-[84px] font-semibold tracking-tight text-[#2B1A14]"
              >
                {mins}:{secs}
              </motion.div>
            </AnimatePresence>

            <motion.div
              className="mt-3 mx-auto h-[2px] w-28 rounded-full bg-yellow-300/80"
              animate={{ width: running ? 170 : 112 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />

            <p className="mt-3 text-xs text-zinc-500">
              Studied: <span className="font-semibold text-zinc-700">{Math.floor(studiedSeconds / 60)} min</span>
            </p>
          </div>

          <div className="mt-10 flex items-center justify-between gap-4">
            <motion.button
              onClick={() => setRunning((v) => !v)}
              whileHover={{ y: -2, scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="group flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#2B1A14] bg-white/85 shadow-sm"
              aria-label={running ? "Stop" : "Start"}
            >
              {running ? (
                <Square className="h-6 w-6 text-[#2B1A14]" />
              ) : (
                <Play className="h-6 w-6 text-[#2B1A14]" />
              )}
            </motion.button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setRunning(false);
                  setTime(TOTAL);
                  startTotalRef.current = TOTAL;
                }}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
              >
                Reset
              </button>

              <motion.button
                onClick={finish}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-2xl bg-white/85 px-6 py-2.5 text-sm font-semibold text-[#2B1A14] border border-black/10 shadow-sm hover:border-yellow-300 hover:bg-white transition-colors"
              >
                Finish studying
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
