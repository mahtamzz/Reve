import { useEffect, useState } from "react";

const KEY = "my_group_ids_v1";

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids));
}

export function useMyGroupIds() {
  const [ids, setIds] = useState<string[]>(() => readIds());

  useEffect(() => {
    writeIds(ids);
  }, [ids]);

  const add = (id: string) => {
    setIds((prev) => (prev.includes(id) ? prev : [id, ...prev]));
  };

  const remove = (id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
  };

  const clear = () => setIds([]);

  return { ids, add, remove, clear };
}
