// src/hooks/useAuthMeLite.ts
import { useEffect, useRef, useState } from "react";
import { authClient, ApiError } from "@/api/client";
import { getAvatarUrl } from "@/api/media";
import type { NormalizedError } from "@/errors/normalizeError";

export type MeLite = {
  uid: string | number;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  scope: "user" | "admin";
};

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

type Scope = "user" | "admin";

export function useAuthMeLite(scope: Scope = "user") {
  const [me, setMe] = useState<MeLite | null>(null);
  const [loading, setLoading] = useState(false);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const path = scope === "admin" ? "/auth/admin/me" : "/auth/me";

        // admin: retry/refresh نکن
        const data: any = await authClient.get(path, { retry: scope !== "admin" });

        const entity = (data?.admin ?? data?.user ?? data) as any;

        const username = entity?.username ?? (scope === "admin" ? "admin" : "user");
        const fullName = entity?.fullName ?? entity?.name ?? username ?? "User";

        const uid =
          scope === "admin"
            ? (entity?.admin_id ?? entity?.id)
            : (entity?.uid ?? entity?.id ?? entity?.userId);

        if (!cancelled && mountedRef.current) {
          setMe({
            uid,
            username,
            fullName,
            avatarUrl: getAvatarUrl({ bustCache: true }),
            scope,
          });
        }
      } catch (e) {
        const err = asNormalized(e);
        const isAuthish =
          err.type === "auth" ||
          err.type === "permission" ||
          err.status === 401 ||
          err.status === 403;

        if (!cancelled && mountedRef.current) setMe(null);
        void isAuthish;
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  return { me, loading };
}
