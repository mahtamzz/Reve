// src/pages/ProfilePage.tsx
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  Pencil,
  Users,
  Mail,
  MapPin,
  Link as LinkIcon,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useProfileInfoMe } from "@/hooks/useProfileInfoMe";
import { useProfileInfoDashboard } from "@/hooks/useProfileInfoDashboard";
import { useUpdateProfileInfo } from "@/hooks/useUpdateProfileInfo";
import { useFollowCounts } from "@/hooks/useConnectionsLists";
import { useMyGroups } from "@/hooks/useGroups";
import { useSubjects } from "@/hooks/useStudy";

import { generateProfileIntroduction } from "@/utils/profileIntro";

type EditForm = {
  display_name: string;
  timezone: string;
  weekly_goal: string;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function toUiErrorMessage(e: unknown) {
  const err = e as any;
  if (err?.message === "SERVER_ERROR_HTML_RESPONSE") return "Server error (check backend logs).";
  return err?.message || "Unknown error";
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function ProfilePage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [editOpen, setEditOpen] = useState(false);

  const meQ = useProfileInfoMe();
  const dashQ = useProfileInfoDashboard();
  const updateM = useUpdateProfileInfo();

  const groupsQ = useMyGroups();
  const subjectsQ = useSubjects();

  const profile = meQ.data?.profile;
  const uid = Number(profile?.uid);

  const countsQ = useFollowCounts(Number.isFinite(uid) ? uid : undefined);

  const [form, setForm] = useState<EditForm>({
    display_name: "",
    timezone: "UTC",
    weekly_goal: "",
  });

  React.useEffect(() => {
    if (!profile) return;
    setForm({
      display_name: String((profile as any).display_name ?? ""),
      timezone: String((profile as any).timezone ?? "UTC"),
      weekly_goal:
        (profile as any).weekly_goal == null ? "" : String((profile as any).weekly_goal),
    });
  }, [profile?.uid]);

  const autoIntro = useMemo(() => {
    return generateProfileIntroduction({
      displayName: (profile as any)?.display_name ?? null,
      groups: (groupsQ.data as any) ?? [],
      subjects: (subjectsQ.data as any) ?? [],
      weeklyGoal: (profile as any)?.weekly_goal ?? null,
    });
  }, [profile, groupsQ.data, subjectsQ.data]);

  const introText = (profile as any)?.bio?.trim() ? (profile as any).bio : autoIntro;

  const todayMinutes = Number(dashQ.data?.todayStudyMinutes ?? 0);

  const followersCount = countsQ.isError ? 0 : Number(countsQ.data?.followers ?? 0);
  const followingCount = countsQ.isError ? 0 : Number(countsQ.data?.following ?? 0);

  async function onSave() {
    const display = form.display_name.trim();
    const timezone = form.timezone.trim() || "UTC";

    const payload: any = {
      display_name: display ? display : null,
      timezone,
    };

    const w = form.weekly_goal.trim();
    if (w === "") payload.weekly_goal = null;
    else {
      const n = Number(w);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
        alert("Weekly goal must be a non-negative integer.");
        return;
      }
      payload.weekly_goal = n;
    }

    await updateM.mutateAsync(payload);
    setEditOpen(false);
  }

  const pageIn = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  if (meQ.isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
            Loading profile…
          </div>
        </div>
      </div>
    );
  }

  if (meQ.isError || !profile) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Failed to load profile: {toUiErrorMessage(meQ.error)}
          </div>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mt-3 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 transition"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto max-w-4xl px-4 py-5">
        <motion.div
          {...pageIn}
          transition={{ duration: 0.35, ease: EASE }}
          className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-5 bg-gradient-to-r from-indigo-100 via-violet-100 to-sky-100">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/70 backdrop-blur px-3 py-2 text-sm font-semibold text-zinc-800 border border-white/60 shadow-sm hover:bg-white/90 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/70 backdrop-blur px-3 py-2 text-sm font-semibold text-zinc-800 border border-white/60 shadow-sm hover:bg-white/90 transition"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/connections")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition"
                >
                  <Users className="h-4 w-4" />
                  Connections
                </button>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xl font-semibold text-zinc-900">
                {(profile as any).display_name ?? "—"}
              </div>
              <div className="mt-1 text-sm text-zinc-600">
                @{(profile as any).username ?? "user"} ·{" "}
                <span className="text-zinc-500">{(profile as any).timezone ?? "UTC"}</span>
              </div>

              {/* Compact chips */}
              <div className="mt-4 grid grid-cols-4 gap-2">
                <MiniChip label="Followers" value={String(followersCount)} />
                <MiniChip label="Following" value={String(followingCount)} />
                <MiniChip
                  label="Weekly"
                  value={
                    (profile as any).weekly_goal == null
                      ? "—"
                      : `${(profile as any).weekly_goal}m`
                  }
                />
                <MiniChip label="Today" value={`${todayMinutes}m`} />
              </div>

              {countsQ.isError ? (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Failed to load follow counts: {toUiErrorMessage(countsQ.error)}
                </div>
              ) : null}
            </div>
          </div>

          {/* Body */}
          <div className="border-t border-zinc-200 bg-white">
            <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">Introduction</div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      Auto-generated if your bio is empty.
                    </div>
                  </div>
                </div>

                {/* FIX: no div inside p */}
                {meQ.isLoading || groupsQ.isLoading || subjectsQ.isLoading ? (
                  <div className="mt-3">
                    <ShimmerBlock />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-zinc-700 leading-relaxed">
                    {introText}
                  </p>
                )}

                {(groupsQ.isError || subjectsQ.isError) && (
                  <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Failed to load groups/subjects for intro.{" "}
                    {groupsQ.isError ? `Groups: ${toUiErrorMessage(groupsQ.error)} ` : ""}
                    {subjectsQ.isError ? `Subjects: ${toUiErrorMessage(subjectsQ.error)}` : ""}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  {(profile as any).email ? (
                    <InfoPill icon={<Mail className="h-4 w-4" />} value={(profile as any).email} />
                  ) : null}
                  {(profile as any).location ? (
                    <InfoPill
                      icon={<MapPin className="h-4 w-4" />}
                      value={(profile as any).location}
                    />
                  ) : null}
                  {(profile as any).website ? (
                    <InfoPill
                      icon={<LinkIcon className="h-4 w-4" />}
                      value={(profile as any).website}
                    />
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <StatCard label="XP" value={(profile as any).xp == null ? "—" : String((profile as any).xp)} />
                <StatCard
                  label="Weekly goal"
                  value={
                    (profile as any).weekly_goal == null
                      ? "—"
                      : `${(profile as any).weekly_goal} minutes`
                  }
                />
                <StatCard label="Today study" value={`${todayMinutes} minutes`} />
                <button
                  type="button"
                  onClick={() => navigate("/connections")}
                  className="w-full rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition"
                >
                  Open Connections
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <button
              className="absolute inset-0 bg-black/30"
              onClick={() => setEditOpen(false)}
              aria-label="close"
            />

            <motion.div
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-900">Edit profile</div>
                <button
                  className="rounded-xl p-2 hover:bg-zinc-100 transition"
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
                  label="Weekly goal (minutes)"
                  value={form.weekly_goal}
                  onChange={(v) => setForm((s) => ({ ...s, weekly_goal: v }))}
                  placeholder="150"
                />

                {updateM.isError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Save failed: {toUiErrorMessage(updateM.error)}
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

function InfoPill({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-700">
      <span className="text-zinc-500">{icon}</span>
      <span className="truncate text-sm">{value}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-zinc-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-zinc-900">{value}</div>
    </div>
  );
}

function MiniChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur px-3 py-2 shadow-sm">
      <div className="text-[10px] font-semibold text-zinc-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-zinc-900">{value}</div>
    </div>
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
      <style>{`@keyframes shimmer { 100% { transform: translateX(200%); } }`}</style>
    </div>
  );
}
