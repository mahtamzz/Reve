import React from "react";

interface ChallengeCardProps {
  title: string;
  percent: number;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  title,
  percent,
}) => {
  const p = Math.max(0, Math.min(100, percent));

  return (
    <div className="rounded-2xl overflow-hidden border border-black/10 bg-[#9EC5F8]/70">
      <div className="flex items-center justify-between bg-blue-600 px-3 py-2 text-white">
        <p className="text-xs font-semibold capitalize">{title}</p>
        <p className="text-xs font-semibold">{p}%</p>
      </div>

      <div className="p-3">
        <div className="h-2 rounded-full bg-white/40 overflow-hidden">
          <div className="h-full bg-white/80" style={{ width: `${p}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-black/60">
          Progress updated today
        </p>
      </div>
    </div>
  );
};
