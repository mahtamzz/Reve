import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Users, MapPin, Link as LinkIcon, Mail, Pencil, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useProfileInfoMe } from "@/hooks/useProfileInfoMe";
import { useProfileInfoDashboard } from "@/hooks/useProfileInfoDashboard"; 
import { useUpdateProfileInfo } from "@/hooks/useUpdateProfileInfo";
import { useMedia } from "@/hooks/useMedia";

type UiProfile = {
  fullName: string;
  username: string;
  role?: string;

  avatarUrl: string | null;

  coverUrl?: string | null;
  bio?: string;
  email?: string;
  location?: string;
  website?: string;

  weeklyGoal: number | null;
  timezone: string;
  xp: number | null;
};

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

function getErrorMessage(err: unknown): string {
  const anyErr = err as any;
  const msg =
    anyErr?.details?.message ||
    anyErr?.message ||
    (typeof anyErr === "string" ? anyErr : "") ||
    "خطای نامشخص";

  if (typeof msg === "string" && msg.includes("<!DOCTYPE html")) {
    return "خطای سرور. لاگ بک را چک کن.";
  }
  return msg;
}

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [tab, setTab] = useState<"profile" | "stats">("profile");
  const [editOpen, setEditOpen] = useState(false);

  const meQ = useProfileInfoMe();
  const _dashQ = useProfileInfoDashboard();
  const updateM = useUpdateProfileInfo();
  const media = useMedia(true);

  const serverProfile = meQ.data?.profile ?? null;

  const [form, setForm] = useState<{ display_name: string; timezone: string; weekly_goal: string }>({
    display_name: "",
    timezone: "UTC",
    weekly_goal: "",
  });

  React.useEffect(() => {
    if (!serverProfile) return;

    const displayName =
      (serverProfile as any).display_name ?? (serverProfile as any).displayName ?? "";
    const timezone = (serverProfile as any).timezone ?? "UTC";
    const weekly_goal_val =
      (serverProfile as any).weekly_goal ?? (serverProfile as any).weeklyGoal ?? null;

    setForm({
      display_name: String(displayName ?? ""),
      timezone: String(timezone ?? "UTC"),
      weekly_goal: weekly_goal_val == null ? "" : String(weekly_goal_val),
    });
  }, [serverProfile?.uid]);

  const p = useMemo<UiProfile>(() => {
    const displayName =
      (serverProfile as any)?.display_name ??
      (serverProfile as any)?.displayName ??
      "—";

    const username =
      (serverProfile as any)?.username ??
      (serverProfile as any)?.handle ??
      "user";

    const coverUrl =
      (serverProfile as any)?.cover_url ??
      (serverProfile as any)?.coverUrl ??
      null;

    const bio = (serverProfile as any)?.bio ?? undefined;
    const email = (serverProfile as any)?.email ?? undefined;
    const location = (serverProfile as any)?.location ?? undefined;
    const website = (serverProfile as any)?.website ?? undefined;

    const weeklyGoal = (serverProfile as any)?.weekly_goal ?? null;
    const timezone = (serverProfile as any)?.timezone ?? "UTC";
    const xp = (serverProfile as any)?.xp ?? null;

    return {
      fullName: String(displayName || "—"),
      username: String(username || "user"),
      role: (serverProfile as any)?.role ?? "Student",
      avatarUrl: media.avatarUrl || null,
      coverUrl,
      bio,
      email,
      location,
      website,
      weeklyGoal: weeklyGoal == null ? null : Number(weeklyGoal),
      timezone: String(timezone || "UTC"),
      xp: xp == null ? null : Number(xp),
    };
  }, [serverProfile, media.avatarUrl]);

  const isLoading = meQ.isLoading || media.loading;
  const meError = meQ.isError;

  async function onSave() {
    if (!serverProfile?.uid) return;

    const display = form.display_name.trim();
    const tz = form.timezone.trim();

    const payload: any = {
      display_name: display ? display : null,
      timezone: tz ? tz : "UTC",
    };

    const w = form.weekly_goal.trim();
    if (w === "") payload.weekly_goal = null;
    else {
      const n = Number(w);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        alert("Weekly goal باید عدد صحیحِ غیرمنفی باشد");
        return;
      }
      payload.weekly_goal = n;
    }

    await updateM.mutateAsync(payload);
    setEditOpen(false);
  }

  // --- motion presets ---
  const pageIn = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

  const softFade = reduceMotion
    ? {}
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };

  const tabPanel = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -6 } };

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <motion.div
          {...pageIn}
          transition={{ duration: 0.4, ease: EASE }}
          className="rounded-[28px] border border-zinc-200 bg-white shadow-sm overflow-hidden"
        >
          {/* Cover */}
          <div className="relative h-52 sm:h-60">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 via-violet-200 to-sky-200" />

            {/* subtle animated glow */}
            {!reduceMotion ? (
              <motion.div
                className="absolute inset-0 opacity-70"
                animate={{ opacity: [0.55, 0.8, 0.55] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background:
                    "radial-gradient(circle at 20% 25%, rgba(255,255,255,0.85), transparent 45%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.08), transparent 55%)",
                }}
              />
            ) : (
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(circle at 20% 25%, rgba(255,255,255,0.85), transparent 45%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.08), transparent 55%)",
                }}
              />
            )}

            {p.coverUrl ? (
              <img
                src={p.coverUrl}
                alt="cover"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}

            {/* Top controls */}
            <div className="absolute left-4 top-4 right-4 flex items-center justify-between">
              <motion.button
                type="button"
                onClick={() => navigate(-1)}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/70 backdrop-blur px-3 py-2 text-sm font-semibold text-zinc-800 border border-white/60 shadow-sm hover:bg-white/90 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </motion.button>
            </div>
          </div>

          {/* Header row */}
          <div className="relative px-5 sm:px-7 pb-6">
            {/* Avatar */}
            <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2">
              <motion.div
                layoutId="profile-avatar"
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-white bg-zinc-100 overflow-hidden shadow-md"
                whileHover={reduceMotion ? undefined : { y: -2 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(250,204,21,0.35),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.05),transparent_60%)]" />
                )}
              </motion.div>
            </div>

            <div className="pt-14 sm:pt-16">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="text-lg sm:text-xl font-semibold text-zinc-900">
                    {isLoading ? <ShimmerLine w="w-44" /> : p.fullName}
                  </div>

                  <div className="mt-1 text-sm text-zinc-500">
                    @{isLoading ? "…" : p.username} · {p.role ?? "Student"}
                  </div>

                  <div className="mt-1 text-xs text-zinc-500">
                    Timezone: {isLoading ? "…" : p.timezone}
                  </div>
                </div>

                {/* Tiny metrics (only 2) */}
                <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
                  <MiniChip label="Weekly goal" value={p.weeklyGoal == null ? "—" : `${p.weeklyGoal}m`} />
                  <MiniChip label="XP" value={p.xp == null ? "—" : String(p.xp)} />
                </div>
              </div>

              {meError ? (
                <motion.div
                  {...softFade}
                  transition={{ duration: 0.25 }}
                  className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  خطا در دریافت پروفایل: {getErrorMessage(meQ.error)}
                </motion.div>
              ) : null}

              {/* Tabs */}
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-[#F7F8FA] p-1 flex items-center gap-1">
                <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
                  Profile
                </TabButton>
                <TabButton active={tab === "stats"} onClick={() => setTab("stats")}>
                  Stats
                </TabButton>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="border-t border-zinc-200 bg-white">
            <div className="p-5 sm:p-7">
              <AnimatePresence mode="wait">
                {tab === "profile" ? (
                  <motion.div
                    key="profile"
                    {...tabPanel}
                    transition={{ duration: 0.28, ease: EASE }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-5"
                  >
                    {/* About card */}
                    <div className="lg:col-span-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                      <div className="text-sm font-semibold text-zinc-900">Introduction</div>

                      <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                        {isLoading ? <ShimmerBlock /> : p.bio ?? "—"}
                      </p>

                      {/* Only show if exists */}
                      <div className="mt-4 space-y-3 text-sm">
                        {p.email ? <InfoRow icon={<Mail className="h-4 w-4" />} value={p.email} /> : null}
                        {p.location ? <InfoRow icon={<MapPin className="h-4 w-4" />} value={p.location} /> : null}
                        {p.website ? <InfoRow icon={<LinkIcon className="h-4 w-4" />} value={p.website} /> : null}
                      </div>

                      {media.error ? (
                        <div className="mt-4 text-xs text-red-600">Avatar error: {media.error}</div>
                      ) : null}
                    </div>

                    {/* Right side minimal */}
                    <div className="lg:col-span-2">
                      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-zinc-900">Summary</p>
                            <p className="mt-1 text-xs text-zinc-500">Just the essentials.</p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <MiniMetric title="Weekly goal (min)" value={p.weeklyGoal == null ? "—" : String(p.weeklyGoal)} />
                          <MiniMetric title="XP" value={p.xp == null ? "—" : String(p.xp)} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="stats"
                    {...tabPanel}
                    transition={{ duration: 0.28, ease: EASE }}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                  >
                    <div className="text-sm font-semibold text-zinc-900">Stats</div>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <MiniMetric title="Weekly goal" value={p.weeklyGoal == null ? "—" : `${p.weeklyGoal} min`} />
                      <MiniMetric title="XP" value={p.xp == null ? "—" : String(p.xp)} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <button
              className="absolute inset-0 bg-black/30"
              onClick={() => setEditOpen(false)}
              aria-label="close"
            />

            <motion.div
              layoutId="profile-modal"
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.22, ease: EASE }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-900">Edit profile</div>
                <button
                  className="rounded-lg p-2 hover:bg-zinc-100 transition"
                  onClick={() => setEditOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <Field
                  label="Display name"
                  value={form.display_name}
                  onChange={(v) => setForm((s) => ({ ...s, display_name: v }))}
                />
                <Field
                  label="Timezone"
                  value={form.timezone}
                  onChange={(v) => setForm((s) => ({ ...s, timezone: v }))}
                  placeholder="UTC"
                />
                <Field
                  label="Weekly goal (min)"
                  value={form.weekly_goal}
                  onChange={(v) => setForm((s) => ({ ...s, weekly_goal: v }))}
                  placeholder="150"
                />

                {updateM.isError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    ذخیره انجام نشد: {getErrorMessage(updateM.error)}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={updateM.isPending}
                  onClick={onSave}
                >
                  {updateM.isPending ? "Saving…" : "Save"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Small components ---------- */

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-zinc-700">{label}</div>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
      />
    </label>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition",
        active
          ? "bg-white border border-zinc-200 text-zinc-900 shadow-sm"
          : "text-zinc-600 hover:bg-white/60"
      )}
    >
      {children}
    </button>
  );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-zinc-700">
      <span className="text-zinc-500">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function MiniMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="text-xs font-semibold text-zinc-700">{title}</div>
      <div className="mt-1 text-sm text-zinc-900">{value}</div>
    </div>
  );
}

function MiniChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur px-4 py-3 shadow-sm">
      <div className="text-[11px] font-semibold text-zinc-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

/* --- Loading skeletons --- */

function ShimmerLine({ w }: { w: string }) {
  return (
    <span className={cn("inline-block h-5 rounded-lg bg-zinc-200/80", w, "relative overflow-hidden align-middle")}>
      <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      <style>{`
        @keyframes shimmer { 100% { transform: translateX(200%); } }
      `}</style>
    </span>
  );
}

function ShimmerBlock() {
  return (
    <div className="space-y-2">
      <div className="h-3 rounded bg-zinc-200/80 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      </div>
      <div className="h-3 w-5/6 rounded bg-zinc-200/80 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      </div>
      <div className="h-3 w-2/3 rounded bg-zinc-200/80 relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      </div>
      <style>{`
        @keyframes shimmer { 100% { transform: translateX(200%); } }
      `}</style>
    </div>
  );
}
