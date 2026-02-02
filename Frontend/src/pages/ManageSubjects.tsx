import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, X, Check } from "lucide-react";

import { ColorPickerPopover } from "@/components/Subjects/ColorPickerPopover";

import Sidebar from "@/components/Dashboard/SidebarIcon";
import Topbar from "@/components/Dashboard/DashboardHeader";

import { ApiError } from "@/api/client";
import { useProfileMe } from "@/hooks/useProfileMe";

import {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from "@/hooks/useStudy";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

function isHexColor(v: string) {
  const s = v.trim();
  return /^#([0-9a-fA-F]{6})$/.test(s);
}

function safeApiMsg(err: unknown, fallback: string) {
  const e = err as ApiError<any> | null;
  if (!e) return fallback;
  return e.details?.error || e.message || fallback;
}

type EditState =
  | { open: false }
  | {
      open: true;
      subjectId: string;
      name: string;
      color: string; // empty means null
    };

export default function ManageSubjects() {
  const navigate = useNavigate();

  const { data: me } = useProfileMe();

  const { data: subjects, isLoading, error } = useSubjects();

  const { mutate: createSubject, isPending: creating, error: createErr } =
    useCreateSubject();

  const { mutate: updateSubject, isPending: updating, error: updateErr } =
    useUpdateSubject();

  const { mutate: deleteSubject, isPending: deleting, error: deleteErr } =
    useDeleteSubject();

  const username = me?.profile?.display_name ?? "Student";

  // create form
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>("#FFAA00");
  const [touched, setTouched] = useState(false);

  const canCreate = useMemo(() => {
    const n = name.trim();
    if (!n || n.length < 2) return false;
    if (color.trim() && !isHexColor(color)) return false;
    return !creating;
  }, [name, color, creating]);

  // edit modal state
  const [edit, setEdit] = useState<EditState>({ open: false });

  const openEdit = (s: any) => {
    setEdit({
      open: true,
      subjectId: s.id,
      name: s.name ?? "",
      color: s.color ?? "",
    });
  };

  const closeEdit = () => setEdit({ open: false });

  const submitCreate = () => {
    setTouched(true);
    if (!canCreate) return;

    const n = name.trim();
    const c = color.trim();

    createSubject(
      { name: n, color: c ? c : null },
      {
        onSuccess: () => {
          setName("");
          setTouched(false);
        },
      }
    );
  };

  const submitEdit = () => {
    if (!edit.open) return;

    const n = edit.name.trim();
    const c = edit.color.trim();

    if (!n || n.length < 2) return;
    if (c && !isHexColor(c)) return;

    updateSubject(
      {
        subjectId: edit.subjectId,
        fields: { name: n, color: c ? c : null },
      },
      { onSuccess: closeEdit }
    );
  };

  const onDelete = (subjectId: string) => {
    deleteSubject(subjectId);
  };

  const createMsg = createErr
    ? safeApiMsg(createErr, "Failed to create subject.")
    : null;
  const updateMsg = updateErr
    ? safeApiMsg(updateErr, "Failed to update subject.")
    : null;
  const deleteMsg = deleteErr
    ? safeApiMsg(deleteErr, "Failed to delete subject.")
    : null;

  return (
    <div className="min-h-screen bg-creamtext text-zinc-900">
      <div className="flex">
        <Sidebar activeKey="dashboard" onLogout={() => navigate("/login")} />

        <div className="flex-1 min-w-0 md:ml-64">
          <Topbar />

          <div className="mx-auto max-w-6xl px-4 py-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
                  Manage subjects
                </p>
                <p className="mt-1 text-sm text-zinc-600">
                  Create, rename, update color, or remove your study subjects.
                </p>
              </div>

              <button
                onClick={() => navigate("/dashboard")}
                className="
                  rounded-xl border border-zinc-200 bg-white
                  px-3 py-2 text-xs font-semibold text-zinc-700
                  hover:border-yellow-300 hover:text-zinc-900 transition
                "
              >
                Back to dashboard
              </button>
            </div>

            {/* Create card */}
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm relative overflow-hidden">
              <div className="pointer-events-none absolute -top-12 -right-14 h-48 w-48 rounded-full bg-yellow-200/35 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-yellow-100/50 blur-3xl" />

              <div className="relative">
                <p className="text-sm font-semibold text-zinc-900">
                  Create a subject
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Use a short name and an optional hex color (e.g. #FFAA00).
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-7">
                    <label className="block text-[11px] font-semibold text-zinc-600">
                      Name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setTouched(true)}
                      placeholder="e.g. Mathematics"
                      className="
                        mt-1 w-full rounded-2xl border border-zinc-200 bg-white
                        px-4 py-3 text-sm text-zinc-800 shadow-sm outline-none
                        focus:ring-2 focus:ring-yellow-300/60 focus:border-yellow-300
                      "
                    />
                    {touched && (!name.trim() || name.trim().length < 2) ? (
                      <p className="mt-1 text-[11px] text-rose-600">
                        Subject name must be at least 2 characters.
                      </p>
                    ) : null}
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-zinc-600">
                      Color (hex)
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        onBlur={() => setTouched(true)}
                        placeholder="#FFAA00"
                        className="
                          w-full rounded-2xl border border-zinc-200 bg-white
                          px-4 py-3 text-sm text-zinc-800 shadow-sm outline-none
                          focus:ring-2 focus:ring-yellow-300/60 focus:border-yellow-300
                        "
                      />

                      <ColorPickerPopover
                        value={color}
                        onChange={(hex) => setColor(hex)}
                        opacity={100}
                        align="right"
                      />
                    </div>

                    {touched && color.trim() && !isHexColor(color) ? (
                      <p className="mt-1 text-[11px] text-rose-600">
                        Use a valid hex color like #FFAA00.
                      </p>
                    ) : null}
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      onClick={submitCreate}
                      disabled={!canCreate}
                      className="
                        w-full rounded-2xl bg-amber-500 hover:bg-amber-600
                        text-white px-4 py-3 text-sm font-semibold
                        shadow-sm transition
                        disabled:opacity-60 disabled:hover:bg-amber-500
                        inline-flex items-center justify-center gap-2
                      "
                    >
                      {creating ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Create
                    </button>
                  </div>
                </div>

                {createMsg ? (
                  <p className="mt-3 text-sm text-rose-600">{createMsg}</p>
                ) : null}
              </div>
            </div>

            {/* List */}
            <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    Your subjects
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Click edit to rename or change color.
                  </p>
                </div>
                <div className="text-xs text-zinc-500">
                  {(subjects ?? []).length} total
                </div>
              </div>

              {isLoading ? (
                <div className="mt-4 text-sm text-zinc-600">
                  Loading subjects…
                </div>
              ) : error ? (
                <div className="mt-4 text-sm text-rose-600">
                  {safeApiMsg(error, "Failed to load subjects.")}
                </div>
              ) : (subjects ?? []).length === 0 ? (
                <div className="mt-4 rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4 text-sm text-zinc-600">
                  No subjects yet. Create your first one above.
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(subjects ?? []).map((s) => (
                    <div
                      key={s.id}
                      className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 rounded-full border border-zinc-200"
                              style={{ background: s.color ?? "#E4E4E7" }}
                            />
                            <p className="text-sm font-semibold text-zinc-900 truncate">
                              {s.name}
                            </p>
                          </div>
                          <p className="mt-1 text-[11px] text-zinc-500 truncate">
                            {s.color ? s.color : "No color"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="
                              h-9 w-9 rounded-xl border border-zinc-200 bg-white
                              flex items-center justify-center
                              hover:border-yellow-300 hover:text-zinc-900 transition
                              text-zinc-600
                            "
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => onDelete(s.id)}
                            disabled={deleting}
                            className="
                              h-9 w-9 rounded-xl border border-zinc-200 bg-white
                              flex items-center justify-center
                              hover:border-rose-300 hover:text-rose-700 transition
                              text-zinc-600 disabled:opacity-60
                            "
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {deleteMsg ? (
                <p className="mt-3 text-sm text-rose-600">{deleteMsg}</p>
              ) : null}
            </div>

            <footer className="mt-10 text-center text-xs text-zinc-400">
              REVE · subjects
            </footer>
          </div>

          {/* Edit modal */}
          <AnimatePresence>
            {edit.open && (
              <motion.div
                className="fixed inset-0 z-[90]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: EASE_OUT }}
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                  onClick={closeEdit}
                />

                <div className="absolute inset-0 overflow-y-auto overscroll-contain p-3 sm:p-6">
                  <div className="min-h-full flex items-center justify-center">
                    <motion.div
                      initial={{ opacity: 0, y: 18, scale: 0.985 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 18, scale: 0.985 }}
                      transition={{ duration: 0.22, ease: EASE_OUT }}
                      className="
                        relative w-full max-w-[520px]
                        overflow-hidden rounded-[28px]
                        border border-yellow-200/70
                        bg-gradient-to-b from-yellow-50/70 to-white
                        shadow-[0_30px_90px_-60px_rgba(0,0,0,0.55)]
                      "
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="pointer-events-none absolute -top-24 -right-24 h-[320px] w-[320px] rounded-full bg-yellow-200/30 blur-3xl" />
                      <div className="pointer-events-none absolute -bottom-28 -left-28 h-[360px] w-[360px] rounded-full bg-orange-300/20 blur-3xl" />

                      <div className="relative p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs tracking-[0.35em] text-zinc-500">
                              STUDY
                            </p>
                            <h2 className="mt-2 text-xl font-semibold text-zinc-900 leading-snug">
                              Edit subject
                            </h2>
                            <p className="mt-2 text-sm text-zinc-600">
                              Update name or color, then save.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={closeEdit}
                            className="
                              rounded-xl border border-zinc-200 bg-white/80
                              backdrop-blur p-2 text-zinc-700
                              hover:border-yellow-300 hover:text-zinc-900 transition
                            "
                            aria-label="Close"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-5 space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-700">
                              Name
                            </label>
                            <input
                              value={edit.name}
                              onChange={(e) =>
                                setEdit((prev) =>
                                  prev.open ? { ...prev, name: e.target.value } : prev
                                )
                              }
                              className="
                                mt-2 w-full rounded-2xl border border-zinc-200 bg-white
                                px-4 py-3 text-sm text-zinc-800 shadow-sm outline-none
                                focus:ring-2 focus:ring-yellow-300/60 focus:border-yellow-300
                              "
                            />
                            {!edit.name.trim() ? (
                              <p className="mt-1 text-[11px] text-rose-600">
                                Name is required.
                              </p>
                            ) : null}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-700">
                              Color (hex)
                            </label>
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                value={edit.color}
                                onChange={(e) =>
                                  setEdit((prev) =>
                                    prev.open ? { ...prev, color: e.target.value } : prev
                                  )
                                }
                                placeholder="#FFAA00"
                                className="
                                  w-full rounded-2xl border border-zinc-200 bg-white
                                  px-4 py-3 text-sm text-zinc-800 shadow-sm outline-none
                                  focus:ring-2 focus:ring-yellow-300/60 focus:border-yellow-300
                                "
                              />

                              <ColorPickerPopover
                                value={edit.color}
                                onChange={(hex) =>
                                  setEdit((prev) =>
                                    prev.open ? { ...prev, color: hex } : prev
                                  )
                                }
                                opacity={100}
                                align="right"
                              />
                            </div>

                            {edit.color.trim() && !isHexColor(edit.color) ? (
                              <p className="mt-1 text-[11px] text-rose-600">
                                Use a valid hex like #FFAA00.
                              </p>
                            ) : null}
                          </div>

                          {updateMsg ? (
                            <p className="text-sm text-rose-600">{updateMsg}</p>
                          ) : null}
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={closeEdit}
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
                            onClick={submitEdit}
                            disabled={
                              updating ||
                              !edit.name.trim() ||
                              (edit.color.trim() && !isHexColor(edit.color))
                            }
                            className="
                              rounded-xl bg-amber-500 hover:bg-amber-600
                              text-white px-4 py-2 text-xs font-semibold
                              shadow-sm transition disabled:opacity-60
                              inline-flex items-center gap-2
                            "
                          >
                            {updating ? (
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            Save
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
