import React, { useMemo, useState } from "react";
import { useAdminDeleteGroup, useAdminGroupsList } from "@/hooks/useAdminGroups";

function cx(...classes: Array<string | false | undefined | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function AdminGroupsPanel() {
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  const { data, isLoading, error } = useAdminGroupsList({ limit, offset });
  const del = useAdminDeleteGroup();

  const items = data?.items ?? [];
  const meta = data?.meta ?? null;

  const canPrev = offset > 0;
  const canNext = useMemo(() => {
    if (meta?.total != null) return offset + limit < Number(meta.total);
    return items.length === limit;
  }, [meta, items.length, offset, limit]);

  async function onDelete(groupId: string, name?: string) {
    const ok = window.confirm(`Delete group${name ? ` "${name}"` : ""}?`);
    if (!ok) return;
    del.mutate(groupId);
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm border border-zinc-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">Groups</p>
          <p className="mt-0.5 text-xs text-zinc-500">Admin list & delete</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={!canPrev || isLoading}
            onClick={() => setOffset((x) => Math.max(0, x - limit))}
            className={cx(
              "rounded-xl border px-3 py-1.5 text-xs font-medium shadow-sm transition",
              canPrev && !isLoading
                ? "border-zinc-200 bg-white text-zinc-700 hover:border-yellow-300 hover:text-zinc-900"
                : "border-zinc-100 bg-zinc-50 text-zinc-400"
            )}
          >
            Prev
          </button>

          <button
            disabled={!canNext || isLoading}
            onClick={() => setOffset((x) => x + limit)}
            className={cx(
              "rounded-xl border px-3 py-1.5 text-xs font-medium shadow-sm transition",
              canNext && !isLoading
                ? "border-zinc-200 bg-white text-zinc-700 hover:border-yellow-300 hover:text-zinc-900"
                : "border-zinc-100 bg-zinc-50 text-zinc-400"
            )}
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4 text-sm text-zinc-600">
            Loading groups…
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Failed to load groups.
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-[#FFFBF2] p-4 text-sm text-zinc-600">
            No groups found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="text-left p-3 text-xs font-semibold text-zinc-600">Name</th>
                  <th className="text-left p-3 text-xs font-semibold text-zinc-600">Visibility</th>
                  <th className="text-left p-3 text-xs font-semibold text-zinc-600">Owner</th>
                  <th className="text-right p-3 text-xs font-semibold text-zinc-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((g: any) => (
                  <tr key={g.id} className="border-t border-zinc-200">
                    <td className="p-3 text-zinc-900">
                      <div className="font-semibold">{g.name ?? "—"}</div>
                      {g.description ? (
                        <div className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{g.description}</div>
                      ) : null}
                    </td>
                    <td className="p-3 text-zinc-700">{g.visibility ?? "—"}</td>
                    <td className="p-3 text-zinc-700">{g.owner_uid ?? g.ownerUid ?? "—"}</td>
                    <td className="p-3 text-right">
                      <button
                        disabled={del.isPending}
                        onClick={() => onDelete(String(g.id), g.name)}
                        className={cx(
                          "rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
                          del.isPending
                            ? "border-zinc-200 bg-zinc-50 text-zinc-400"
                            : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        )}
                      >
                        {del.isPending ? "Deleting…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
