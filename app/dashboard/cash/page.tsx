import { format, subDays } from "date-fns";
import { clsx } from "clsx";
import { ArrowUp, ArrowDown } from "lucide-react";
import prisma from "@/lib/prisma";
import {
  getMonthlyBurn,
  getRunwayMonths,
  getProjectedBalance,
  getBurnDelta,
  getBurnBreakdown,
  getRecentTransactions,
  categoryLabel,
  type TxRow,
} from "@/lib/cash";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import ProjectionChart from "@/components/ProjectionChart";

export default async function CashCommandPage() {
  const today = new Date("2026-05-09");

  const [accounts, rawTx] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { business: { name: "Pixel & Pine Studio" } },
    }),
    prisma.transaction.findMany({
      where: {
        business: { name: "Pixel & Pine Studio" },
        occurredAt: { gte: subDays(today, 185) },
      },
      orderBy: { occurredAt: "desc" },
    }),
  ]);

  const opAccount = accounts.find((a) => a.type === "operating");
  const taxAccount = accounts.find((a) => a.type === "tax_reserve");
  const opBalance = opAccount?.balance ?? 0;
  const taxBalance = taxAccount?.balance ?? 0;
  const totalCash = opBalance + taxBalance;

  const transactions: TxRow[] = rawTx.map((t) => ({ ...t, occurredAt: new Date(t.occurredAt) }));

  const monthlyBurn = getMonthlyBurn(transactions, today, 3);
  const runway = getRunwayMonths(opBalance, monthlyBurn);
  const burnDelta = getBurnDelta(transactions, today);
  const projection = getProjectedBalance(opBalance, transactions, today, 90);
  const breakdown = getBurnBreakdown(transactions, today);
  const recent = getRecentTransactions(transactions, 10);

  const runwayColor =
    runway < 3 ? "text-red-600" : runway < 6 ? "text-amber-600" : "text-zinc-900";
  const runwayBarColor =
    runway < 3 ? "bg-red-600" : runway < 6 ? "bg-amber-500" : "bg-zinc-900";
  const runwayPct = Math.min(runway / 12, 1) * 100;

  const todayStr = format(today, "yyyy-MM-dd");

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Cash Command</h1>
          <p className="mt-0.5 text-sm text-zinc-500">Real-time runway and burn analysis</p>
        </div>
        <p className="mt-1 text-xs text-zinc-400">
          Updated {format(today, "MMM d, yyyy")}, from Chase Operating + Mercury Tax Reserve
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-6">

        {/* Runway */}
        <Card className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Runway</p>
          <p className={clsx("tabular mt-1 text-3xl font-semibold tracking-tight", runwayColor)}>
            {runway >= 99 ? "99+" : runway.toFixed(1)} months
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            at current burn of <Money amount={monthlyBurn} className="text-zinc-500" />/mo
          </p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-zinc-100">
            <div
              className={clsx("h-1.5 rounded-full transition-all", runwayBarColor)}
              style={{ width: `${runwayPct}%` }}
            />
          </div>
        </Card>

        {/* Monthly burn */}
        <Card className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Monthly Burn</p>
          <p className="tabular mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
            <Money amount={monthlyBurn} />
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className={clsx(
                "flex items-center gap-0.5 text-xs font-medium",
                burnDelta > 0 ? "text-red-600" : "text-emerald-600",
              )}
            >
              {burnDelta > 0
                ? <ArrowUp size={10} strokeWidth={2} />
                : <ArrowDown size={10} strokeWidth={2} />}
              {burnDelta > 0 ? "+" : ""}{burnDelta}%
            </span>
            <span className="text-xs text-zinc-500">vs prior 3 months</span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500">Avg trailing 3 months</p>
        </Card>

        {/* Cash position */}
        <Card className="p-6">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Cash Position</p>
          <p className="tabular mt-1 text-3xl font-semibold tracking-tight text-zinc-900">
            <Money amount={totalCash} />
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            <Money amount={opBalance} className="text-zinc-500" />
            {" operating"}
            <span className="mx-1.5 text-zinc-300">·</span>
            <Money amount={taxBalance} className="text-zinc-500" />
            {" reserve"}
          </p>
        </Card>
      </div>

      {/* Projection chart */}
      <Card>
        <CardHeader>
          <CardTitle>90-Day Projection</CardTitle>
          <p className="mt-0.5 text-xs text-zinc-500">
            Based on trailing 90-day income and expense pace
          </p>
        </CardHeader>
        <CardContent>
          <ProjectionChart data={projection} todayStr={todayStr} />
        </CardContent>
      </Card>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-6">

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <p className="mt-0.5 text-xs text-zinc-500">Last 10 transactions</p>
          </CardHeader>
          <div className="px-6">
            {recent.map((tx, i) => {
              const isTransfer = tx.category === "tax_reserve_transfer";
              const amtColor = isTransfer
                ? "text-zinc-400"
                : tx.amount > 0
                ? "text-emerald-600"
                : "text-red-600";
              return (
                <div
                  key={`${tx.occurredAt.toISOString()}-${i}`}
                  className={clsx(
                    "flex items-center justify-between py-3",
                    i < recent.length - 1 && "border-b border-zinc-100",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-zinc-500">{format(tx.occurredAt, "MMM d, yyyy")}</p>
                    <p className="mt-0.5 truncate text-sm text-zinc-900">{tx.description}</p>
                  </div>
                  <span className={clsx("tabular ml-4 shrink-0 text-sm font-medium", amtColor)}>
                    {tx.amount > 0 ? "+" : ""}
                    <Money amount={tx.amount} className={amtColor} />
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Burn Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Burn Breakdown</CardTitle>
            <p className="mt-0.5 text-xs text-zinc-500">Where the money goes, last 30 days</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {breakdown.map((item) => (
                <div key={item.category}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm text-zinc-700">{categoryLabel(item.category)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500">{item.pct}%</span>
                      <span className="tabular text-sm font-medium text-zinc-900">
                        <Money amount={item.amount} />
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-100">
                    <div className="h-1.5 rounded-full bg-zinc-900" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
