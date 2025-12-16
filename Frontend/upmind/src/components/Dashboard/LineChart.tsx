import React, { useMemo } from "react";

type Point = { d: string; h: number };

interface LineChartProps {
  data: Point[];
}

export const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const { points, labels } = useMemo(() => {
    const w = 640;
    const h = 220;
    const pad = 28;

    const maxY = Math.max(...data.map((x) => x.h), 10);
    const minY = 0;

    const xStep = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
    const yScale = (val: number) =>
      pad + (h - pad * 2) * (1 - (val - minY) / (maxY - minY));

    const pts = data
      .map((p, i) => `${pad + i * xStep},${yScale(p.h)}`)
      .join(" ");

    return { points: pts, labels: { w, h, pad, xStep, yScale } };
  }, [data]);

  const w = 640;
  const h = 220;
  const pad = 28;
  const gridLines = 4;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full min-w-[520px]"
        role="img"
        aria-label="Weekly study chart"
      >
        {/* grid */}
        {Array.from({ length: gridLines + 1 }).map((_, idx) => {
          const y = pad + ((h - pad * 2) / gridLines) * idx;
          return (
            <line
              key={idx}
              x1={pad}
              x2={w - pad}
              y1={y}
              y2={y}
              stroke="rgba(0,0,0,0.12)"
              strokeWidth="1"
            />
          );
        })}

        {/* line */}
        <polyline
          points={points}
          fill="none"
          stroke="rgba(37,99,235,0.85)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* dots */}
        {data.map((p, i) => {
          const cx = pad + i * (data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0);
          // recreate yScale (cheap & safe)
          const maxY = Math.max(...data.map((x) => x.h), 10);
          const cy =
            pad + (h - pad * 2) * (1 - (p.h - 0) / (maxY - 0));
          return (
            <g key={`${p.d}-${i}`}>
              <circle cx={cx} cy={cy} r="4" fill="rgba(37,99,235,0.9)" />
              <circle cx={cx} cy={cy} r="8" fill="rgba(37,99,235,0.12)" />
            </g>
          );
        })}

        {/* x labels */}
        {data.map((p, i) => {
          const x = pad + i * (data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0);
          return (
            <text
              key={`${p.d}-label`}
              x={x}
              y={h - 8}
              textAnchor="middle"
              fontSize="11"
              fill="rgba(0,0,0,0.55)"
            >
              {p.d.toLowerCase()}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
