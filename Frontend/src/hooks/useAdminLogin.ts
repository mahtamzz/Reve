// src/hooks/useAdminLogin.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAuthApi, type AdminLoginBody } from "@/api/adminAuth";
import { adminMeQueryKey } from "@/hooks/useAdminMe";

export function useAdminLogin() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: AdminLoginBody) => adminAuthApi.login(body),
    onSuccess: async () => {
      // 1) کش me را فوراً تازه کن
      await qc.invalidateQueries({ queryKey: adminMeQueryKey });

      // 2) (اختیاری) با refetch فوری احتمال race کمتر میشه
      await qc.refetchQueries({ queryKey: adminMeQueryKey });
    },
  });
}
