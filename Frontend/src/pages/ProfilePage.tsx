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
  Loader2,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useProfileInfoMe } from "@/hooks/useProfileInfoMe";
import { useProfileInfoDashboard } from "@/hooks/useProfileInfoDashboard";
import { useUpdateProfileInfo } from "@/hooks/useUpdateProfileInfo";
import { useFollowCounts } from "@/hooks/useConnectionsLists";
import { useFollowStatus } from "@/hooks/useFollowStatus";
import { useFollowUser, useUnfollowUser } from "@/hooks/useFollowMutations";
import { useMyGroups } from "@/hooks/useGroups";
import { useSubjects } from "@/hooks/useStudy";
import { useMedia } from "@/hooks/useMedia";

import { generateProfileIntroduction } from "@/utils/profileIntro";
import { profileApi } from "@/api/profile";
import { getUserAvatarUrl } from "@/api/media";

type EditForm = {
  display_name: string;
  timezone: string;
  weekly_goal: string;
};

type PublicProfile = {
  uid: number;
  display_name?: string | null;
  username?: string | null;
  timezone?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
};

function cx(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function toUiErrorMessage(e: unknown) {
  const err = e as any;
  if (err?.message === "SERVER_ERROR_HTML_RESPONSE") return "Server error (check backend logs).";
  if (err?.message === "UNAUTHENTICATED") return "You are not authenticated.";
  return err?.message || "Unknown error";
}

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

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

function Avatar({ url }: { url?: string | null }) {
  const [ok, setOk] = React.useState(true);
  React.useEffect(() => setOk(true), [url]);

  const hasUrl = typeof url === "string" && url.trim().length > 0;

  return (
    <div className="h-14 w-14 rounded-3xl border border-white/70 bg-white/40 overflow-hidden shadow-sm">
      {hasUrl && ok ? (
        <img
          src={url!}
          alt="avatar"
          className="h-full w-full object-cover"
          onError={() => setOk(false)}
        />
      ) : (
        <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(250,204,21,0.45),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.06),transparent_60%)]" />
      )}
    </div>
  );
}

function MiniChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/70 backdrop-blur px-3 py-2 shadow-sm">
      <div className="text-[10px] font-semibold text-zinc-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-zinc-900">{value}</div>
    </div>
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

export default function ProfilePage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const qc = useQueryClient();
  const params = useParams<{ uid?: string }>();

  const viewingOther = params.uid != null;
  const routeUid = Number(params.uid);

  // ✅ همه‌ی hookها همیشه باید اجرا شوند (قبل از هر return)
  const meQ = useProfileInfoMe();
  const dashQ = useProfileInfoDashboard();
  const updateM = useUpdateProfileInfo();
  const groupsQ = useMyGroups();
  const subjectsQ = useSubjects();

  // self profile (ممکن است undefined باشد)
  const selfProfile = meQ.data?.profile as any | undefined;
  const myUid = Number(selfProfile?.uid);

  const targetUid = useMemo(() => {
    if (viewingOther) return Number.isFinite(routeUid) ? routeUid : NaN;
    return Number.isFinite(myUid) ? myUid : NaN;
  }, [viewingOther, routeUid, myUid]);

  const safeTargetUid = Number.isFinite(targetUid) && targetUid > 0 ? targetUid : undefined;

  // self vs other
  const isSelf = !viewingOther && Number.isFinite(myUid) && myUid === targetUid;

  // ✅ media همیشه باید hookش صدا زده شود (خود hook باید enabled/safe داخلی داشته باشد)
  const media = useMedia(isSelf);

  // public profile info
  const publicQ = useQuery({
    queryKey: ["profile.public", safeTargetUid],
    enabled: viewingOther && !!safeTargetUid,
    queryFn: async () => {
      const items = await profileApi.getPublicProfilesBatch([safeTargetUid!]);
      const raw = items?.[0] as any;
      if (!raw) return null;

      const p: PublicProfile = {
        uid: Number(raw.uid),
        display_name: raw.display_name ?? raw.displayName ?? null,
        username: raw.username ?? null,
        timezone: raw.timezone ?? null,
        bio: raw.bio ?? null,
        location: raw.location ?? null,
        website: raw.website ?? null,
      };
      return p;
    },
    staleTime: 30_000,
  });

  // follow info (hookها همیشه صدا زده می‌شوند)
  const countsQ = useFollowCounts(safeTargetUid);
  const statusQ = useFollowStatus(safeTargetUid);

  const followMut = useFollowUser({ myUid });
  const unfollowMut = useUnfollowUser({ myUid });

  // optimistic
  const [followersDelta, setFollowersDelta] = useState(0);
  const [followingOverride, setFollowingOverride] = useState<boolean | null>(null);

  React.useEffect(() => {
    setFollowersDelta(0);
    setFollowingOverride(null);
  }, [safeTargetUid]);

  // edit self
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState<EditForm>({
    display_name: "",
    timezone: "UTC",
    weekly_goal: "",
  });

  React.useEffect(() => {
    if (!isSelf) return;
    if (!selfProfile) return;
    setForm({
      display_name: String(selfProfile.display_name ?? ""),
      timezone: String(selfProfile.timezone ?? "UTC"),
      weekly_goal: selfProfile.weekly_goal == null ? "" : String(selfProfile.weekly_goal),
    });
  }, [isSelf, selfProfile?.uid]);

  // ✅ profile را قبل از returnها مشخص کن (ممکن است undefined/null باشد)
  const profile = viewingOther ? publicQ.data : selfProfile;

  const displayName = (profile as any)?.display_name ?? "—";
  const username = (profile as any)?.username ?? "user";
  const timezone = (profile as any)?.timezone ?? "UTC";

  const avatarUrl = viewingOther
    ? (safeTargetUid ? getUserAvatarUrl(safeTargetUid, { bustCache: true }) : null)
    : media.avatarUrl;

  const baseFollowers = countsQ.isError ? 0 : Number((countsQ.data as any)?.followers ?? 0);
  const baseFollowing = countsQ.isError ? 0 : Number((countsQ.data as any)?.following ?? 0);

  const followersCount = Math.max(0, baseFollowers + followersDelta);
  const followingCount = baseFollowing;

  const isPublicLoading = viewingOther && publicQ.isLoading;

  const isFollowing = viewingOther
    ? (followingOverride ?? (statusQ.data?.isFollowing ?? false))
    : false;

  const canFollow =
    viewingOther &&
    Number.isFinite(myUid) &&
    !!safeTargetUid &&
    safeTargetUid !== myUid;

  const followBusy =
    followMut.isPending || unfollowMut.isPending || statusQ.isLoading;

  const todayMinutes = !viewingOther ? Number(dashQ.data?.todayStudyMinutes ?? 0) : 0;

  // ✅ این useMemo ها باید همیشه اجرا شوند (قبل از هر return)
  const autoIntro = useMemo(() => {
    if (viewingOther) return "";
    if (!selfProfile) return "";
    return generateProfileIntroduction({
      displayName: selfProfile?.display_name ?? null,
      groups: (groupsQ.data as any) ?? [],
      subjects: (subjectsQ.data as any) ?? [],
      weeklyGoal: selfProfile?.weekly_goal ?? null,
    });
  }, [viewingOther, selfProfile, groupsQ.data, subjectsQ.data]);

  const introText = useMemo(() => {
    const bio = (profile as any)?.bio?.trim?.() ? String((profile as any)?.bio).trim() : "";
    if (bio) return bio;
    if (!viewingOther) return autoIntro;
    return "This user hasn’t added a bio yet.";
  }, [profile, viewingOther, autoIntro]);

  // ✅ guard route uid invalid (بعد از hookها)
  if (viewingOther && !Number.isFinite(routeUid)) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
            Invalid user id in route.
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

  // ✅ self requires me profile
  if (!viewingOther && meQ.isLoading) {
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

  if (!viewingOther && (meQ.isError || !selfProfile)) {
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

  async function onSave() {
    const display = form.display_name.trim();
    const tz = form.timezone.trim() || "UTC";

    const payload: any = { display_name: display ? display : null, timezone: tz };

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

  const onToggleFollow = () => {
    if (!canFollow || !safeTargetUid) return;

    const wasFollowing = isFollowing;
    const delta = wasFollowing ? -1 : +1;

    // ✅ UI لحظه‌ای تغییر کنه
    setFollowersDelta((d) => d + delta);
    setFollowingOverride(!wasFollowing);

    const rollback = () => {
      setFollowersDelta((d) => d - delta);
      setFollowingOverride(wasFollowing);
    };

    const onSettled = () => {
      setFollowingOverride(null);
      // ✅ queryKey های درست
      qc.invalidateQueries({ queryKey: ["followCounts"] });
      qc.invalidateQueries({ queryKey: ["followStatus"] });
      qc.invalidateQueries({ queryKey: ["followCounts", safeTargetUid] });
      qc.invalidateQueries({ queryKey: ["followStatus", safeTargetUid] });
    };

    if (wasFollowing) {
      unfollowMut.mutate(safeTargetUid, { onError: rollback, onSettled });
    } else {
      followMut.mutate(safeTargetUid, { onError: rollback, onSettled });
    }
  };

  const pageIn = reduceMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-screen bg-creamtext">
      <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          {...pageIn}
          transition={{ duration: 0.35, ease: EASE }}
          className="rounded-3xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
        >
          <div className="relative p-5 sm:p-6 lg:p-7 bg-gradient-to-r from-indigo-100 via-violet-100 to-sky-100">
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
                {!viewingOther ? (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate("/settings")}
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
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={!canFollow || followBusy}
                      onClick={onToggleFollow}
                      className={cx(
                        "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition",
                        "border border-white/60 shadow-sm",
                        isFollowing
                          ? "bg-yellow-100/80 text-yellow-900 hover:bg-yellow-200/80"
                          : "bg-white/70 text-zinc-800 hover:bg-white/90",
                        (!canFollow || followBusy) ? "opacity-60 cursor-not-allowed" : ""
                      )}
                    >
                      {followBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isFollowing ? (
                        <UserCheck className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      )}
                      {isFollowing ? "Unfollow" : "Follow"}
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate("/connections")}
                      className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 transition"
                    >
                      <Users className="h-4 w-4" />
                      Connections
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="mt-5 flex items-start gap-4">
              <Avatar url={avatarUrl} />

              <div className="min-w-0 flex-1">
                {isPublicLoading ? (
                  <div className="space-y-2">
                    <div className="h-5 w-2/3 rounded bg-white/60 animate-pulse" />
                    <div className="h-4 w-1/2 rounded bg-white/50 animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="text-xl font-semibold text-zinc-900 truncate">{displayName}</div>
                    <div className="mt-1 text-sm text-zinc-600 truncate">
                      @{username} · <span className="text-zinc-500">{timezone}</span>
                    </div>
                  </>
                )}

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <MiniChip label="Followers" value={String(followersCount)} />
                  <MiniChip label="Following" value={String(followingCount)} />
                  <MiniChip
                    label="Weekly"
                    value={!viewingOther ? (selfProfile?.weekly_goal == null ? "—" : `${selfProfile.weekly_goal}m`) : "—"}
                  />
                  <MiniChip label="Today" value={!viewingOther ? `${todayMinutes}m` : "—"} />
                </div>

                {countsQ.isError ? (
                  <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Failed to load follow counts: {toUiErrorMessage(countsQ.error)}
                  </div>
                ) : null}

                {viewingOther && publicQ.isError ? (
                  <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Failed to load public profile: {toUiErrorMessage(publicQ.error)}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-200 bg-white">
            <div className="p-4 sm:p-6 lg:p-7 grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">Introduction</div>
                    <div className="mt-0.5 text-xs text-zinc-500">
                      {!viewingOther ? "Auto-generated if your bio is empty." : "Public info"}
                    </div>
                  </div>
                </div>

                {!viewingOther && (groupsQ.isLoading || subjectsQ.isLoading) ? (
                  <div className="mt-3">
                    <ShimmerBlock />
                  </div>
                ) : isPublicLoading ? (
                  <div className="mt-3 space-y-2">
                    <div className="h-3 w-11/12 rounded bg-zinc-200/80 animate-pulse" />
                    <div className="h-3 w-10/12 rounded bg-zinc-200/80 animate-pulse" />
                    <div className="h-3 w-8/12 rounded bg-zinc-200/80 animate-pulse" />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-zinc-700 leading-relaxed">{introText}</p>
                )}

                {!viewingOther && (groupsQ.isError || subjectsQ.isError) ? (
                  <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Failed to load groups/subjects for intro.{" "}
                    {groupsQ.isError ? `Groups: ${toUiErrorMessage(groupsQ.error)} ` : ""}
                    {subjectsQ.isError ? `Subjects: ${toUiErrorMessage(subjectsQ.error)}` : ""}
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  {!viewingOther && selfProfile?.email ? (
                    <InfoPill icon={<Mail className="h-4 w-4" />} value={selfProfile.email} />
                  ) : null}

                  {(profile as any)?.location ? (
                    <InfoPill icon={<MapPin className="h-4 w-4" />} value={(profile as any).location} />
                  ) : null}

                  {(profile as any)?.website ? (
                    <InfoPill icon={<LinkIcon className="h-4 w-4" />} value={(profile as any).website} />
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                {!viewingOther ? (
                  <>
                    <StatCard label="XP" value={selfProfile?.xp == null ? "—" : String(selfProfile.xp)} />
                    <StatCard
                      label="Weekly goal"
                      value={selfProfile?.weekly_goal == null ? "—" : `${selfProfile.weekly_goal} minutes`}
                    />
                    <StatCard label="Today study" value={`${todayMinutes} minutes`} />
                  </>
                ) : (
                  <>
                    <StatCard label="Followers" value={followersCount} />
                    <StatCard label="Following" value={followingCount} />
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {!viewingOther && editOpen ? (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <button className="absolute inset-0 bg-black/30" onClick={() => setEditOpen(false)} aria-label="close" />

            <motion.div
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE }}
              className="relative z-10 w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-zinc-900">Edit profile</div>
                <button className="rounded-xl p-2 hover:bg-zinc-100 transition" onClick={() => setEditOpen(false)}>
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
