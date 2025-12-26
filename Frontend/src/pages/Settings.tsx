// src/pages/Settings.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail, User2, Camera, Check, X, Lock, ShieldAlert, Trash2 } from "lucide-react";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";
import { fetchWithAuth } from "@/utils/fetchWithAuth";
import { getAccessToken, logout } from "@/utils/authToken";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** ====== Profile service endpoints ====== **/
const API_GATEWAY = "http://localhost:8080/api";
const ME_URL = `${API_GATEWAY}/auth/me`;
const PROFILE_PATCH_URL = `${API_GATEWAY}/profile`;
const PASSWORD_URL = `${API_GATEWAY}/profile/password`;

/** ====== Media service endpoints (Swagger) ====== **/
const MEDIA_ORIGIN = "http://localhost:3004";
const MEDIA_AVATAR_URL = `${MEDIA_ORIGIN}/api/media/avatar`; // GET/POST/DELETE

type UserProfile = {
  id: number | string;
  username: string;
  email: string;
  fullName?: string | null;
  bio?: string | null;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-xl bg-zinc-200/60", className)} />;
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold text-zinc-600">
      {children}
    </span>
  );
}

function Toast({
  kind,
  title,
  message,
  onClose,
}: {
  kind: "success" | "error";
  title: string;
  message?: string;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="
        fixed right-6 top-24 z-50
        w-[min(360px,calc(100vw-24px))]
        rounded-3xl border border-zinc-200
        bg-white shadow-xl p-4
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cx("text-sm font-semibold", kind === "success" ? "text-emerald-700" : "text-rose-700")}>
            {title}
          </p>
          {message ? <p className="mt-1 text-xs text-zinc-600">{message}</p> : null}
        </div>

        <button
          onClick={onClose}
          className="rounded-xl border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-600 hover:text-zinc-900 hover:border-yellow-300 transition-colors"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}

function EditableRow({
  icon,
  label,
  helper,
  value,
  onSave,
  type = "text",
  placeholder,
  maxLength,
  multiline,
  disabled,
  rightHint,
}: {
  icon: React.ReactNode;
  label: string;
  helper?: string;
  value: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  disabled?: boolean;
  rightHint?: React.ReactNode;
  onSave: (next: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(value), [value]);

  const dirty = draft !== value;

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  const save = async () => {
    if (!dirty) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 h-9 w-9 rounded-2xl border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-600">
            {icon}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900">{label}</p>
            {helper ? <p className="mt-0.5 text-xs text-zinc-500">{helper}</p> : null}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {rightHint ? rightHint : null}

          {!editing ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setEditing(true)}
              className={cx(
                "rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition-all",
                disabled
                  ? "border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                  : "border-zinc-200 bg-white text-zinc-700 hover:-translate-y-0.5 hover:shadow-md hover:border-yellow-300 hover:text-zinc-900"
              )}
            >
              Edit
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={cancel}
                disabled={saving}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-yellow-300 hover:text-zinc-900 transition-colors"
              >
                <span className="inline-flex items-center gap-2">
                  <X className="h-4 w-4" /> Cancel
                </span>
              </button>

              <button
                type="button"
                onClick={save}
                disabled={saving || !dirty}
                className={cx(
                  "rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition-all",
                  saving || !dirty
                    ? "border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:-translate-y-0.5 hover:shadow-md"
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4">
        {!editing ? (
          <p className="text-sm text-zinc-800 break-words">{value || <span className="text-zinc-400">—</span>}</p>
        ) : multiline ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={maxLength}
            placeholder={placeholder}
            className="
              w-full min-h-[92px]
              rounded-2xl border border-zinc-200 bg-white
              px-4 py-3 text-sm text-zinc-900
              shadow-sm outline-none
              focus:border-yellow-300 focus:ring-2 focus:ring-yellow-100
            "
          />
        ) : (
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            type={type}
            maxLength={maxLength}
            placeholder={placeholder}
            className="
              w-full
              rounded-2xl border border-zinc-200 bg-white
              px-4 py-3 text-sm text-zinc-900
              shadow-sm outline-none
              focus:border-yellow-300 focus:ring-2 focus:ring-yellow-100
            "
          />
        )}

        {editing && maxLength ? (
          <p className="mt-2 text-[11px] text-zinc-500 tabular-nums">
            {draft.length}/{maxLength}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** ====== Media helpers ====== **/
async function mediaFetchAvatarBlob(): Promise<Blob | null> {
  const token = getAccessToken();
  if (!token) return null;

  const res = await fetch(MEDIA_AVATAR_URL, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });

  if (!res.ok) return null;
  return await res.blob();
}

async function mediaUploadAvatar(file: File): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error("UNAUTHENTICATED");

  const fd = new FormData();
  // ✅ طبق curl: -F 'file=@...'
  fd.append("file", file);

  const res = await fetch(MEDIA_AVATAR_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
    body: fd,
  });

  if (!res.ok) {
    let msg = "Avatar upload failed.";
    try {
      const j = await res.json();
      msg = j?.message ?? j?.error ?? msg;
    } catch {}
    throw new Error(msg);
  }
}

async function mediaDeleteAvatar(): Promise<void> {
  const token = getAccessToken();
  if (!token) throw new Error("UNAUTHENTICATED");

  const res = await fetch(MEDIA_AVATAR_URL, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });

  if (!res.ok) {
    let msg = "Avatar delete failed.";
    try {
      const j = await res.json();
      msg = j?.message ?? j?.error ?? msg;
    } catch {}
    throw new Error(msg);
  }
}

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<UserProfile | null>(null);

  const [toast, setToast] = useState<{ kind: "success" | "error"; title: string; message?: string } | null>(null);
  const closeToast = () => setToast(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  /** ====== Avatar state ====== **/
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarDeleting, setAvatarDeleting] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);

  // ✅ StrictMode-safe blob management
  const currentUrlRef = useRef<string | null>(null);
  const pendingRevokeRef = useRef<string[]>([]);

  const setAvatarObjectUrl = (nextUrl: string | null) => {
    const prev = currentUrlRef.current;
    currentUrlRef.current = nextUrl;
    setAvatarSrc(nextUrl);

    // قبلی رو نگه می‌داریم تا بعد از load تصویر revoke کنیم
    if (prev && prev !== nextUrl) pendingRevokeRef.current.push(prev);
  };

  const revokePending = () => {
    const list = pendingRevokeRef.current.splice(0, pendingRevokeRef.current.length);
    list.forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
  };

  const loadMyAvatar = async () => {
    const blob = await mediaFetchAvatarBlob();
    if (!blob) {
      setAvatarObjectUrl(null);
      // وقتی null شد هم pending رو می‌تونیم پاک کنیم
      revokePending();
      return;
    }
    const url = URL.createObjectURL(blob);
    setAvatarObjectUrl(url);
    // revoke رو نمی‌زنیم تا وقتی img load بشه
  };

  // cleanup (StrictMode causes quick unmount/mount in dev)
  useEffect(() => {
    return () => {
      const cur = currentUrlRef.current;
      const pend = [...pendingRevokeRef.current];

      // ✅ به‌جای revoke فوری، با تاخیر انجام بده تا مرورگر وسط load گیر نکند
      window.setTimeout(() => {
        try {
          if (cur) URL.revokeObjectURL(cur);
        } catch {}
        pend.forEach((u) => {
          try {
            URL.revokeObjectURL(u);
          } catch {}
        });
      }, 5000);
    };
  }, []);

  /** ====== Load me + avatar ====== **/
  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        const res = await fetchWithAuth(ME_URL);
        if (!res.ok) {
          await logout();
          return;
        }

        const data = await res.json().catch(() => null);
        const u = (data?.user ?? data) as any;

        const normalized: UserProfile = {
          id: u.id,
          username: u.username ?? "",
          email: u.email ?? "",
          fullName: u.fullName ?? u.name ?? null,
          bio: u.bio ?? null,
        };

        if (!mounted) return;
        setMe(normalized);

        await loadMyAvatar();
      } catch {
        await logout();
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** ====== Profile API ====== **/
  const patchProfile = async (payload: Partial<UserProfile>) => {
    const res = await fetchWithAuth(PROFILE_PATCH_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let msg = "Update failed.";
      try {
        const j = await res.json();
        msg = j?.message ?? j?.error ?? msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await res.json().catch(() => null);
    const u = (data?.user ?? data) as any;

    setMe((prev) =>
      prev
        ? {
            ...prev,
            username: u?.username ?? prev.username,
            email: u?.email ?? prev.email,
            fullName: u?.fullName ?? u?.name ?? prev.fullName,
            bio: u?.bio ?? prev.bio,
          }
        : prev
    );
  };

  const saveField = (field: keyof UserProfile) => async (next: string) => {
    if (!me) return;
    const prevValue = (me as any)[field];

    try {
      await patchProfile({ [field]: next } as any);
      setToast({ kind: "success", title: "Saved", message: `${field} updated successfully.` });
    } catch (e: any) {
      setToast({ kind: "error", title: "Couldn’t save", message: e?.message ?? "Try again." });
      setMe((p) => (p ? { ...p, [field]: prevValue } : p));
    }
  };

  /** ====== Avatar actions ====== **/
  const onPickAvatar = () => fileRef.current?.click();

  const onAvatarSelected = async (file: File | null) => {
    if (!file) return;

    // preview سریع
    const previewUrl = URL.createObjectURL(file);
    setAvatarObjectUrl(previewUrl);

    setAvatarUploading(true);
    try {
      await mediaUploadAvatar(file);
      await loadMyAvatar();
      setToast({ kind: "success", title: "Avatar updated" });
    } catch (e: any) {
      await loadMyAvatar();
      setToast({ kind: "error", title: "Couldn’t update avatar", message: e?.message ?? "Try again." });
    } finally {
      setAvatarUploading(false);
    }
  };

  const onDeleteAvatar = async () => {
    setAvatarDeleting(true);
    try {
      await mediaDeleteAvatar();
      setAvatarObjectUrl(null);
      setToast({ kind: "success", title: "Avatar deleted" });
    } catch (e: any) {
      setToast({ kind: "error", title: "Couldn’t delete avatar", message: e?.message ?? "Try again." });
    } finally {
      setAvatarDeleting(false);
    }
  };

  /** ====== Password modal ====== **/
  const [pwOpen, setPwOpen] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });

  const pwError = useMemo(() => {
    if (!pwOpen) return "";
    if (!pw.current || !pw.next || !pw.confirm) return "";
    if (pw.next.length < 8) return "New password must be at least 8 characters.";
    if (pw.next !== pw.confirm) return "Passwords do not match.";
    return "";
  }, [pw, pwOpen]);

  const savePassword = async () => {
    if (pwError) return;

    setPwSaving(true);
    try {
      const res = await fetchWithAuth(PASSWORD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      });

      if (!res.ok) {
        let msg = "Password update failed.";
        try {
          const j = await res.json();
          msg = j?.message ?? j?.error ?? msg;
        } catch {}
        throw new Error(msg);
      }

      setPwOpen(false);
      setPw({ current: "", next: "", confirm: "" });
      setToast({ kind: "success", title: "Password updated" });
    } catch (e: any) {
      setToast({ kind: "error", title: "Couldn’t update password", message: e?.message ?? "Try again." });
    } finally {
      setPwSaving(false);
    }
  };

  /** ====== UI states ====== **/
  if (loading) {
    return (
      <div className="min-h-screen bg-creamtext text-zinc-900 flex items-center justify-center">
        <div className="w-[min(560px,calc(100vw-32px))] space-y-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="min-h-screen bg-creamtext text-zinc-900 flex items-center justify-center">
        <p className="text-zinc-600">Session expired. Please login again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="settings" onLogout={logout} />

        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar username={me.username} />

          <div className="mx-auto max-w-6xl px-4 py-6">
            {/* Page header */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
            >
              <div>
                <p className="text-sm text-zinc-500">Settings</p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900">
                  Profile & account
                </h1>
                <p className="mt-1 text-sm text-zinc-600 max-w-2xl">
                  Manage your profile details. Changes are saved instantly.
                </p>
              </div>
            </motion.div>

            {/* Layout */}
            <div className="mt-6 grid grid-cols-12 gap-6">
              {/* Left: profile card */}
              <motion.section
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="col-span-12 lg:col-span-4"
              >
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                  <div className="pointer-events-none absolute -top-14 -right-16 h-52 w-52 rounded-full bg-yellow-200/40 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-yellow-100/60 blur-3xl" />

                  <div className="relative">
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="h-16 w-16 rounded-3xl border border-zinc-200 bg-gradient-to-br from-yellow-50 to-white shadow-sm overflow-hidden">
                          {avatarSrc ? (
                            <img
                              src={avatarSrc}
                              alt="avatar"
                              className="h-full w-full object-cover"
                              // ✅ وقتی تصویر جدید لود شد، URL های قبلی revoke شوند
                              onLoad={revokePending}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-zinc-500">
                              <User2 className="h-6 w-6" />
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={onPickAvatar}
                          disabled={avatarUploading || avatarDeleting}
                          className={cx(
                            "absolute -right-2 -bottom-2 rounded-2xl border px-2.5 py-2 shadow-sm transition-all",
                            avatarUploading || avatarDeleting
                              ? "border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                              : "border-zinc-200 bg-white text-zinc-700 hover:-translate-y-0.5 hover:shadow-md hover:border-yellow-300 hover:text-zinc-900"
                          )}
                          title="Change avatar"
                        >
                          <Camera className="h-4 w-4" />
                        </button>

                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => onAvatarSelected(e.target.files?.[0] ?? null)}
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-zinc-900 truncate">
                          {me.fullName?.trim() || me.username}
                        </p>
                        <p className="mt-0.5 text-sm text-zinc-600 truncate">{me.email}</p>

                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={onDeleteAvatar}
                            disabled={!avatarSrc || avatarUploading || avatarDeleting}
                            className={cx(
                              "rounded-2xl border px-3 py-2 text-xs font-semibold shadow-sm transition-all inline-flex items-center gap-2",
                              !avatarSrc || avatarUploading || avatarDeleting
                                ? "border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                                : "border-rose-200 bg-rose-50 text-rose-800 hover:-translate-y-0.5 hover:shadow-md"
                            )}
                            title="Delete avatar"
                          >
                            <Trash2 className="h-4 w-4" />
                            {avatarDeleting ? "Deleting..." : "Delete avatar"}
                          </button>

                          <button
                            type="button"
                            onClick={loadMyAvatar}
                            disabled={avatarUploading || avatarDeleting}
                            className={cx(
                              "rounded-2xl border px-3 py-2 text-xs font-semibold shadow-sm transition-all",
                              avatarUploading || avatarDeleting
                                ? "border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                                : "border-zinc-200 bg-white text-zinc-700 hover:border-yellow-300 hover:text-zinc-900"
                            )}
                          >
                            Refresh
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4">
                      <p className="text-xs font-semibold text-zinc-900">Security</p>
                      <p className="mt-1 text-xs text-zinc-600">
                        Keep your account safe — update password regularly.
                      </p>

                      <button
                        type="button"
                        onClick={() => setPwOpen(true)}
                        className="
                          mt-3 w-full rounded-2xl border border-zinc-200 bg-white
                          px-4 py-3 text-sm font-semibold text-zinc-800
                          hover:border-yellow-300 hover:bg-yellow-50 transition-colors
                          flex items-center justify-between
                        "
                      >
                        <span className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Change password
                        </span>
                        <span className="text-xs text-zinc-500">→</span>
                      </button>
                    </div>

                    <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 text-zinc-500 mt-0.5" />
                        <p className="text-xs text-zinc-600">
                          If your session expires, you’ll be logged out automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>

              {/* Right: editable fields */}
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <motion.section
                  initial={{ opacity: 0, y: 10, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut", delay: 0.03 }}
                  className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm"
                >
                  <div className="pointer-events-none absolute -top-16 -right-24 h-64 w-64 rounded-full bg-sky-300/15 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-rose-300/10 blur-3xl" />

                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">Profile</p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        Update how you appear across the app.
                      </p>
                    </div>
                    <Pill>Auto-save</Pill>
                  </div>

                  <div className="relative mt-5 grid grid-cols-1 gap-4">
                    <EditableRow
                      icon={<User2 className="h-4 w-4" />}
                      label="Full name"
                      helper="Shown on your profile and group pages."
                      value={me.fullName ?? ""}
                      placeholder="e.g. Sarah Johnson"
                      maxLength={40}
                      onSave={async (next) => {
                        await saveField("fullName")(next);
                        setMe((p) => (p ? { ...p, fullName: next } : p));
                      }}
                    />

                    <EditableRow
                      icon={<User2 className="h-4 w-4" />}
                      label="Username"
                      helper="This is your public handle."
                      value={me.username}
                      placeholder="e.g. study_queen"
                      maxLength={24}
                      onSave={async (next) => {
                        await saveField("username")(next);
                        setMe((p) => (p ? { ...p, username: next } : p));
                      }}
                    />

                    <EditableRow
                      icon={<Mail className="h-4 w-4" />}
                      label="Email"
                      helper="Used for login and notifications."
                      value={me.email}
                      type="email"
                      placeholder="you@example.com"
                      onSave={async (next) => {
                        await saveField("email")(next);
                        setMe((p) => (p ? { ...p, email: next } : p));
                      }}
                      rightHint={<span className="text-[11px] text-zinc-500">Verified</span>}
                    />

                    <EditableRow
                      icon={<User2 className="h-4 w-4" />}
                      label="Bio"
                      helper="A short line about you."
                      value={me.bio ?? ""}
                      placeholder="What are you studying these days?"
                      maxLength={160}
                      multiline
                      onSave={async (next) => {
                        await saveField("bio")(next);
                        setMe((p) => (p ? { ...p, bio: next } : p));
                      }}
                    />
                  </div>
                </motion.section>
              </div>
            </div>

            <footer className="mt-10 text-center text-xs text-zinc-400">REVE settings</footer>
          </div>

          {/* Toast */}
          <AnimatePresence>
            {toast ? (
              <Toast kind={toast.kind} title={toast.title} message={toast.message} onClose={closeToast} />
            ) : null}
          </AnimatePresence>

          {/* Password Modal */}
          <AnimatePresence>
            {pwOpen && (
              <motion.div
                className="fixed inset-0 z-[70]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                role="dialog"
                aria-modal="true"
              >
                <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setPwOpen(false)} />

                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  className="
                    absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                    w-[min(520px,calc(100vw-24px))]
                    rounded-3xl border border-zinc-200 bg-white
                    shadow-2xl overflow-hidden
                  "
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative p-6 border-b border-zinc-200">
                    <div className="pointer-events-none absolute -top-16 -right-20 h-56 w-56 rounded-full bg-yellow-200/35 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-yellow-100/55 blur-3xl" />

                    <div className="relative flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-zinc-500">Security</p>
                        <p className="mt-1 text-xl font-semibold text-zinc-900">Change password</p>
                        <p className="mt-1 text-xs text-zinc-500">Use a strong password (8+ chars).</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPwOpen(false)}
                        className="
                          rounded-xl border border-zinc-200 bg-white
                          px-3 py-2 text-xs font-semibold text-zinc-700
                          hover:border-yellow-300 hover:text-zinc-900 transition-colors
                        "
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <input
                      value={pw.current}
                      onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                      type="password"
                      placeholder="Current password"
                      className="
                        w-full rounded-2xl border border-zinc-200 bg-white
                        px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none
                        focus:border-yellow-300 focus:ring-2 focus:ring-yellow-100
                      "
                    />
                    <input
                      value={pw.next}
                      onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                      type="password"
                      placeholder="New password"
                      className="
                        w-full rounded-2xl border border-zinc-200 bg-white
                        px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none
                        focus:border-yellow-300 focus:ring-2 focus:ring-yellow-100
                      "
                    />
                    <input
                      value={pw.confirm}
                      onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                      type="password"
                      placeholder="Confirm new password"
                      className="
                        w-full rounded-2xl border border-zinc-200 bg-white
                        px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none
                        focus:border-yellow-300 focus:ring-2 focus:ring-yellow-100
                      "
                    />

                    {pwError ? <p className="text-xs text-rose-600">{pwError}</p> : null}

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPwOpen(false)}
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:border-yellow-300 hover:text-zinc-900 transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={savePassword}
                        disabled={pwSaving || !!pwError || !pw.current || !pw.next || !pw.confirm}
                        className={cx(
                          "rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition-all",
                          pwSaving || !!pwError || !pw.current || !pw.next || !pw.confirm
                            ? "border-zinc-200 bg-zinc-50 text-zinc-400 cursor-not-allowed"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:-translate-y-0.5 hover:shadow-md"
                        )}
                      >
                        {pwSaving ? "Saving..." : "Update password"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
