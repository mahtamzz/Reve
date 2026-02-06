// src/errors/handleUiError.ts

import type { NormalizedError } from "./normalizeError";

export type UiAdapters = {
  // lightweight primitives
  toastError: (msg: string, opts?: { actionLabel?: string; onAction?: () => void }) => void;

  showBanner: (title: string | undefined, msg: string, opts?: { actionLabel?: string; onAction?: () => void }) => void;

  showDialog: (title: string | undefined, msg: string, opts?: { actionLabel?: string; onAction?: () => void }) => void;

  /** Full page error renderer (preferred for err.ui === "page") */
  showPageError?: (title: string | undefined, msg: string, opts?: { actionLabel?: string; onAction?: () => void }) => void;

  /** Inline error (preferred for err.ui === "inline") */
  showInlineError?: (msg: string, details?: unknown) => void;

  // navigation & auth
  navigate: (to: string) => void;
  logout?: () => void;

  // telemetry
  report?: (err: NormalizedError) => void;
};

export type HandleUiErrorOptions = {
  /**
   * Actual retry of the failed operation (NOT page reload).
   * If omitted and action.kind is "retry", we fall back to reload().
   */
  retry?: () => void;

  /** Override reload behavior (defaults to window.location.reload). */
  reload?: () => void;
};

export function handleUiError(err: NormalizedError, ui: UiAdapters, opts: HandleUiErrorOptions = {}) {
    if (err.report && ui.report) ui.report(err);
    if (!err.show) return;
  
    const reload = opts.reload ?? (() => window.location.reload());
  
    let actionLabel: string | undefined;
    let onAction: (() => void) | undefined;
  
    const action = err.action; // <-- مهم
  
    switch (action.kind) {
      case "retry":
        actionLabel = "Retry";
        onAction = opts.retry ?? reload;
        break;
  
      case "reload":
        actionLabel = "Reload";
        onAction = reload;
        break;
  
      case "redirect":
        actionLabel = "Continue";
        onAction = () => ui.navigate(action.to); // <-- OK
        break;
  
      case "logout":
        actionLabel = "Sign in";
        onAction = () => (ui.logout ? ui.logout() : ui.navigate("/login"));
        break;
  
      case "contact_support":
        actionLabel = "Contact support";
        onAction = () => ui.navigate("/support");
        break;
  
      case "none":
      default:
        break;
    }

  const title = err.title;
  const msg = err.message;

  switch (err.ui) {
    case "toast":
      ui.toastError(msg, { actionLabel, onAction });
      return;

    case "banner":
      ui.showBanner(title, msg, { actionLabel, onAction });
      return;

    case "dialog":
      ui.showDialog(title, msg, { actionLabel, onAction });
      return;

    case "page":
      // Prefer dedicated page error UI; fallback to dialog
      if (ui.showPageError) ui.showPageError(title, msg, { actionLabel, onAction });
      else ui.showDialog(title, msg, { actionLabel, onAction });
      return;

    case "inline":
      // Prefer true inline errors; fallback to toast
      if (ui.showInlineError) ui.showInlineError(msg, err.details);
      else ui.toastError(msg);
      return;

    case "silent":
    default:
      return;
  }
}
