// src/hooks/useMyGroupIds.ts

import { useCallback, useEffect, useState } from "react";

const KEY = "my_group_ids_v1";

function safeReadIds(): string[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function safeWriteIds(ids: string[]) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function useMyGroupIds() {
  const [ids, setIds] = useState<string[]>(() => safeReadIds());

  useEffect(() => {
    safeWriteIds(ids);
  }, [ids]);

  const add = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev : [id, ...prev]));
  }, []);

  const remove = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  return { ids, add, remove, clear };
}
