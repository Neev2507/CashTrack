"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/format";

type DataPoint = { date: string; balance: number };

function formatYAxis(value: number): string {
  if (Math.abs(value) >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${value}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  return (
    <div className="rounded border border-outline-variant bg-surface-container-lowest p-3">
      <p className="text-label-xs text-on-surface-variant">{format(parseISO(label), "MMM d, yyyy")}</p>
      <p className="text-data-md text-on-surface">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export default function ProjectionChart({
  data,
  todayStr,
}: {
  data: DataPoint[];
  todayStr: string;
}) {
  const { min: minBalance, max: maxBalance } = data.reduce(
    (acc, d) => ({ min: Math.min(acc.min, d.balance), max: Math.max(acc.max, d.balance) }),
    { min: Infinity, max: -Infinity },
  );
  const yMin = Math.min(0, minBalance - Math.abs(minBalance) * 0.05);
  const yMax = maxBalance + Math.abs(maxBalance) * 0.05;

  const tickDates = data.filter((_, i) => i % 14 === 0).map((d) => d.date);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 16 }}>
        <CartesianGrid vertical={false} stroke="#c5c6ca" strokeOpacity={0.4} />
        <XAxis
          dataKey="date"
          ticks={tickDates}
          tickFormatter={(v) => format(parseISO(v), "MMM d")}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#75777b", fontSize: 11 }}
        />
        <YAxis
          tickFormatter={formatYAxis}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#75777b", fontSize: 11 }}
          domain={[yMin, yMax]}
          width={56}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#ba1a1a" strokeDasharray="4 3" strokeWidth={1} />
        <ReferenceLine
          x={todayStr}
          stroke="#c5c6ca"
          strokeDasharray="4 3"
          strokeWidth={1}
          label={{ value: "Today", position: "insideTopRight", fill: "#75777b", fontSize: 11 }}
        />
        <Line
          type="monotone"
          dataKey="balance"
          stroke="#1c1b1c"
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: "#1c1b1c", strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
