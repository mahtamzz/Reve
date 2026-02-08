import { describe, expect, it } from "vitest";
import { ERROR_DICTIONARY } from "@/errors/errorDictionary";
import { normalizeSocketError } from "@/hooks/useGroupChatSocket"; 

describe("normalizeSocketError", () => {
  it("maps REVOKED to AUTH_FORBIDDEN page error", () => {
    const e = normalizeSocketError({ code: "REVOKED", message: "no access" })!;
    expect(e.code).toBe("AUTH_FORBIDDEN");
    expect(e.ui).toBe("page");
    expect(e.retryable).toBe(false);
    expect(e.title).toBe("Access revoked");
  });

  it("maps DELETED to NOT_FOUND and redirect action", () => {
    const e = normalizeSocketError({ code: "DELETED" })!;
    expect(e.code).toBe("NOT_FOUND");
    expect(e.action).toEqual({ kind: "redirect", to: "/groups" });
  });

  it("maps unknown codes to UNKNOWN_ERROR toast", () => {
    const e = normalizeSocketError({ code: "WAT", message: "x" })!;
    expect(e.code).toBe("UNKNOWN_ERROR");
    expect(e.ui).toBe("toast");
    expect(e.retryable).toBe(true);
    expect(e.report).toBe(true);
  });

  it("returns null for empty", () => {
    expect(normalizeSocketError(null)).toBe(null);
    expect(normalizeSocketError({ code: "", message: "x" } as any)).toBe(null);
  });
});
