import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker, HexColorInput } from "react-colorful";

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, n));
}

function isHexColor(v: string) {
  const s = v.trim();
  return /^#([0-9a-fA-F]{6})$/.test(s);
}

type Props = {
  value: string; // #RRGGBB
  onChange: (hex: string) => void;
  opacity?: number; // 0..100 (اختیاری)
  onOpacityChange?: (v: number) => void;
  label?: string;
  align?: "left" | "right"; // برای اینکه پنل از چپ/راست بچسبه
};

export function ColorPickerPopover({
  value,
  onChange,
  opacity = 100,
  onOpacityChange,
  label = "Pick a color",
  align = "right",
}: Props) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const safeHex = useMemo(() => {
    const v = value?.trim();
    return isHexColor(v) ? v.toUpperCase() : "#E4E4E7";
  }, [value]);

  // اگر opacity رو برای preview می‌خوای:
  const previewBg = useMemo(() => {
    const h = safeHex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = clamp(opacity) / 100;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }, [safeHex, opacity]);

  const computePosition = () => {
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const gap = 8;
    const width = 280; // همون عرض پنل

    let left =
      align === "right"
        ? rect.right - width
        : rect.left;

    // جلوگیری از بیرون زدن از صفحه
    const minLeft = 8;
    const maxLeft = window.innerWidth - width - 8;
    left = clamp(left, minLeft, maxLeft);

    const top = rect.bottom + gap;

    setPos({ top, left });
  };

  const toggle = () => {
    setOpen((p) => {
      const next = !p;
      if (!p && next) {
        // باز شدن
        requestAnimationFrame(computePosition);
      }
      return next;
    });
  };

  // بستن با کلیک بیرون
  useEffect(() => {
    if (!open) return;

    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // با اسکرول/ریسایز موقعیت آپدیت بشه
  useEffect(() => {
    if (!open) return;

    const onResize = () => computePosition();
    // capture=true تا اگر داخل اسکرول‌کانتینر بود هم کار کنه
    const onScroll = () => computePosition();

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="h-10 w-10 rounded-2xl border border-zinc-200 shadow-sm"
        style={{ background: previewBg }}
        title="Choose color"
        aria-label="Choose color"
      />

      {open && pos
        ? createPortal(
            <div
              ref={popRef}
              className="
                fixed z-[9999]
                w-[280px]
                rounded-2xl border border-zinc-200 bg-white
                shadow-[0_18px_60px_-30px_rgba(0,0,0,0.45)]
                p-3
              "
              style={{ top: pos.top, left: pos.left }}
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-700">{label}</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-800"
                >
                  Close
                </button>
              </div>

              <div className="mt-3 rounded-xl overflow-hidden border border-zinc-200">
                <HexColorPicker
                  color={safeHex}
                  onChange={(hex) => onChange(hex.toUpperCase())}
                />
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-zinc-600 w-10">
                    Hex
                  </span>

                  <div className="flex-1 rounded-xl border border-zinc-200 px-3 py-2">
                    <HexColorInput
                      prefixed
                      color={safeHex}
                      onChange={(v) => {
                        const next = (v.startsWith("#") ? v : `#${v}`).toUpperCase();
                        // فقط وقتی کامل شد ست کن تا تجربه تایپ خراب نشه
                        if (isHexColor(next)) onChange(next);
                      }}
                      className="w-full outline-none text-sm text-zinc-800"
                    />
                  </div>

                  <div
                    className="h-9 w-9 rounded-xl border border-zinc-200"
                    style={{ background: previewBg }}
                    title="Preview"
                  />
                </div>

                {onOpacityChange ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-zinc-600 w-10">
                      Opacity
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={opacity}
                      onChange={(e) =>
                        onOpacityChange(clamp(Number(e.target.value)))
                      }
                      className="flex-1"
                    />
                    <div className="w-12 text-right text-xs text-zinc-700 tabular-nums">
                      {opacity}%
                    </div>
                  </div>
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
