import React from "react";

interface ChallengeCardProps {
  title: string;
  percent: number;
  description: string;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  title,
  percent,
  description,
}) => {
  const p = Math.max(0, Math.min(100, percent));

  return (
    <div
      className="
        group relative overflow-hidden rounded-2xl
        border border-black/10
        bg-gradient-to-br from-[#9EC5F8]/70 to-white/50
        shadow-sm transition-all duration-300
        hover:-translate-y-0.5 hover:shadow-lg
      "
    >
      {/* glow */}
      <div className="pointer-events-none absolute -inset-10 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(37,99,235,0.35),transparent_55%),radial-gradient(circle_at_80%_75%,rgba(59,130,246,0.25),transparent_60%)]" />
      </div>

      {/* header */}
      <div className="relative flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-500 px-3 py-2 text-white">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white/90 animate-pulse" />
          <p className="text-xs font-semibold capitalize">{title}</p>
        </div>
        <p className="text-xs font-semibold">{p}%</p>
      </div>

      <div className="relative p-3 space-y-2">
        {/* progress */}
        <div className="h-2 rounded-full bg-white/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/90 transition-[width] duration-700 ease-out"
            style={{ width: `${p}%` }}
          />
        </div>

        {/* description */}
        <div
          className="
            flex items-start gap-2
            text-[11px] leading-relaxed
            text-black/65
            opacity-90
          "
        >
          <span className="mt-[2px] text-blue-600">🎯</span>
          <p className="line-clamp-2">{description}</p>
        </div>

        <p className="text-[11px] text-black/60">
          Progress updated today
        </p>
      </div>
    </div>
  );
};
