import type { UiAdapters } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";

export function useUiAdapters(): UiAdapters {
  return {
    toastError: (msg, opts) => {
      console.error("TOAST:", msg, opts);
    },
    showBanner: (title, msg, opts) => {
      console.error("BANNER:", title, msg, opts);
    },
    showDialog: (title, msg, opts) => {
      console.error("DIALOG:", title, msg, opts);
    },
    navigate: (to) => {
      window.location.assign(to);
    },
    logout: () => {
      window.location.assign("/login");
    },
    report: (err: NormalizedError) => {
      console.error("REPORT:", err);
    },
  };
}
