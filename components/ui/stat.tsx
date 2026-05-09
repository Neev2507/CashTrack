import { TrendingUp, TrendingDown } from "lucide-react";
import { clsx } from "clsx";

interface StatProps {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  delta?: number;
  deltaLabel?: string;
}

export function Stat({ label, value, sublabel, delta, deltaLabel }: StatProps) {
  const positive = delta !== undefined && delta >= 0;
  const hasDelta = delta !== undefined;

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="tabular text-3xl font-semibold tracking-tight text-zinc-900">{value}</p>
      {(hasDelta || sublabel) && (
        <div className="flex items-center gap-1.5">
          {hasDelta && (
            <span
              className={clsx(
                "flex items-center gap-0.5 text-xs font-medium",
                positive ? "text-emerald-600" : "text-red-600"
              )}
            >
              {positive ? (
                <TrendingUp size={12} strokeWidth={1.5} />
              ) : (
                <TrendingDown size={12} strokeWidth={1.5} />
              )}
              {positive ? "+" : ""}
              {delta}%
            </span>
          )}
          {deltaLabel && (
            <span className="text-xs text-zinc-500">{deltaLabel}</span>
          )}
          {sublabel && !deltaLabel && (
            <span className="text-xs text-zinc-500">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
