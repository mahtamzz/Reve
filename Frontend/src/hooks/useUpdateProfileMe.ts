// src/hooks/useUpdateProfileMe.ts
import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileInfoApi, type UpdateProfileInfoPayload } from "@/api/profileInfo";
import { profileMeKey } from "./useProfileMe";
import { profileInfoDashboardKey } from "./useProfileInfoDashboard";
import { handleUiError } from "@/errors/handleUiError";
import type { NormalizedError } from "@/errors/normalizeError";
import { ApiError } from "@/api/client";
import { useUiAdapters } from "@/ui/useUiAdapters";

function asNormalized(e: unknown): NormalizedError {
  return e instanceof ApiError ? e : (e as NormalizedError);
}

export function useUpdateProfileMe() {
  const ui = useUiAdapters();
  const qc = useQueryClient();

  const lastHandledRef = useRef<unknown>(null);
  const lastVarsRef = useRef<UpdateProfileInfoPayload | null>(null);

  const mutation = useMutation({
    mutationFn: (payload: UpdateProfileInfoPayload) => profileInfoApi.updateProfileInfo(payload),
    onMutate: (payload) => {
      lastVarsRef.current = payload;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: profileMeKey });
      await qc.invalidateQueries({ queryKey: profileInfoDashboardKey });
    },
  });

  useEffect(() => {
    if (!mutation.isError || !mutation.error) return;
    if (lastHandledRef.current === mutation.error) return;
    lastHandledRef.current = mutation.error;

    handleUiError(asNormalized(mutation.error), ui, {
      retry: () => {
        const v = lastVarsRef.current;
        if (v) mutation.mutate(v);
      },
    });
  }, [mutation.isError, mutation.error, mutation.mutate, ui]);

  return mutation;
}
