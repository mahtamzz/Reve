// src/components/Groups/CreateGroupModal.tsx
import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { GroupVisibility } from "@/api/types";

export type CreateGroupPayload = {
  name: string;
  description: string | null;
  visibility: GroupVisibility;      // ✅ unified
  minimumDstMins: number | null;
};

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function CreateGroupModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateGroupPayload) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // ✅ default public
  const [visibility, setVisibility] = useState<GroupVisibility>("public");

  const [minimumDstMins, setMinimumDstMins] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => Boolean(name.trim()) && !submitting, [name, submitting]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return alert("Group name is required");

    const minsRaw = minimumDstMins.trim();
    let mins: number | null = null;

    if (minsRaw !== "") {
      const n = Number(minsRaw);
      if (!Number.isFinite(n) || n < 0) {
        alert("Minimum daily minutes must be a non-negative number.");
        return;
      }
      mins = Math.floor(n);
    }

    try {
      setSubmitting(true);

      await onCreate({
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
        visibility,
        minimumDstMins: mins,
      });

      setName("");
      setDescription("");
      setVisibility("public");
      setMinimumDstMins("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            onClick={onClose}
            aria-label="Close modal"
          />

          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="
              relative z-[110] w-full max-w-2xl
              rounded-[28px] border border-zinc-200 bg-white shadow-xl overflow-hidden
            "
            role="dialog"
            aria-label="Create group"
          >
            <div className="relative p-6 sm:p-7">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-16 -right-24 h-64 w-64 rounded-full bg-yellow-200/35 blur-3xl"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-200/20 blur-3xl"
              />

              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-zinc-900">Create group</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Choose visibility and optionally set a minimum daily study time.
                  </p>
                  <div className="mt-3 h-[2px] w-20 rounded-full bg-yellow-300/70" />
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="
                    h-10 w-10 rounded-2xl border border-zinc-200 bg-white
                    hover:bg-zinc-50 transition flex items-center justify-center
                  "
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-zinc-700" />
                </button>
              </div>
            </div>

            <div className="border-t border-zinc-200 bg-white">
              <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="p-6 sm:p-7"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-600">
                      Group name
                    </label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="
                        mt-1 w-full rounded-2xl border border-zinc-200 bg-white
                        px-4 py-3 text-sm outline-none shadow-sm
                        focus:border-yellow-400 focus:ring-4 focus:ring-yellow-200/40
                        transition
                      "
                      placeholder="Focus Study Group"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-zinc-600">
                      Description (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="
                        mt-1 w-full rounded-2xl border border-zinc-200 bg-white
                        px-4 py-3 text-sm outline-none shadow-sm resize-none
                        focus:border-yellow-400 focus:ring-4 focus:ring-yellow-200/40
                        transition
                      "
                      placeholder="A group for consistent daily focus sessions"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600">
                      Visibility
                    </label>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value as GroupVisibility)}
                      className="
                        mt-1 w-full rounded-2xl border border-zinc-200 bg-white
                        px-4 py-3 text-sm outline-none shadow-sm
                        focus:border-yellow-400 focus:ring-4 focus:ring-yellow-200/40
                        transition
                      "
                    >
                      <option value="public">Public — anyone can join</option>
                      <option value="private">Private — join requests</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-600">
                      Minimum daily study (minutes)
                    </label>
                    <input
                      value={minimumDstMins}
                      onChange={(e) => setMinimumDstMins(e.target.value)}
                      type="number"
                      min={0}
                      className="
                        mt-1 w-full rounded-2xl border border-zinc-200 bg-white
                        px-4 py-3 text-sm outline-none shadow-sm
                        focus:border-yellow-400 focus:ring-4 focus:ring-yellow-200/40
                        transition
                      "
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="
                      rounded-2xl border border-zinc-200 bg-white
                      px-4 py-2.5 text-sm font-semibold text-zinc-800
                      hover:bg-zinc-50 transition
                    "
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={cx(
                      "rounded-2xl px-5 py-2.5 text-sm font-semibold transition",
                      "bg-zinc-900 text-white hover:bg-zinc-800",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {submitting ? "Creating…" : "Create group"}
                  </button>
                </div>
              </motion.form>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
