// src/errors/normalizeError.ts

import { DEFAULT_ERROR, ERROR_DICTIONARY, ErrorCode, ErrorDef, ErrorDef as _ErrorDef } from "./errorDictionary";

export type ApiErrorShape = {
  code?: string; // backend error code
  message?: string; // backend message (not for UI)
  status?: number; // HTTP status
  details?: unknown; // e.g. field errors
  requestId?: string; // helpful for support
};

export type NormalizedError = _ErrorDef & {
  status?: number;
  requestId?: string;
  details?: unknown;
  raw?: unknown;
};

function isObject(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null;
}

function normalizeCode(code?: string): string | undefined {
  if (!code) return undefined;
  // common normalizations
  return String(code).trim().toUpperCase().replace(/\s+/g, "_");
}

function pickByCode(code?: string): ErrorDef {
  const normalized = normalizeCode(code);
  if (!normalized) return DEFAULT_ERROR;
  const key = normalized as ErrorCode;
  return ERROR_DICTIONARY[key] ?? DEFAULT_ERROR;
}

function mapStatusToDef(status?: number, hasDetails?: boolean): ErrorDef {
  switch (status) {
    case 400:
      // if details exist, likely validation-ish
      return hasDetails ? ERROR_DICTIONARY.VALIDATION_ERROR : ERROR_DICTIONARY.CLIENT_ERROR;
    case 401:
      return ERROR_DICTIONARY.AUTH_UNAUTHORIZED;
    case 403:
      return ERROR_DICTIONARY.AUTH_FORBIDDEN;
    case 404:
      return ERROR_DICTIONARY.NOT_FOUND;
    case 409:
      return ERROR_DICTIONARY.CONFLICT;
    case 422:
      return ERROR_DICTIONARY.VALIDATION_ERROR;
    case 429:
      return ERROR_DICTIONARY.RATE_LIMITED;
    case 500:
      return ERROR_DICTIONARY.SERVER_ERROR;
    case 502:
    case 503:
    case 504:
      return ERROR_DICTIONARY.SERVICE_UNAVAILABLE;
    default:
      return DEFAULT_ERROR;
  }
}

function detectAbortError(err: unknown): boolean {
  // fetch AbortController throws DOMException with name "AbortError"
  if (isObject(err) && typeof err.name === "string" && err.name === "AbortError") return true;
  // axios cancel / abort patterns
  if (isObject(err) && (err.code === "ERR_CANCELED" || err.__CANCEL__ === true)) return true;
  return false;
}

function detectTimeout(err: unknown): boolean {
  // axios: ECONNABORTED or ETIMEDOUT
  if (isObject(err) && (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT")) return true;
  // generic: message contains "timeout"
  if (isObject(err) && typeof err.message === "string" && /timeout/i.test(err.message)) return true;
  return false;
}

function extractApiShape(err: unknown): ApiErrorShape | null {
  // Strict-ish: only accept if at least one relevant field has the right type
  if (
    isObject(err) &&
    (typeof (err as any).code === "string" ||
      typeof (err as any).status === "number" ||
      typeof (err as any).requestId === "string")
  ) {
    return {
      code: typeof (err as any).code === "string" ? (err as any).code : undefined,
      status: typeof (err as any).status === "number" ? (err as any).status : undefined,
      message: typeof (err as any).message === "string" ? (err as any).message : undefined,
      details: "details" in err ? (err as any).details : undefined,
      requestId: typeof (err as any).requestId === "string" ? (err as any).requestId : undefined,
    };
  }

  // Axios error common shape: err.response?.status + err.response?.data
  if (isObject(err) && isObject((err as any).response)) {
    const resp = (err as any).response;
    const status = typeof resp.status === "number" ? resp.status : undefined;
    const data = resp.data;

    if (isObject(data)) {
      const headerRequestId =
        typeof resp?.headers?.["x-request-id"] === "string" ? resp.headers["x-request-id"] : undefined;

      return {
        code: typeof (data as any).code === "string" ? (data as any).code : undefined,
        status,
        message: typeof (data as any).message === "string" ? (data as any).message : undefined,
        details: "details" in data ? (data as any).details : undefined,
        requestId: typeof (data as any).requestId === "string" ? (data as any).requestId : headerRequestId,
      };
    }

    return { status };
  }

  // Fetch error: you usually need to parse response json yourself.
  return null;
}

/**
 * Convert ANY error to a UI-ready error definition.
 */
export function normalizeError(err: unknown): NormalizedError {
  // Offline check (browser)
  if (typeof navigator !== "undefined" && navigator?.onLine === false) {
    return { ...ERROR_DICTIONARY.NETWORK_OFFLINE, raw: err };
  }

  // Aborted / canceled
  if (detectAbortError(err)) {
    return { ...ERROR_DICTIONARY.NETWORK_ABORTED, raw: err };
  }

  // Timeout
  if (detectTimeout(err)) {
    return { ...ERROR_DICTIONARY.NETWORK_TIMEOUT, raw: err };
  }

  // Try extracting known API shapes
  const api = extractApiShape(err);
  if (api) {
    const byCode = pickByCode(api.code);
    const byStatus = api.status ? mapStatusToDef(api.status, api.details != null) : DEFAULT_ERROR;

    // Prefer explicit backend code, otherwise fallback to HTTP status
    const chosen = api.code ? byCode : byStatus;

    return {
      ...chosen,
      status: api.status,
      requestId: api.requestId,
      details: api.details,
      raw: err,
    };
  }

  // Generic network-ish errors
  // Axios: err.message "Network Error" or err.code "ERR_NETWORK"
  if (isObject(err) && ((err as any).code === "ERR_NETWORK" || /network error/i.test(String((err as any).message ?? "")))) {
    return { ...ERROR_DICTIONARY.NETWORK_ERROR, raw: err };
  }

  return { ...DEFAULT_ERROR, raw: err };
}
