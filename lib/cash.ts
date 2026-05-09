import { subDays, addDays, startOfDay, format } from "date-fns";

export type TxRow = {
  amount: number;
  type: string;
  category: string;
  description: string;
  occurredAt: Date;
  bankAccountId: string;
};

export type BurnCategory = { category: string; amount: number; pct: number };

function isRealExpense(tx: TxRow): boolean {
  return tx.type === "expense" && tx.category !== "tax_reserve_transfer";
}

function isIncome(tx: TxRow): boolean {
  return tx.type === "income";
}

function inPeriod(tx: TxRow, since: Date, until: Date): boolean {
  return tx.occurredAt >= since && tx.occurredAt <= until;
}

// Avg absolute real expenses per month over a window ending at `until`.
function burnForRange(transactions: TxRow[], until: Date, months: number): number {
  const since = subDays(until, months * 30);
  let total = 0;
  let count = 0;
  for (const t of transactions) {
    if (isRealExpense(t) && inPeriod(t, since, until)) {
      total += Math.abs(t.amount);
      count++;
    }
  }
  return count === 0 ? 0 : total / months;
}

export function getMonthlyBurn(transactions: TxRow[], today: Date, months = 3): number {
  return burnForRange(transactions, today, months);
}

export function getRunwayMonths(operatingBalance: number, monthlyBurn: number): number {
  if (monthlyBurn < 1) return 99;
  return operatingBalance / monthlyBurn;
}

export function getProjectedBalance(
  currentBalance: number,
  transactions: TxRow[],
  today: Date,
  days = 90,
): { date: string; balance: number }[] {
  const lookback = 90;
  const since = subDays(today, lookback);
  let incomeTotal = 0;
  let expenseTotal = 0;
  for (const t of transactions) {
    if (!inPeriod(t, since, today)) continue;
    if (isIncome(t)) incomeTotal += t.amount;
    else if (isRealExpense(t)) expenseTotal += Math.abs(t.amount);
  }
  const dailyNet = (incomeTotal - expenseTotal) / lookback;

  const result: { date: string; balance: number }[] = [];
  let balance = currentBalance;
  for (let i = 0; i <= days; i++) {
    result.push({ date: format(startOfDay(addDays(today, i)), "yyyy-MM-dd"), balance: Math.round(balance) });
    balance += dailyNet;
  }
  return result;
}

export function getBurnDelta(transactions: TxRow[], today: Date): number {
  const current = burnForRange(transactions, today, 3);
  const prior = burnForRange(transactions, subDays(today, 90), 3);
  if (prior === 0) return 0;
  return Math.round(((current - prior) / prior) * 100);
}

export function getBurnBreakdown(transactions: TxRow[], today: Date): BurnCategory[] {
  const since = subDays(today, 30);
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (isRealExpense(t) && inPeriod(t, since, today)) {
      totals.set(t.category, (totals.get(t.category) ?? 0) + Math.abs(t.amount));
    }
  }
  const grandTotal = Array.from(totals.values()).reduce((a, b) => a + b, 0);
  return Array.from(totals.entries())
    .map(([category, amount]) => ({
      category,
      amount,
      pct: grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

// Assumes transactions are already ordered newest-first (as returned by Prisma orderBy desc).
export function getRecentTransactions(transactions: TxRow[], n = 10): TxRow[] {
  return transactions.slice(0, n);
}

export function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    payroll: "Payroll",
    rent: "Rent",
    software: "Software",
    insurance: "Insurance",
    marketing: "Marketing",
    tax_reserve_transfer: "Tax Reserve",
    other: "Other",
  };
  return map[cat] ?? cat.charAt(0).toUpperCase() + cat.slice(1);
}
