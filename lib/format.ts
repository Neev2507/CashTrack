export function formatCurrency(amount: number, currency = "USD"): string {
  const abs = Math.abs(amount);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: abs >= 1000 && Number.isInteger(amount) ? 0 : 2,
    minimumFractionDigits: abs >= 1000 && Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}
