import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  UserCheck,
  MapPin,
  Link as LinkIcon,
  Mail,
  Pencil,
} from "lucide-react";

type Profile = {
  fullName: string;
  username: string;
  role?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  bio?: string;
  email?: string;
  location?: string;
  website?: string;

  followers: number;
  following: number;

  // optional stats for your app
  focusMinutes?: number;
  streakDays?: number;
};

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function ProfilePage() {
  // بعداً اینو از API/Context میاری
  const p = useMemo<Profile>(
    () => ({
      fullName: "Mathew Anderson",
      username: "mathew",
      role: "Student",
      avatarUrl: null,
      coverUrl: null,
      bio:
        "I study consistently and I like calm focus sessions. Rain + piano is my favorite mix.",
      email: "mathew@example.com",
      location: "Tehran, IR",
      website: "example.com",
      followers: 3586,
      following: 2659,
      focusMinutes: 1240,
      streakDays: 12,
    }),
    []
  );

  const [tab, setTab] = useState<"profile" | "followers" | "following">("profile");

  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="rounded-[28px] border border-zinc-200 bg-white shadow-sm overflow-hidden"
        >
          {/* Cover */}
          <div className="relative h-52 sm:h-60 bg-gradient-to-r from-indigo-200 via-violet-200 to-sky-200">
            {p.coverUrl ? (
              <img
                src={p.coverUrl}
                alt="cover"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.8),transparent_45%),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.06),transparent_55%)]" />
              </>
            )}
          </div>

          {/* Header row */}
          <div className="relative px-5 sm:px-7 pb-6">
            {/* Avatar */}
            <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-white bg-zinc-100 overflow-hidden shadow-md">
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(250,204,21,0.35),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,0,0,0.05),transparent_60%)]" />
                )}
              </div>
            </div>

            {/* Stats + name */}
            <div className="pt-14 sm:pt-16">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="text-lg sm:text-xl font-semibold text-zinc-900">
                    {p.fullName}
                  </div>
                  <div className="mt-1 text-sm text-zinc-500">
                    @{p.username} · {p.role ?? "Student"}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center sm:justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:border-yellow-300 hover:bg-yellow-50 transition"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Numbers row (بدون posts) */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox label="Followers" value={p.followers} icon={<UserCheck className="h-4 w-4" />} />
                <StatBox label="Following" value={p.following} icon={<UserPlus className="h-4 w-4" />} />
                <StatBox label="Focus (min)" value={p.focusMinutes ?? 0} icon={<span className="text-sm">⏱️</span>} />
                <StatBox label="Streak (days)" value={p.streakDays ?? 0} icon={<span className="text-sm">🔥</span>} />
              </div>

              {/* Tabs */}
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-[#F7F8FA] p-1 flex items-center gap-1">
                <TabButton active={tab === "profile"} onClick={() => setTab("profile")}>
                  Profile
                </TabButton>
                <TabButton active={tab === "followers"} onClick={() => setTab("followers")}>
                  Followers
                </TabButton>
                <TabButton active={tab === "following"} onClick={() => setTab("following")}>
                  Following
                </TabButton>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="border-t border-zinc-200 bg-white">
            <div className="p-5 sm:p-7">
              {tab === "profile" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* About card */}
                  <div className="lg:col-span-1 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="text-sm font-semibold text-zinc-900">Introduction</div>
                    <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                      {p.bio ?? "—"}
                    </p>

                    <div className="mt-4 space-y-3 text-sm">
                      <InfoRow icon={<Mail className="h-4 w-4" />} value={p.email ?? "—"} />
                      <InfoRow icon={<MapPin className="h-4 w-4" />} value={p.location ?? "—"} />
                      <InfoRow icon={<LinkIcon className="h-4 w-4" />} value={p.website ?? "—"} />
                    </div>
                  </div>

                  {/* Right area (no posts) */}
                  <div className="lg:col-span-2 space-y-5">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-zinc-900">Study summary</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            A quick overview of your focus habits.
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-yellow-100/60 px-3 py-1 text-[11px] font-semibold text-yellow-800">
                          <Users className="h-3.5 w-3.5" />
                          Connections
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <MiniMetric title="Weekly goal" value="5 sessions" />
                        <MiniMetric title="Preferred sounds" value="Rain · Piano" />
                        <MiniMetric title="Best time" value="Night" />
                        <MiniMetric title="Consistency" value="Good" />
                      </div>
                    </div>

                  </div>
                </div>
              ) : tab === "followers" ? (
                <ConnectionsList mode="followers" />
              ) : (
                <ConnectionsList mode="following" />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- Small components ---------- */

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-xs text-zinc-500">{label}</div>
        <div className="text-zinc-500">{icon}</div>
      </div>
      <div className="mt-1 text-lg font-semibold text-zinc-900">
        {value.toLocaleString()}
      </div>
    </div>
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
      className={[
        "flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition",
        active
          ? "bg-white border border-zinc-200 text-zinc-900 shadow-sm"
          : "text-zinc-600 hover:bg-white/60",
      ].join(" ")}
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

function ConnectionsList({ mode }: { mode: "followers" | "following" }) {
  // این‌ها mock هستند؛ بعداً از API می‌گیری
  const data =
    mode === "followers"
      ? [
          { id: 1, name: "Sara M", user: "@saram" },
          { id: 2, name: "Ali Reza", user: "@alireza" },
        ]
      : [{ id: 3, name: "Study Group", user: "@studygroup" }];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-zinc-900">
        {mode === "followers" ? "Followers" : "Following"}
      </div>
      <div className="mt-3 space-y-3">
        {data.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="font-medium text-zinc-900">{u.name}</div>
              <div className="text-xs text-zinc-500 truncate">{u.user}</div>
            </div>

            {mode === "followers" ? (
              <button className="rounded-lg bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800 hover:bg-yellow-200 transition">
                Remove
              </button>
            ) : (
              <button className="rounded-lg bg-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-300 transition">
                Unfollow
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
