// src/errors/errorDictionary.ts

export type ErrorUI = "toast" | "banner" | "dialog" | "inline" | "page" | "silent";

export type ErrorAction =
  | { kind: "none" }
  | { kind: "retry" }
  | { kind: "reload" }
  | { kind: "redirect"; to: string }
  | { kind: "logout" }
  | { kind: "contact_support" };

export type ErrorType =
  | "network"
  | "auth"
  | "permission"
  | "validation"
  | "not_found"
  | "conflict"
  | "rate_limit"
  | "server"
  | "client"
  | "unknown";

export type ErrorSeverity = "info" | "warning" | "error" | "fatal";

export type ErrorDef = {
  code: string;
  type: ErrorType;
  severity: ErrorSeverity;

  title?: string;
  message: string;

  ui: ErrorUI;
  show: boolean;
  retryable: boolean;
  action: ErrorAction;

  /** Send to Sentry/Datadog/etc */
  report: boolean;
};

const def = (e: ErrorDef) => e;

export const ERROR_DICTIONARY = {
  // ---------------- Network ----------------
  NETWORK_OFFLINE: def({
    code: "NETWORK_OFFLINE",
    type: "network",
    severity: "warning",
    title: "You're offline",
    message: "Check your internet connection and try again.",
    ui: "banner",
    show: true,
    retryable: true,
    action: { kind: "retry" },
    report: false,
  }),

  NETWORK_TIMEOUT: def({
    code: "NETWORK_TIMEOUT",
    type: "network",
    severity: "warning",
    title: "Request timed out",
    message: "The server took too long to respond. Please try again.",
    ui: "toast",
    show: true,
    retryable: true,
    action: { kind: "retry" },
    report: false,
  }),

  NETWORK_ABORTED: def({
    code: "NETWORK_ABORTED",
    type: "network",
    severity: "info",
    title: "Request canceled",
    message: "The request was canceled.",
    ui: "silent",
    show: false,
    retryable: false,
    action: { kind: "none" },
    report: false,
  }),

  NETWORK_ERROR: def({
    code: "NETWORK_ERROR",
    type: "network",
    severity: "error",
    title: "Network error",
    message: "We couldn't reach the server. Please try again.",
    ui: "banner",
    show: true,
    retryable: true,
    action: { kind: "retry" },
    report: true,
  }),

  // ---------------- Auth / Permission ----------------
  AUTH_UNAUTHORIZED: def({
    code: "AUTH_UNAUTHORIZED",
    type: "auth",
    severity: "warning",
    title: "Sign in required",
    message: "Please sign in to continue.",
    ui: "dialog",
    show: true,
    retryable: false,
    action: { kind: "redirect", to: "/login" },
    report: false,
  }),

  AUTH_FORBIDDEN: def({
    code: "AUTH_FORBIDDEN",
    type: "permission",
    severity: "warning",
    title: "Access denied",
    message: "You don't have permission to view this page.",
    ui: "page",
    show: true,
    retryable: false,
    action: { kind: "none" },
    report: false,
  }),

  AUTH_SESSION_EXPIRED: def({
    code: "AUTH_SESSION_EXPIRED",
    type: "auth",
    severity: "warning",
    title: "Session expired",
    message: "Please sign in again.",
    ui: "dialog",
    show: true,
    retryable: false,
    action: { kind: "logout" },
    report: false,
  }),

  AUTH_INVALID_CREDENTIALS: def({
    code: "AUTH_INVALID_CREDENTIALS",
    type: "auth",
    severity: "warning",
    title: "Sign in failed",
    message: "The email or password you entered is incorrect.",
    ui: "inline",
    show: true,
    retryable: false,
    action: { kind: "none" },
    report: false,
  }),

  // ---------------- Validation ----------------
  VALIDATION_ERROR: def({
    code: "VALIDATION_ERROR",
    type: "validation",
    severity: "warning",
    title: "Invalid input",
    message: "Please review the highlighted fields and try again.",
    ui: "inline",
    show: true,
    retryable: false,
    action: { kind: "none" },
    report: false,
  }),

  // ---------------- Not Found / Conflict ----------------
  NOT_FOUND: def({
    code: "NOT_FOUND",
    type: "not_found",
    severity: "warning",
    title: "Not found",
    message: "The requested resource could not be found.",
    ui: "page",
    show: true,
    retryable: false,
    action: { kind: "none" },
    report: false,
  }),

  CONFLICT: def({
    code: "CONFLICT",
    type: "conflict",
    severity: "warning",
    title: "Conflict",
    message: "This action conflicts with the current state. Please reload and try again.",
    ui: "banner",
    show: true,
    retryable: false,
    action: { kind: "reload" },
    report: false,
  }),

  // ---------------- Rate Limit ----------------
  RATE_LIMITED: def({
    code: "RATE_LIMITED",
    type: "rate_limit",
    severity: "warning",
    title: "Too many requests",
    message: "You're doing that too quickly. Please wait a moment and try again.",
    ui: "toast",
    show: true,
    retryable: true,
    action: { kind: "retry" },
    report: false,
  }),

  // ---------------- Server ----------------
  SERVER_ERROR: def({
    code: "SERVER_ERROR",
    type: "server",
    severity: "error",
    title: "Server error",
    message: "Something went wrong on our end. Please try again.",
    ui: "banner",
    show: true,
    retryable: true,
    action: { kind: "retry" },
    report: true,
  }),

  SERVICE_UNAVAILABLE: def({
    code: "SERVICE_UNAVAILABLE",
    type: "server",
    severity: "error",
    title: "Service unavailable",
    message: "The service is temporarily unavailable. Please try again soon.",
    ui: "page",
    show: true,
    retryable: true,
    action: { kind: "retry" },
    report: true,
  }),

  // ---------------- Client ----------------
  CLIENT_ERROR: def({
    code: "CLIENT_ERROR",
    type: "client",
    severity: "error",
    title: "Application error",
    message: "Something went wrong. If this keeps happening, contact support.",
    ui: "toast",
    show: true,
    retryable: false,
    action: { kind: "contact_support" },
    report: true,
  }),

  // ---------------- Fallback ----------------
  UNKNOWN_ERROR: def({
    code: "UNKNOWN_ERROR",
    type: "unknown",
    severity: "error",
    title: "Unexpected error",
    message: "Something went wrong. Please try again.",
    ui: "toast",
    show: true,
    retryable: true,
    action: { kind: "retry" },
    report: true,
  }),
} as const;

export type ErrorCode = keyof typeof ERROR_DICTIONARY;
export const DEFAULT_ERROR = ERROR_DICTIONARY.UNKNOWN_ERROR;
