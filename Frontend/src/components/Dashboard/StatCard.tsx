import React from "react";

type Accent = "orange" | "blue";

interface StatCardProps {
  title: string;
  value: string;
  accent: Accent;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, accent }) => {
  const dot = accent === "orange" ? "bg-orange-400" : "bg-sky-500";
  const val = accent === "orange" ? "text-orange-500" : "text-sky-600";

  return (
    <div className="rounded-2xl bg-[#FFF1B8] border border-black/5 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <p className="text-xs text-black/60 capitalize">{title}</p>
      </div>
      <p className={`mt-2 text-2xl font-semibold ${val}`}>{value}</p>
    </div>
  );
};
