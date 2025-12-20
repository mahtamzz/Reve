import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Users,
  Lock,
  Globe2,
  Sparkles,
  Target,
  Clock3,
  MailPlus,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export type CreateGroupPayload = {
  name: string;
  description: string;
  privacy: "public" | "private";
  goalXp: number; // total goal
  minDailyMinutes: number; // minimum daily study minutes
  invites: string[]; // emails
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function isValidEmail(email: string) {
  // ساده ولی کافی برای UI
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export default function CreateGroupModal({
  open,
  onClose,
  onCreate,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateGroupPayload) => void | Promise<void>;
  initial?: Partial<CreateGroupPayload>;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // --- form state ---
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [privacy, setPrivacy] = useState<CreateGroupPayload["privacy"]>(
    initial?.privacy ?? "private"
  );
  const [goalXp, setGoalXp] = useState<number>(initial?.goalXp ?? 10000);
  const [minDailyMinutes, setMinDailyMinutes] = useState<number>(
    initial?.minDailyMinutes ?? 30
  );

  const [inviteInput, setInviteInput] = useState("");
  const [invites, setInvites] = useState<string[]>(initial?.invites ?? []);

  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!name.trim()) e.name = "Group name is required.";
    if (name.trim().length < 3) e.name = "Group name must be at least 3 chars.";

    if (goalXp < 1000) e.goalXp = "Goal XP should be at least 1000.";
    if (goalXp > 1000000) e.goalXp = "Goal XP is too large.";

    if (minDailyMinutes < 5) e.minDailyMinutes = "Minimum should be at least 5 minutes.";
    if (minDailyMinutes > 24 * 60) e.minDailyMinutes = "Minimum is too large.";

    // invites validation فقط برای چیپ‌ها
    const bad = invites.find((x) => !isValidEmail(x));
    if (bad) e.invites = `Invalid email: ${bad}`;

    return e;
  }, [name, goalXp, minDailyMinutes, invites]);

  const canSubmit = useMemo(() => {
    return Object.keys(errors).length === 0 && !submitting;
  }, [errors, submitting]);

  // --- reset form on open ---
  useEffect(() => {
    if (!open) return;

    setName(initial?.name ?? "");
    setDescription(initial?.description ?? "");
    setPrivacy(initial?.privacy ?? "private");
    setGoalXp(initial?.goalXp ?? 10000);
    setMinDailyMinutes(initial?.minDailyMinutes ?? 30);
    setInviteInput("");
    setInvites(initial?.invites ?? []);
    setSubmitting(false);
    setTouched(false);
  }, [open, initial]);

  // --- lock body scroll (fix your issue) ---
  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollBarWidth > 0) body.style.paddingRight = `${scrollBarWidth}px`;

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [open]);

  // --- esc to close ---
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // --- focus first input ---
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => firstInputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [open]);

  const addInvite = (raw: string) => {
    const email = raw.trim().toLowerCase();
    if (!email) return;

    if (!isValidEmail(email)) return; // UI: با خطا نشان می‌دیم
    setInvites((prev) => (prev.includes(email) ? prev : [...prev, email]));
  };

  const removeInvite = (email: string) => {
    setInvites((prev) => prev.filter((x) => x !== email));
  };

  const onInviteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      addInvite(inviteInput);
      setInviteInput("");
      return;
    }

    if (e.key === "Backspace" && !inviteInput && invites.length > 0) {
      // remove last chip
      removeInvite(invites[invites.length - 1]);
    }
  };

  const submit = async () => {
    setTouched(true);
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        privacy,
        goalXp: Math.round(goalXp),
        minDailyMinutes: Math.round(minDailyMinutes),
        invites,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const inviteHint = useMemo(() => {
    const v = inviteInput.trim().toLowerCase();
    if (!v) return null;
    if (isValidEmail(v)) return { ok: true, text: "Press Enter to add" };
    return { ok: false, text: "Invalid email" };
  }, [inviteInput]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: EASE_OUT }}
          role="dialog"
          aria-modal="true"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* scroll container (captures wheel) */}
          <div className="absolute inset-0 overflow-y-auto overscroll-contain p-3 sm:p-6">
            <div className="min-h-full flex items-center justify-center">
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.985 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="
                  relative w-full max-w-[980px]
                  overflow-hidden
                  rounded-[32px]
                  border border-yellow-200/70
                  bg-gradient-to-b from-yellow-50/70 to-white
                  shadow-[0_30px_90px_-60px_rgba(0,0,0,0.55)]
                "
                onClick={(e) => e.stopPropagation()}
              >
                {/* accents */}
                <div className="pointer-events-none absolute -top-24 -right-24 h-[420px] w-[420px] rounded-full bg-yellow-200/30 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-32 h-[520px] w-[520px] rounded-full bg-orange-300/20 blur-3xl" />

                {/* layout */}
                <div className="relative grid grid-cols-12">
                  {/* LEFT - info */}
                  <section
                    className="
                      col-span-12 md:col-span-5
                      p-6 sm:p-8
                      border-b md:border-b-0 md:border-r
                      border-yellow-200/60
                      bg-gradient-to-br from-yellow-50 via-orange-50 to-white
                    "
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs tracking-[0.35em] text-zinc-500">
                          REVE
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold text-zinc-900 leading-snug">
                          New group
                        </h2>
                        <p className="mt-2 text-sm text-zinc-600">
                          Create a space to study together, keep streaks, and hit goals.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={onClose}
                        className="
                          rounded-xl
                          border border-zinc-200 bg-white/80
                          backdrop-blur
                          p-2
                          text-zinc-700
                          hover:border-yellow-300 hover:text-zinc-900
                          transition
                        "
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* feature cards */}
                    <div className="mt-6 grid gap-3">
                      <div className="rounded-2xl border border-yellow-200/70 bg-white/70 backdrop-blur p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-600" />
                          <p className="text-sm font-semibold text-zinc-900">Pro setup</p>
                        </div>
                        <p className="mt-1 text-xs text-zinc-600">
                          Privacy, goals, daily minimum — everything in one place.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-yellow-200/70 bg-white/70 backdrop-blur p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-amber-600" />
                          <p className="text-sm font-semibold text-zinc-900">Invite friends</p>
                        </div>
                        <p className="mt-1 text-xs text-zinc-600">
                          Add emails now or invite later from the group page.
                        </p>
                      </div>

                      <div className="rounded-2xl border border-yellow-200/70 bg-white/70 backdrop-blur p-4 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-amber-600" />
                          <p className="text-sm font-semibold text-zinc-900">Track progress</p>
                        </div>
                        <p className="mt-1 text-xs text-zinc-600">
                          Choose a goal XP and keep momentum with streaks.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-yellow-200/70 bg-white/70 backdrop-blur p-4 shadow-sm">
                      <p className="text-xs font-semibold text-zinc-700">Tip</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Short daily minimums (like 25–45 min) improve consistency.
                      </p>
                    </div>
                  </section>

                  {/* RIGHT - form (scroll) */}
                  <section className="col-span-12 md:col-span-7">
                    {/* header sticky */}
                    <div className="sticky top-0 z-10 border-b border-yellow-200/60 bg-white/75 backdrop-blur px-6 sm:px-8 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-zinc-900">
                            Group details
                          </p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            Fill the essentials — you can edit later.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={onClose}
                            className="
                              rounded-xl border border-zinc-200 bg-white
                              px-3 py-2 text-xs font-semibold text-zinc-700
                              hover:border-yellow-300 hover:text-zinc-900 transition
                            "
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={submit}
                            disabled={!canSubmit}
                            className="
                              rounded-xl
                              bg-amber-500 hover:bg-amber-600
                              text-white
                              px-4 py-2 text-xs font-semibold
                              shadow-sm
                              transition
                              disabled:opacity-60 disabled:hover:bg-amber-500
                              inline-flex items-center gap-2
                            "
                          >
                            {submitting ? (
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            Create
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* body */}
                    <div className="max-h-[78vh] overflow-y-auto overscroll-contain px-6 sm:px-8 py-6">
                      {/* alerts */}
                      {touched && Object.keys(errors).length > 0 && (
                        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex gap-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5" />
                          <div>
                            <p className="font-semibold">Fix a few things</p>
                            <p className="text-xs mt-0.5 opacity-90">
                              {errors.name || errors.goalXp || errors.minDailyMinutes || errors.invites}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Name */}
                      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <label className="block text-xs font-semibold text-zinc-700">
                          Group name
                        </label>
                        <input
                          ref={firstInputRef}
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onBlur={() => setTouched(true)}
                          placeholder="e.g. Up Mind"
                          className="
                            mt-2 w-full
                            rounded-2xl
                            border border-zinc-200 bg-white
                            px-4 py-3
                            text-sm text-zinc-800
                            shadow-sm
                            outline-none
                            transition
                            focus:ring-2 focus:ring-yellow-300/60
                            focus:border-yellow-300
                          "
                        />
                        {touched && errors.name && (
                          <p className="mt-2 text-xs text-red-600">{errors.name}</p>
                        )}

                        <div className="mt-4">
                          <label className="block text-xs font-semibold text-zinc-700">
                            Description (optional)
                          </label>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What is this group about?"
                            rows={3}
                            className="
                              mt-2 w-full
                              rounded-2xl
                              border border-zinc-200 bg-white
                              px-4 py-3
                              text-sm text-zinc-800
                              shadow-sm
                              outline-none
                              transition
                              focus:ring-2 focus:ring-yellow-300/60
                              focus:border-yellow-300
                              resize-none
                            "
                          />
                        </div>
                      </div>

                      {/* Privacy + Goal */}
                      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* privacy */}
                        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                          <p className="text-xs font-semibold text-zinc-700">
                            Privacy
                          </p>

                          <div className="mt-3 grid gap-2">
                            <button
                              type="button"
                              onClick={() => setPrivacy("private")}
                              className={cx(
                                "w-full text-left rounded-2xl border px-4 py-3 transition shadow-sm",
                                privacy === "private"
                                  ? "border-yellow-300 bg-yellow-50"
                                  : "border-zinc-200 bg-white hover:border-yellow-200"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={cx(
                                    "h-10 w-10 rounded-xl flex items-center justify-center border",
                                    privacy === "private"
                                      ? "bg-yellow-100 border-yellow-200"
                                      : "bg-zinc-50 border-zinc-200"
                                  )}
                                >
                                  <Lock className="h-5 w-5 text-amber-700" />
                                </span>
                                <div>
                                  <p className="text-sm font-semibold text-zinc-900">
                                    Private
                                  </p>
                                  <p className="text-xs text-zinc-500">
                                    Only invited users can join.
                                  </p>
                                </div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => setPrivacy("public")}
                              className={cx(
                                "w-full text-left rounded-2xl border px-4 py-3 transition shadow-sm",
                                privacy === "public"
                                  ? "border-yellow-300 bg-yellow-50"
                                  : "border-zinc-200 bg-white hover:border-yellow-200"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={cx(
                                    "h-10 w-10 rounded-xl flex items-center justify-center border",
                                    privacy === "public"
                                      ? "bg-yellow-100 border-yellow-200"
                                      : "bg-zinc-50 border-zinc-200"
                                  )}
                                >
                                  <Globe2 className="h-5 w-5 text-amber-700" />
                                </span>
                                <div>
                                  <p className="text-sm font-semibold text-zinc-900">
                                    Public
                                  </p>
                                  <p className="text-xs text-zinc-500">
                                    Anyone can find and request to join.
                                  </p>
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* goal + minimum */}
                        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                          <p className="text-xs font-semibold text-zinc-700">
                            Goals & routine
                          </p>

                          <div className="mt-4 space-y-4">
                            {/* goal xp */}
                            <div>
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-zinc-700 inline-flex items-center gap-2">
                                  <Target className="h-4 w-4 text-amber-700" />
                                  Goal XP
                                </label>
                                <span className="text-xs font-semibold text-zinc-900 tabular-nums">
                                  {goalXp.toLocaleString()}
                                </span>
                              </div>

                              <input
                                type="range"
                                min={1000}
                                max={200000}
                                step={500}
                                value={goalXp}
                                onChange={(e) => setGoalXp(Number(e.target.value))}
                                className="mt-2 w-full accent-amber-500"
                              />

                              {touched && errors.goalXp && (
                                <p className="mt-1 text-xs text-red-600">{errors.goalXp}</p>
                              )}

                              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                                <span>1k</span>
                                <span>200k</span>
                              </div>
                            </div>

                            {/* min daily */}
                            <div>
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-zinc-700 inline-flex items-center gap-2">
                                  <Clock3 className="h-4 w-4 text-amber-700" />
                                  Minimum daily study
                                </label>

                                <span className="text-xs font-semibold text-zinc-900 tabular-nums">
                                  {minDailyMinutes} min
                                </span>
                              </div>

                              <input
                                type="range"
                                min={5}
                                max={180}
                                step={5}
                                value={minDailyMinutes}
                                onChange={(e) => setMinDailyMinutes(Number(e.target.value))}
                                className="mt-2 w-full accent-amber-500"
                              />

                              {touched && errors.minDailyMinutes && (
                                <p className="mt-1 text-xs text-red-600">{errors.minDailyMinutes}</p>
                              )}

                              <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
                                <span>5m</span>
                                <span>180m</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Invites */}
                      <div className="mt-5 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold text-zinc-700 inline-flex items-center gap-2">
                              <MailPlus className="h-4 w-4 text-amber-700" />
                              Invite members
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              Add emails and press Enter.
                            </p>
                          </div>

                          <span className="text-xs text-zinc-500">
                            {invites.length} added
                          </span>
                        </div>

                        <div
                          className="
                            mt-4
                            rounded-2xl border border-zinc-200 bg-white
                            px-3 py-2
                            shadow-sm
                            focus-within:ring-2 focus-within:ring-yellow-300/60
                            focus-within:border-yellow-300
                            transition
                          "
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            {invites.map((email) => (
                              <span
                                key={email}
                                className="
                                  inline-flex items-center gap-2
                                  rounded-full
                                  border border-yellow-200
                                  bg-yellow-50
                                  px-3 py-1
                                  text-xs font-semibold text-zinc-800
                                "
                              >
                                {email}
                                <button
                                  type="button"
                                  onClick={() => removeInvite(email)}
                                  className="text-zinc-500 hover:text-zinc-900 transition"
                                  aria-label={`Remove ${email}`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </span>
                            ))}

                            <input
                              value={inviteInput}
                              onChange={(e) => setInviteInput(e.target.value)}
                              onKeyDown={onInviteKeyDown}
                              onBlur={() => setTouched(true)}
                              placeholder="name@example.com"
                              className="
                                flex-1 min-w-[180px]
                                bg-transparent
                                outline-none
                                py-1
                                text-sm text-zinc-800
                                placeholder:text-zinc-400
                              "
                            />
                          </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-xs">
                            {inviteHint && (
                              <span
                                className={cx(
                                  "font-semibold",
                                  inviteHint.ok ? "text-emerald-600" : "text-red-600"
                                )}
                              >
                                {inviteHint.text}
                              </span>
                            )}
                            {touched && errors.invites && (
                              <span className="font-semibold text-red-600">
                                {errors.invites}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              addInvite(inviteInput);
                              setInviteInput("");
                              setTouched(true);
                            }}
                            className="
                              text-xs font-semibold
                              text-amber-700 hover:underline
                              transition
                            "
                          >
                            Add
                          </button>
                        </div>

                        {privacy === "public" && (
                          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                            Public groups can be discovered by others. You can still invite members here.
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pb-2">
                        <button
                          type="button"
                          onClick={submit}
                          disabled={!canSubmit}
                          className="
                            w-full
                            rounded-2xl
                            bg-amber-500 hover:bg-amber-600
                            text-white font-semibold
                            py-3
                            shadow-sm
                            transition
                            disabled:opacity-60 disabled:hover:bg-amber-500
                            inline-flex items-center justify-center gap-2
                          "
                        >
                          {submitting ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Create group
                        </button>

                        <button
                          type="button"
                          onClick={onClose}
                          className="mt-3 w-full text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
