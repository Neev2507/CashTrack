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
      <p className="text-label-xs uppercase tracking-tight text-on-surface-variant">{label}</p>
      <p className="text-data-lg text-on-surface">{value}</p>
      {(hasDelta || sublabel) && (
        <div className="flex items-center gap-1.5">
          {hasDelta && (
            <span
              className={clsx(
                "flex items-center gap-0.5 text-label-xs",
                positive ? "text-secondary" : "text-error"
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
            <span className="text-label-xs text-on-surface-variant">{deltaLabel}</span>
          )}
          {sublabel && !deltaLabel && (
            <span className="text-label-xs text-on-surface-variant">{sublabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
