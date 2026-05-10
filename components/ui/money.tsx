import { formatCurrency } from "@/lib/format";

interface MoneyProps {
  amount: number;
  currency?: string;
  className?: string;
}

export function Money({ amount, currency = "USD", className }: MoneyProps) {
  return (
    <span className={`tabular font-mono${className ? ` ${className}` : ""}`}>
      {formatCurrency(amount, currency)}
    </span>
  );
}
