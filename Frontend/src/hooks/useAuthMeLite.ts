// src/hooks/useAuthMeLite.ts
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/api/client";
import { getAvatarUrl } from "@/api/media";

export type MeLite = {
  uid: string | number;
  username: string;
  fullName: string;
  avatarUrl: string | null;
};

export function useAuthMeLite() {
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
        const data: any = await authClient.get("/auth/me");
        const u = (data?.user ?? data) as any;

        const username = u?.username ?? "user";
        const fullName = u?.fullName ?? u?.name ?? username ?? "User";
        const uid = u?.uid ?? u?.id ?? u?.userId;

        if (!cancelled && mountedRef.current) {
          setMe({
            uid,
            username,
            fullName,
            avatarUrl: getAvatarUrl({ bustCache: true }),
          });
        }
      } catch {
        if (!cancelled && mountedRef.current) setMe(null);
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { me, loading };
}
