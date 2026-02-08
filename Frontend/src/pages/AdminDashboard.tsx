// src/pages/AdminDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
import AdminGroupsPanel from "@/components/Admin/AdminGroupsPanel";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Shield,
  Users,
  Layers,
  RefreshCw,
  LogOut,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { ApiError } from "@/api/client";
import { adminAuthApi } from "@/api/adminAuth";
import { authSession } from "@/utils/authSession";

// ---------- helpers ----------
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getStatus(e: unknown): number | undefined {
  return e instanceof ApiError ? e.status : (e as any)?.status;
}

function formatDate(s: any) {
  if (!s) return "—";
  const d = new Date(String(s));
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function pickId(row: any): string | number | null {
  return row?.id ?? row?.uid ?? row?.userId ?? null;
}

type TabKey = "users" | "groups";

// ---------- query keys ----------
const adminMeKey = ["admin", "me"] as const;
const adminUsersKey = (page: number, limit: number) =>
  ["admin", "users", { page, limit }] as const;

export default function AdminDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [tab, setTab] = useState<TabKey>("users");
  const [page, setPage] = useState(1);
  const limit = 20;

  // ---------- admin session ----------
  const adminMeQuery = useQuery({
    queryKey: adminMeKey,
    queryFn: async () => {
      const res = await adminAuthApi.me();
      return (res as any)?.admin ?? res;
    },
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    const st = getStatus(adminMeQuery.error);
    if (st === 401 || st === 403) authSession.logoutAdmin();
  }, [adminMeQuery.error]);

  // ---------- list users ----------
  const usersQuery = useQuery({
    queryKey: adminUsersKey(page, limit),
    enabled: tab === "users" && adminMeQuery.status === "success",
    queryFn: async () => {
      return adminAuthApi.listUsers({ page, limit });
    },
    retry: false,
    staleTime: 10_000,
  });

  const usersRaw = (usersQuery.data as any)?.data ?? [];
  const meta = (usersQuery.data as any)?.meta ?? {};
  const totalPages = Number(meta?.totalPages ?? 1) || 1;
  const total = Number(meta?.total ?? usersRaw.length ?? 0) || 0;

  const users = useMemo(() => usersRaw, [usersRaw]);

  // ---------- delete user ----------
  const deleteUserMut = useMutation({
    mutationFn: async (userId: string | number) => {
      return adminAuthApi.deleteUser(userId);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  async function onDeleteUser(u: any) {
    const id = pickId(u);
    if (id == null) return;

    const label = u?.email ?? u?.username ?? String(id);
    const ok = window.confirm(
      `Delete user "${label}"?\nThis action cannot be undone.`
    );
    if (!ok) return;

    try {
      await deleteUserMut.mutateAsync(id);
    } catch {
      // error shown below
    }
  }

  function onRefresh() {
    if (tab === "users") qc.invalidateQueries({ queryKey: ["admin", "users"] });
    if (tab === "groups") qc.invalidateQueries({ queryKey: ["admin", "groups"] });
    qc.invalidateQueries({ queryKey: adminMeKey });
  }

  function onLogout() {
    authSession.logoutAdmin();
  }

  // ---------- error / loading ----------
  const activeError =
    adminMeQuery.error || usersQuery.error || deleteUserMut.error;

  const status = getStatus(activeError);

  const busy =
    adminMeQuery.isFetching ||
    usersQuery.isLoading ||
    usersQuery.isFetching ||
    deleteUserMut.isPending;

  // ---------- UI: loading admin ----------
  if (adminMeQuery.isLoading) {
    return (
      <div className="min-h-screen bg-creamtext flex items-center justify-center">
        <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute -top-12 -right-14 h-48 w-48 rounded-full bg-yellow-200/45 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-yellow-100/60 blur-3xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                Loading admin…
              </p>
              <p className="text-xs text-zinc-500">Warming up the panel</p>
            </div>
          </div>

          <div className="relative mt-5 h-2 w-full overflow-hidden rounded-full bg-zinc-200/60">
            <div className="h-full w-1/2 rounded-full bg-yellow-300/70 animate-[slide_1.2s_ease-in-out_infinite]" />
          </div>

          <style>{`
            @keyframes slide {
              0% { transform: translateX(-60%); }
              50% { transform: translateX(60%); }
              100% { transform: translateX(-60%); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // ---------- UI: error ----------
  if (activeError) {
    return (
      <div className="min-h-screen bg-creamtext flex items-center justify-center px-4">
        <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="pointer-events-none absolute -top-12 -right-14 h-48 w-48 rounded-full bg-yellow-200/45 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-yellow-100/60 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <p className="font-semibold text-zinc-900">Admin Dashboard</p>
            </div>

            <p className="mt-3 text-sm text-zinc-600">
              {status === 401 || status === 403
                ? "Session expired. Please sign in again."
                : `Error: ${(activeError as any)?.message ?? "Failed to load"}`}
            </p>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => navigate("/admin/login")}
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 shadow-sm hover:border-yellow-300 hover:text-zinc-900 transition"
              >
                Go to admin login
              </button>
              <button
                onClick={onLogout}
                className="rounded-2xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- data ----------
  const admin = adminMeQuery.data as any;
  const adminName = admin?.username ?? admin?.email ?? "admin";

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-sm">
              <Shield className="h-5 w-5" />
              <span className="pointer-events-none absolute -right-2 -top-2 h-4 w-4 rounded-full bg-yellow-300/70 animate-ping opacity-60" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Admin Panel</p>
              <p className="text-xs text-zinc-500">Signed in as {adminName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm hover:border-yellow-300 hover:text-zinc-900 transition"
            >
              <RefreshCw className={cx("h-4 w-4", busy && "animate-spin")} />
              Refresh
            </button>

            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-12 gap-4">
          <div className="relative col-span-12 md:col-span-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="pointer-events-none absolute -top-10 -right-12 h-44 w-44 rounded-full bg-yellow-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-yellow-100/60 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-zinc-700" />
                <p className="text-sm font-semibold">Users</p>
              </div>
              <span className="rounded-2xl border border-zinc-200 bg-[#FFFBF2] px-3 py-1 text-xs font-semibold text-amber-700">
                total: {total}
              </span>
            </div>
            <p className="relative mt-2 text-xs text-zinc-500">
              Only allowed action: delete users
            </p>
          </div>

          <div className="relative col-span-12 md:col-span-6 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="pointer-events-none absolute -top-10 -right-12 h-44 w-44 rounded-full bg-yellow-200/35 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-yellow-100/55 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-zinc-700" />
                <p className="text-sm font-semibold">Groups</p>
              </div>
              <span className="rounded-2xl border border-zinc-200 bg-[#FFFBF2] px-3 py-1 text-xs font-semibold text-emerald-700">
                connected
              </span>
            </div>
            <p className="relative mt-2 text-xs text-zinc-500">
              Admin list/delete groups
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTab("users");
                setPage(1);
              }}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                tab === "users"
                  ? "bg-white border border-zinc-200 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              <Users className="h-4 w-4" />
              Users
            </button>

            <button
              onClick={() => setTab("groups")}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                tab === "groups"
                  ? "bg-white border border-zinc-200 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              )}
            >
              <Layers className="h-4 w-4" />
              Groups
            </button>
          </div>
        </div>

        {/* Content */}
        {tab === "users" ? (
          <>
            {/* Table card */}
            <div className="relative mt-4 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
              <div className="pointer-events-none absolute -top-12 -right-14 h-48 w-48 rounded-full bg-yellow-200/35 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-yellow-100/55 blur-3xl" />

              <div className="relative flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold">User Management</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Page {page} of {totalPages}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {busy ? (
                    <span className="text-xs text-zinc-500 inline-flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-300/80 animate-bounce" />
                      <span className="h-2 w-2 rounded-full bg-yellow-200/80 animate-bounce [animation-delay:120ms]" />
                      <span className="h-2 w-2 rounded-full bg-yellow-100/80 animate-bounce [animation-delay:240ms]" />
                      Loading…
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="relative overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-[#FFFBF2] text-xs text-zinc-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">ID</th>
                      <th className="px-5 py-3 font-semibold">Email</th>
                      <th className="px-5 py-3 font-semibold">Username</th>
                      <th className="px-5 py-3 font-semibold">Created</th>
                      <th className="px-5 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((u: any) => {
                      const id = pickId(u);
                      const deletingThis =
                        deleteUserMut.isPending &&
                        (deleteUserMut.variables as any) === id;

                      return (
                        <tr
                          key={String(id ?? Math.random())}
                          className="border-t border-zinc-100 hover:bg-[#FFFBF2]/70 transition-colors"
                        >
                          <td className="px-5 py-3 text-zinc-800">{id ?? "—"}</td>
                          <td className="px-5 py-3 text-zinc-800">
                            {u?.email ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-zinc-800">
                            {u?.username ?? u?.name ?? "—"}
                          </td>
                          <td className="px-5 py-3 text-zinc-500">
                            {formatDate(u?.created_at ?? u?.createdAt)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => onDeleteUser(u)}
                              disabled={deleteUserMut.isPending}
                              className={cx(
                                "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold transition shadow-sm",
                                "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
                                "disabled:opacity-60 disabled:cursor-not-allowed"
                              )}
                            >
                              <Trash2
                                className={cx(
                                  "h-4 w-4",
                                  deletingThis &&
                                    "animate-[shake_420ms_ease-in-out_infinite]"
                                )}
                              />
                              {deletingThis ? "Deleting…" : "Delete"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {!busy && users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center text-zinc-500"
                        >
                          No users found.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="relative flex items-center justify-between border-t border-zinc-200 px-5 py-4">
                <p className="text-xs text-zinc-500">
                  Showing{" "}
                  <span className="font-semibold text-zinc-800">
                    {usersRaw.length}
                  </span>{" "}
                  · Total{" "}
                  <span className="font-semibold text-zinc-800">{total}</span>
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || busy}
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm disabled:opacity-50 hover:border-yellow-300 hover:text-zinc-900 transition"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                  </button>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || busy}
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 shadow-sm disabled:opacity-50 hover:border-yellow-300 hover:text-zinc-900 transition"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-zinc-400">
              As an admin, you can delete users.
            </p>
          </>
        ) : (
          <>
            <div className="mt-4">
              <AdminGroupsPanel />
            </div>

            <p className="mt-4 text-xs text-zinc-400">
              As an admin, you can list and delete groups.
            </p>
          </>
        )}

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0) rotate(0); }
            25% { transform: translateX(-2px) rotate(-4deg); }
            50% { transform: translateX(2px) rotate(4deg); }
            75% { transform: translateX(-1px) rotate(-2deg); }
          }
        `}</style>
      </main>
    </div>
  );
}
