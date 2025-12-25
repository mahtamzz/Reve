// src/pages/FocusPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Square, RotateCcw, Sparkles, ChevronDown, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useLocation } from "react-router-dom";

import { ApiError } from "@/api/client";
import { useCreateSubject, useLogSession, useSubjects } from "@/hooks/useStudy";
import CreateSubjectModal from "@/components/ui/CreateSubjectModal";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1];

const LAST_SUBJECT_KEY = "study_last_subject_id_v1";
const tickEverySeconds = 1;

function safeReadLastSubject(): string | null {
  try {
    return localStorage.getItem(LAST_SUBJECT_KEY);
  } catch {
    return null;
  }
}
function safeWriteLastSubject(id: string) {
  try {
    localStorage.setItem(LAST_SUBJECT_KEY, id);
  } catch {}
}

export default function FocusPage() {
  const navigate = useNavigate();

  const [running, setRunning] = useState(false);
  const [time, setTime] = useState(0);

  const startedAtRef = useRef<number | null>(null);
  const baseAtStartRef = useRef(0);

  const mins = String(Math.floor(time / 60)).padStart(2, "0");
  const secs = String(time % 60).padStart(2, "0");

  // ---- Study API ----
  const { data: subjects, isLoading: subjectsLoading, error: subjectsError } = useSubjects();
  const {
    mutateAsync: logSession,
    isPending: isSaving,
    error: saveError,
  } = useLogSession();

  const {
    mutateAsync: createSubject,
    isPending: isCreatingSubject,
    error: createSubjectError,
  } = useCreateSubject();

  const [subjectId, setSubjectId] = useState<string | "">(() => safeReadLastSubject() ?? "");
  const [createOpen, setCreateOpen] = useState(false);

  const location = useLocation();


  useEffect(() => {
    const incoming = (location.state as any)?.subjectId as string | undefined;
    if (!incoming) return;

    setSubjectId(incoming);
    safeWriteLastSubject(incoming);

    // optional: clear state so refresh/back won't re-trigger
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);


  useEffect(() => {
    if (subjectId) return;
    if (!subjects?.length) return;
    setSubjectId(subjects[0].id);
    safeWriteLastSubject(subjects[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects]);
  

  useEffect(() => {
    if (!running) return;

    if (startedAtRef.current == null) startedAtRef.current = performance.now();

    const t = window.setInterval(() => {
      const now = performance.now();
      const elapsedMs = now - (startedAtRef.current ?? now);
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const stepped = Math.floor(elapsedSeconds / tickEverySeconds) * tickEverySeconds;
      setTime(baseAtStartRef.current + stepped);
    }, 200);

    return () => window.clearInterval(t);
  }, [running]);

  const studiedSeconds = time;

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

  const finish = async () => {
    if (isSaving) return;
    if (!subjectId) return;

    const durationMins = Math.max(1, Math.round(studiedSeconds / 60));
    const startedAtIso = new Date(Date.now() - durationMins * 60_000).toISOString();

    setRunning(false);

    await logSession({
      subjectId,
      durationMins,
      startedAt: startedAtIso,
    });

    navigate("/dashboard", {
      replace: true,
      state: { focusSeconds: studiedSeconds },
    });

    reset();
  };

  // ----- Create subject flow -----
  const handleCreateSubject = async (payload: { name: string; color: string | null }) => {
    const created = await createSubject({
      name: payload.name,
      color: payload.color ?? null,
    });

    // created از mutateAsync برگشت داده میشه
    if (created?.id) {
      setSubjectId(created.id);
      safeWriteLastSubject(created.id);
    }
  };

  const canFinish =
    !!subjectId &&
    studiedSeconds >= 60 &&
    !isSaving &&
    !subjectsLoading &&
    !subjectsError;

  const saveErrMsg =
    saveError instanceof ApiError ? saveError.message : saveError ? "Failed to save session." : null;

  const createErrMsg =
    createSubjectError instanceof ApiError
      ? createSubjectError.message
      : createSubjectError
        ? "Failed to create subject."
        : null;

  const bg = useMemo(() => {
    return running
      ? {
          outer: "from-[#FBF7EA] via-[#EEF6E6] to-[#DDEED8]",
          glow1: "bg-[#CFE2B9]/55",
          glow2: "bg-[#BFD8A7]/45",
          dot: "bg-[#6E8F5B]",
          status: "Active",
          hint: "Session running — stay with it.",
          wash:
            "radial-gradient(1200px 640px at 16% 14%, rgba(251, 247, 234, 0.85), transparent 62%), radial-gradient(950px 560px at 82% 86%, rgba(207, 226, 185, 0.60), transparent 64%), radial-gradient(900px 520px at 62% 18%, rgba(255, 228, 200, 0.22), transparent 62%)",
        }
      : {
          outer: "from-[#FBF4D6] via-[#FAF2D0] to-[#F3E7B9]",
          glow1: "bg-yellow-200/45",
          glow2: "bg-amber-200/25",
          dot: "bg-yellow-600",
          status: "Idle",
          hint: "Ready when you are.",
          wash:
            "radial-gradient(1200px 600px at 20% 10%, rgba(250, 204, 21, 0.22), transparent 55%), radial-gradient(900px 500px at 80% 90%, rgba(251, 191, 36, 0.16), transparent 55%)",
        };
  }, [running]);


  return (
    <>
      <motion.div
        animate={{ opacity: 1 }}
        className={`min-h-screen relative overflow-hidden bg-gradient-to-br ${bg.outer} flex items-center justify-center`}
      >
        {/* ... blobs / wash مثل قبل ... */}

        <motion.div className="relative w-[92%] max-w-[560px] rounded-[32px] bg-[#FBFAF3]/92 backdrop-blur border border-black/10 shadow-2xl">
          <div className="relative p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-zinc-800">Focus Timer</p>
                <p className="mt-1 text-xs text-zinc-500">{bg.hint}</p>
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-[11px] font-medium text-zinc-600">
                <span className={`h-2 w-2 rounded-full ${bg.dot}`} />
                {bg.status}
              </span>
            </div>

            {/* Subject row */}
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-zinc-700">Subject</p>

                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  disabled={isCreatingSubject}
                  className="
                    inline-flex items-center gap-2 rounded-xl
                    border border-black/10 bg-white/70
                    px-3 py-2 text-xs font-semibold text-zinc-700
                    hover:border-yellow-300 hover:text-zinc-900 transition
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  <Plus className="h-4 w-4" />
                  {isCreatingSubject ? "Creating..." : "Create subject"}
                </button>
              </div>

              <div className="mt-2 relative">
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <select
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    safeWriteLastSubject(e.target.value);
                  }}
                  disabled={subjectsLoading || !!subjectsError}
                  className="
                    w-full appearance-none rounded-2xl border border-black/10 bg-white/75
                    px-4 py-3 pr-10 text-sm text-zinc-800 shadow-sm outline-none
                    focus:ring-2 focus:ring-yellow-300/60
                    disabled:opacity-60 disabled:cursor-not-allowed
                  "
                >
                  {!subjects?.length ? (
                    <option value="">
                      {subjectsLoading
                        ? "Loading subjects…"
                        : subjectsError
                          ? "Failed to load subjects"
                          : "No subjects yet"}
                    </option>
                  ) : null}

                  {(subjects ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {createErrMsg ? (
                <p className="mt-2 text-xs text-rose-600">{createErrMsg}</p>
              ) : null}

              {subjectsError ? (
                <p className="mt-2 text-xs text-rose-600">Failed to load subjects.</p>
              ) : null}
            </div>

            {/* timer */}
            <div className="mt-8 text-center">
              <div className="text-[72px] sm:text-[84px] font-semibold tracking-tight text-[#2B1A14]">
                {mins}:{secs}
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                {studiedSeconds < 60 ? "Finish unlocks after 1 minute" : "Ready to save"}
              </div>
            </div>

            {saveErrMsg ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
                {saveErrMsg}
              </div>
            ) : null}

            {/* controls */}
            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                onClick={toggle}
                className="h-16 w-16 rounded-2xl border border-black/10 bg-white/70 shadow-sm"
                aria-label={running ? "Stop" : "Start"}
              >
                {running ? <Square className="h-6 w-6 mx-auto" /> : <Play className="h-6 w-6 mx-auto" />}
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/80 px-4 py-2 text-xs font-semibold text-zinc-600 border border-black/10 shadow-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>

                <button
                  onClick={finish}
                  disabled={!canFinish}
                  className="
                    rounded-2xl bg-white/85 px-6 py-2.5 text-sm font-semibold
                    text-[#2B1A14] border border-black/10 shadow-sm
                    disabled:opacity-55 disabled:cursor-not-allowed
                  "
                >
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Finish studying"}
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-5 text-center text-[11px] text-zinc-500">
              Finish will create a study session in your dashboard.
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Modal */}
      <CreateSubjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateSubject}
      />
    </>
  );
}
