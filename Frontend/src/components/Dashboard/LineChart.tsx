import React from "react";
import {
  ResponsiveContainer,
  LineChart as RLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";

export type WeeklyPoint = {
  date: string;   // "YYYY-MM-DD"
  hours: number;
};

function formatHours(v: number) {
  const fixed = Number.isInteger(v) ? v.toString() : v.toFixed(1);
  return `${fixed}h`;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: readonly any[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  const hours = payload[0]?.value ?? 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      <p className="text-xs font-medium text-zinc-500">{label ?? ""}</p>
      <p className="mt-0.5 text-sm font-semibold text-zinc-900">
        {formatHours(hours)}
        <span className="ml-1 text-xs font-medium text-zinc-500">studied</span>
      </p>
    </div>
  );
};


export const WeeklyStudyChart: React.FC<{ data: WeeklyPoint[] }> = ({ data }) => {
  const chartData = data.map((d) => ({
    ...d,
    day: format(parseISO(d.date), "EEE"),          // Mon
    full: format(parseISO(d.date), "MMM d, yyyy"), // Dec 17, 2025
  }));

  const maxHours = Math.max(1, ...chartData.map((d) => d.hours));
  const yMax = Math.ceil(maxHours + 1);

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RLineChart data={chartData} margin={{ top: 8, right: 14, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 8" />
          <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={10} fontSize={12} />
          <YAxis
            domain={[0, yMax]}
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            fontSize={12}
            tickFormatter={(v) => (v === 0 ? "0" : formatHours(v))}
          />

          <Tooltip
            cursor={{ strokeDasharray: "4 6" }}
            content={(props) => {
              const p = (props.payload?.[0] as any)?.payload;
              return (
                <CustomTooltip
                  active={props.active}
                  payload={props.payload as readonly any[]}
                  label={p?.full}
                />
              );
            }}
          />


          <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: 12 }} />

          <Line
            type="monotone"
            dataKey="hours"
            name="Study hours"
            strokeWidth={3}
            dot={false}
            isAnimationActive
            animationDuration={900}
            activeDot={{ r: 6, strokeWidth: 3 }}
          />
        </RLineChart>
      </ResponsiveContainer>
    </div>
  );
};