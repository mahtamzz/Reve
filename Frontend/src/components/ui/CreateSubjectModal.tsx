import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, Palette } from "lucide-react";
import { ColorPickerPopover } from "../Subjects/ColorPickerPopover";


const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

function isHexColor(v: string) {
  return /^#([0-9a-fA-F]{6})$/.test(v.trim());
}

export type CreateSubjectPayload = {
  name: string;
  color: string | null;
};

export default function CreateSubjectModal({
  open,
  onClose,
  onCreate,
  initialName,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: CreateSubjectPayload) => void | Promise<void>;
  initialName?: string;
}) {
  const firstRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState(initialName ?? "");
  const [color, setColor] = useState<string>("#FFAA00");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(initialName ?? "");
    setColor("#FFAA00");
    setTouched(false);
    setSubmitting(false);

    const t = window.setTimeout(() => firstRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [open, initialName]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Subject name is required.";
    if (name.trim().length < 2) e.name = "Subject name must be at least 2 chars.";
    if (color && !isHexColor(color)) e.color = "Color must be a hex like #FFAA00.";
    return e;
  }, [name, color]);

  const canSubmit = Object.keys(errors).length === 0 && !submitting;

  const submit = async () => {
    setTouched(true);
    if (!canSubmit) return;

    try {
      setSubmitting(true);
      await onCreate({
        name: name.trim(),
        color: color.trim() ? color.trim() : null,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

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
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

          <div className="absolute inset-0 overflow-y-auto overscroll-contain p-3 sm:p-6">
            <div className="min-h-full flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.985 }}
                transition={{ duration: 0.22, ease: EASE_OUT }}
                className="
                  relative w-full max-w-[560px]
                  overflow-hidden rounded-[28px]
                  border border-zinc-200 bg-white
                  shadow-2xl
                "
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative p-5 border-b border-zinc-200 bg-[#FFFBF2]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs tracking-[0.25em] text-zinc-500">STUDY</p>
                      <h3 className="mt-2 text-xl font-semibold text-zinc-900">
                        Create subject
                      </h3>
                      <p className="mt-1 text-xs text-zinc-600">
                        Add a subject so focus sessions can be logged.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 hover:border-yellow-300 hover:text-zinc-900 transition"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  {touched && Object.keys(errors).length > 0 && (
                    <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex gap-2">
                      <AlertTriangle className="h-4 w-4 mt-0.5" />
                      <div>
                        <p className="font-semibold">Fix a few things</p>
                        <p className="text-xs mt-0.5 opacity-90">
                          {errors.name || errors.color}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <label className="block text-xs font-semibold text-zinc-700">
                      Subject name
                    </label>
                    <input
                      ref={firstRef}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => setTouched(true)}
                      placeholder="e.g. Mathematics"
                      className="
                        mt-2 w-full rounded-2xl border border-zinc-200 bg-white
                        px-4 py-3 text-sm text-zinc-800 shadow-sm outline-none
                        focus:ring-2 focus:ring-yellow-300/60 focus:border-yellow-300
                      "
                    />
                    {touched && errors.name && (
                      <p className="mt-2 text-xs text-red-600">{errors.name}</p>
                    )}

                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-zinc-700">Color</label>

                    <div className="mt-2 flex items-center gap-2">
                      {/* ✅ Color picker button */}
                      <ColorPickerPopover
                        value={isHexColor(color) ? color : "#FFAA00"}
                        onChange={(hex) => {
                          setColor(hex);      // ✅ picker → state
                          setTouched(true);
                        }}
                        label="Subject color"
                        align="left"
                      />

                      {/* ✅ Hex input */}
                      <div className="flex-1 relative">
                        <Palette className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                        <input
                          value={color}
                          onChange={(e) => setColor(e.target.value)} 
                          onBlur={() => setTouched(true)}
                          placeholder="#FFAA00"
                          className="
                            w-full rounded-2xl border border-zinc-200 bg-white
                            pl-10 pr-4 py-3 text-sm text-zinc-800 shadow-sm outline-none
                            focus:ring-2 focus:ring-yellow-300/60 focus:border-yellow-300
                          "
                        />
                      </div>
                    </div>

                    {touched && errors.color && (
                      <p className="mt-2 text-xs text-red-600">{errors.color}</p>
                    )}

                    <p className="mt-2 text-[11px] text-zinc-500">
                      Optional, used for UI accents.
                    </p>
                  </div>

                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2">
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
                        rounded-xl bg-amber-500 hover:bg-amber-600 text-white
                        px-4 py-2 text-xs font-semibold shadow-sm transition
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
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
