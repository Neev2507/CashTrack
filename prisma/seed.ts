import "dotenv/config";
import { resolve } from "node:path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../app/generated/prisma/client";

// ── Helpers ──────────────────────────────────────────────────��───────────────

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
const rng = seededRand(42);
const rand = (min: number, max: number) => min + rng() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function setDay(date: Date, day: number): Date {
  const d = new Date(date);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d;
}

function lastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function quarterKey(d: Date) {
  return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
}

// ── Seed ───────────────────────────��─────────────────────────────────────────

async function main() {
  const rawUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const dbUrl =
    rawUrl.startsWith("file:./") || rawUrl.startsWith("file:../")
      ? `file:${resolve(rawUrl.replace("file:", ""))}`
      : rawUrl;
  const adapter = new PrismaLibSql({ url: dbUrl });
  const prisma = new PrismaClient({ adapter });

  // Clean slate
  await prisma.transaction.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.client.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.business.deleteMany();

  const today = new Date("2026-05-09");
  const foundedAt = addMonths(today, -26);
  foundedAt.setDate(1);

  // ── Business ─────────────────────────────────────���────────────────────────
  const business = await prisma.business.create({
    data: {
      name: "Pixel & Pine Studio",
      entityType: "LLC",
      federalTaxRate: 0.21,
      stateTaxRate: 0.0884,
      foundedAt,
    },
  });

  // ── Bank Accounts ───────────────────────��──────────────────────────────��──
  const opAcct = await prisma.bankAccount.create({
    data: { businessId: business.id, name: "Chase Operating", type: "operating", institution: "Chase", balance: 0 },
  });
  const taxAcct = await prisma.bankAccount.create({
    data: { businessId: business.id, name: "Tax Reserve Vault", type: "tax_reserve", institution: "Mercury", balance: 0 },
  });

  // ── Clients ────────────────────────────────��──────────────────────────────
  const clientDefs = [
    { name: "Northwind Logistics", email: "ops@northwindlogistics.com", health: 94, retainer: 12000, type: "retainer", monthsAgo: 22, status: "active" },
    { name: "Lumen Health",        email: "billing@lumenhealth.io",      health: 91, retainer: 14000, type: "retainer", monthsAgo: 18, status: "active" },
    { name: "Stellar Robotics",    email: "finance@stellarrobotics.com",  health: 78, retainer: 9500,  type: "retainer", monthsAgo: 14, status: "active" },
    { name: "Mossbrook Real Estate", email: "hello@mossbrookrealty.com",  health: 82, retainer: 6500,  type: "retainer", monthsAgo: 10, status: "active" },
    { name: "Chroma Dental",       email: "accounts@chromadental.com",    health: 75, retainer: 4500,  type: "retainer", monthsAgo:  8, status: "active" },
    { name: "Oakvale Coffee Co",   email: "ceo@oakvalecoffee.com",         health: 72, retainer: null,  type: "project",  monthsAgo: 16, status: "active" },
    { name: "Verdant Yoga",        email: "studio@verdantyoga.com",        health: 62, retainer: null,  type: "project",  monthsAgo: 12, status: "active" },
    { name: "Quinn & Associates",  email: "legal@quinnassoc.com",          health: 48, retainer: 2500,  type: "hybrid",   monthsAgo: 20, status: "churned" },
  ] as const;

  type ClientDef = typeof clientDefs[number] & { id: string; startedAt: Date };
  const clients: ClientDef[] = [];
  for (const def of clientDefs) {
    const startedAt = addMonths(today, -def.monthsAgo);
    startedAt.setDate(1);
    const c = await prisma.client.create({
      data: {
        businessId: business.id,
        name: def.name,
        contactEmail: def.email,
        healthScore: def.health,
        monthlyRetainer: def.retainer ?? null,
        engagementType: def.type,
        startedAt,
        status: def.status,
      },
    });
    clients.push({ ...def, id: c.id, startedAt } as ClientDef);
  }

  // ── Employees ──────────────────────────────���─────────────────────────���────
  const employeeDefs = [
    { name: "Jordan Blake",      role: "Founder & CEO",         salary: 14000, monthsAgo: 26, isFounder: true },
    { name: "Priya Nair",        role: "Senior Designer",        salary:  9500, monthsAgo: 24 },
    { name: "Marcus Chen",       role: "Senior Designer",        salary: 10200, monthsAgo: 20 },
    { name: "Sofia Reyes",       role: "Developer",              salary:  8500, monthsAgo: 18 },
    { name: "Eli Hoffman",       role: "Developer",              salary:  9000, monthsAgo: 14 },
    { name: "Anika Patel",       role: "Senior Developer",       salary: 11500, monthsAgo: 12 },
    { name: "Tyler Grant",       role: "Designer",               salary:  6800, monthsAgo: 10 },
    { name: "Leila Yamamoto",    role: "Designer",               salary:  7200, monthsAgo:  8 },
    { name: "Cameron Wells",     role: "Project Manager",        salary:  7500, monthsAgo: 16 },
    { name: "Destiny Torres",    role: "Project Manager",        salary:  8000, monthsAgo: 10 },
    { name: "Finn O'Brien",      role: "Marketing Lead",         salary:  7800, monthsAgo:  6 },
    { name: "Rosa Kim",          role: "Operations Manager",     salary:  6500, monthsAgo:  4 },
  ];

  type EmpDef = typeof employeeDefs[number] & { id: string; startedAt: Date };
  const employees: EmpDef[] = [];
  for (const def of employeeDefs) {
    const startedAt = addMonths(today, -def.monthsAgo);
    startedAt.setDate(1);
    const e = await prisma.employee.create({
      data: {
        businessId: business.id,
        name: def.name,
        role: def.role,
        monthlySalary: def.salary,
        startedAt,
        isFounder: def.isFounder ?? false,
        status: "active",
      },
    });
    employees.push({ ...def, id: e.id, startedAt } as EmpDef);
  }

  // ── Transactions ─────────────────────────────��────────────────────────────
  type TxInput = {
    businessId: string;
    bankAccountId: string;
    amount: number;
    type: string;
    category: string;
    description: string;
    occurredAt: Date;
  };

  const txList: TxInput[] = [];
  // Track income per quarter so we can add quarterly tax payments later
  const incomeByQuarter = new Map<string, number>();

  function recordIncome(amount: number, category: string, description: string, date: Date) {
    txList.push({ businessId: business.id, bankAccountId: opAcct.id, amount, type: "income", category, description, occurredAt: date });
    const taxAmt = parseFloat((amount * 0.22).toFixed(2));
    // Drain 22% from operating to tax reserve
    txList.push({ businessId: business.id, bankAccountId: opAcct.id, amount: -taxAmt, type: "transfer", category: "tax_reserve_transfer", description: `Tax reserve — ${description}`, occurredAt: date });
    txList.push({ businessId: business.id, bankAccountId: taxAcct.id, amount: taxAmt, type: "transfer", category: "tax_reserve_transfer", description: `Tax reserve — ${description}`, occurredAt: date });
    // Track for quarterly payment sizing
    const qk = quarterKey(date);
    incomeByQuarter.set(qk, (incomeByQuarter.get(qk) ?? 0) + amount);
  }

  const historyStart = addMonths(today, -18);
  historyStart.setDate(1);

  for (let m = 0; m < 18; m++) {
    const monthStart = addMonths(historyStart, m);
    const monthLabel = `${monthStart.toLocaleString("en-US", { month: "short" })} ${monthStart.getFullYear()}`;

    // ── Retainer clients ───────────────────────────────────────────
    for (const c of clients) {
      if (!c.retainer || (c.type !== "retainer" && c.type !== "hybrid")) continue;
      if (monthStart < c.startedAt) continue;
      // Quinn churned 3 months ago; stopped paying retainer ~5 months before that
      if (c.name === "Quinn & Associates") {
        const activeMonths = Math.floor((monthStart.getTime() - c.startedAt.getTime()) / (30.44 * 86400000));
        if (activeMonths > 13) continue;
      }
      recordIncome(c.retainer, "retainer", `${c.name} — retainer ${monthLabel}`, setDay(monthStart, 1));
    }

    // ── Project clients ─────────────���───────────────────────────���──
    for (const c of clients) {
      if (c.type !== "project") continue;
      if (monthStart < c.startedAt) continue;
      const n = randInt(1, 3);
      for (let i = 0; i < n; i++) {
        const amt = Math.round(rand(8000, 35000) / 500) * 500;
        recordIncome(amt, "project_payment", `${c.name} — project ${monthLabel}`, setDay(monthStart, randInt(3, 28)));
      }
    }

    // ── Quinn hybrid project fees ───────────────���──────────────────
    const quinn = clients.find((c) => c.name === "Quinn & Associates")!;
    if (monthStart >= quinn.startedAt) {
      const activeMonths = Math.floor((monthStart.getTime() - quinn.startedAt.getTime()) / (30.44 * 86400000));
      if (activeMonths <= 13 && rng() > 0.5) {
        const amt = Math.round(rand(5000, 18000) / 500) * 500;
        recordIncome(amt, "project_payment", `Quinn & Associates — project fee ${monthLabel}`, setDay(monthStart, randInt(5, 25)));
      }
    }

    // ── Expenses ───────────────────────────────��───────────────────
    const activeEmps = employees.filter((e) => monthStart >= e.startedAt);
    const halfPayroll = parseFloat((activeEmps.reduce((s, e) => s + e.salary, 0) / 2).toFixed(2));
    if (halfPayroll > 0) {
      txList.push({ businessId: business.id, bankAccountId: opAcct.id, amount: -halfPayroll, type: "expense", category: "payroll", description: `Payroll mid-month — ${monthLabel}`, occurredAt: setDay(monthStart, 15) });
      txList.push({ businessId: business.id, bankAccountId: opAcct.id, amount: -halfPayroll, type: "expense", category: "payroll", description: `Payroll end-of-month — ${monthLabel}`, occurredAt: lastDayOfMonth(monthStart) });
    }
    txList.push({ businessId: business.id, bankAccountId: opAcct.id, amount: -8200,  type: "expense", category: "rent",       description: `Office rent — ${monthLabel}`,               occurredAt: setDay(monthStart, 1)  });
    txList.push({ businessId: business.id, bankAccountId: opAcct.id, amount: -2400,  type: "expense", category: "software",   description: `Software subscriptions — ${monthLabel}`,    occurredAt: setDay(monthStart, 5)  });
    txList.push({ businessId: business.id, bankAccountId: opAcct.id, amount: -1150,  type: "expense", category: "insurance",  description: `Business insurance — ${monthLabel}`,         occurredAt: setDay(monthStart, 10) });
    for (let i = 0, n = randInt(1, 2); i < n; i++) {
      const amt = Math.round(rand(500, 3000) / 50) * 50;
      txList.push({ businessId: business.id, bankAccountId: opAcct.id, amount: -amt, type: "expense", category: "marketing", description: `Marketing spend — ${monthLabel}`, occurredAt: setDay(monthStart, randInt(3, 28)) });
    }
  }

  // ── Quarterly estimated tax payments (drain the tax reserve) ─────
  // Payments occur 15 days after each quarter end for all completed quarters.
  // Payment = 22% of that quarter's income (what we reserved).
  // Quarter ends: Mar 31, Jun 30, Sep 30, Dec 31
  // Payment dates: Apr 15, Jul 15, Oct 15, Jan 15
  const quarterPaymentDates: { payDate: Date; qk: string }[] = [];
  {
    const yr = [2024, 2025, 2026];
    const qEnds = [
      { month: 2, label: "Q1" }, // March (0-indexed)
      { month: 5, label: "Q2" }, // June
      { month: 8, label: "Q3" }, // September
      { month: 11, label: "Q4" }, // December
    ];
    for (const y of yr) {
      for (const q of qEnds) {
        const payDate = new Date(y, q.month === 11 ? y + 1 - y : y, 1); // placeholder
        // Payment 15 days after quarter end
        const qEnd = new Date(y, q.month + 1, 0); // last day of quarter
        const pay = new Date(qEnd);
        pay.setDate(pay.getDate() + 15);
        if (pay <= today) {
          const qk = `${y}-${q.label}`;
          quarterPaymentDates.push({ payDate: pay, qk });
        }
      }
    }
  }

  for (const { payDate, qk } of quarterPaymentDates) {
    const qIncome = incomeByQuarter.get(qk) ?? 0;
    if (qIncome <= 0) continue;
    const taxPayment = parseFloat((qIncome * 0.22).toFixed(2));
    // Pay out of tax reserve (type=transfer so it's not counted as operating expense)
    txList.push({
      businessId: business.id,
      bankAccountId: taxAcct.id,
      amount: -taxPayment,
      type: "transfer",
      category: "tax_reserve_transfer",
      description: `Estimated tax payment — ${qk}`,
      occurredAt: payDate,
    });
  }

  await prisma.transaction.createMany({ data: txList });

  // ── Compute final balances ─────────────────────────────────────────────────
  const allTx = await prisma.transaction.findMany({ where: { businessId: business.id } });
  const opBalance = allTx.filter((t) => t.bankAccountId === opAcct.id).reduce((s, t) => s + t.amount, 0);
  const taxBalance = allTx.filter((t) => t.bankAccountId === taxAcct.id).reduce((s, t) => s + t.amount, 0);
  await prisma.bankAccount.update({ where: { id: opAcct.id }, data: { balance: parseFloat(opBalance.toFixed(2)) } });
  await prisma.bankAccount.update({ where: { id: taxAcct.id }, data: { balance: parseFloat(taxBalance.toFixed(2)) } });

  // ── Invoices ────────────────────────────────��───────────────────���─────────
  const getClient = (name: string) => clients.find((c) => c.name === name)!;
  let seq = 142;
  const invNum = () => `INV-2024-${String(seq++).padStart(4, "0")}`;
  const daysAgo = (n: number) => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };

  const invoiceDefs = [
    // 8 paid
    { client: "Northwind Logistics",  amt: 12000, issued: 365, due: 30, paid: 12, desc: "Brand identity & website — Phase 1" },
    { client: "Lumen Health",         amt: 18500, issued: 320, due: 30, paid: 18, desc: "UX redesign — mobile app" },
    { client: "Stellar Robotics",     amt:  9500, issued: 280, due: 30, paid:  8, desc: "Q1 retainer settlement" },
    { client: "Oakvale Coffee Co",    amt: 22000, issued: 240, due: 30, paid: 25, desc: "Packaging design & brand refresh" },
    { client: "Mossbrook Real Estate",amt:  6500, issued: 200, due: 30, paid: 10, desc: "Property marketing materials" },
    { client: "Verdant Yoga",         amt: 14000, issued: 160, due: 30, paid: 22, desc: "Website + brand identity" },
    { client: "Chroma Dental",        amt:  4500, issued: 120, due: 30, paid:  7, desc: "Social media content kit" },
    { client: "Lumen Health",         amt: 28000, issued:  90, due: 30, paid: 15, desc: "Patient portal UX overhaul" },
    // 4 overdue (past due)
    { client: "Northwind Logistics",  amt: 12000, issued: 15, due:  0, paid: null, desc: "Brand campaign assets — May" },
    { client: "Stellar Robotics",     amt:  9500, issued: 32, due:  0, paid: null, desc: "Product launch design sprint" },
    { client: "Verdant Yoga",         amt: 16500, issued: 47, due:  0, paid: null, desc: "New studio website build" },
    { client: "Quinn & Associates",   amt: 22000, issued: 71, due:  0, paid: null, desc: "Legal marketing suite — Q4" },
    // 2 sent (not yet due)
    { client: "Lumen Health",         amt: 14000, issued:  6, due: 30, paid: null, desc: "UX research — Phase 2" },
    { client: "Mossbrook Real Estate",amt:  6500, issued:  9, due: 30, paid: null, desc: "Spring listings campaign" },
  ] as const;

  for (const inv of invoiceDefs) {
    const issuedAt = daysAgo(inv.issued);
    const dueAt = new Date(issuedAt); dueAt.setDate(dueAt.getDate() + inv.due);
    const paidAt = inv.paid != null ? new Date(issuedAt.getTime() + inv.paid * 86400000) : null;
    const status = inv.paid != null ? "paid" : inv.due === 0 ? "overdue" : "sent";
    await prisma.invoice.create({
      data: {
        clientId: getClient(inv.client).id,
        businessId: business.id,
        invoiceNumber: invNum(),
        amount: inv.amt,
        issuedAt,
        dueAt,
        paidAt,
        status,
        description: inv.desc,
      },
    });
  }

  // ── Summary ────────────────────────────────��──────────────────────────────
  const txCount = await prisma.transaction.count();
  const last12Start = addMonths(today, -12);
  const arr12 = await prisma.transaction.aggregate({
    where: { businessId: business.id, type: "income", occurredAt: { gte: last12Start } },
    _sum: { amount: true },
  });
  const lastMonthStart = addMonths(today, -1); lastMonthStart.setDate(1);
  const burn = await prisma.transaction.aggregate({
    where: { businessId: business.id, type: "expense", occurredAt: { gte: lastMonthStart, lt: today } },
    _sum: { amount: true },
  });
  const ar = await prisma.invoice.aggregate({
    where: { businessId: business.id, status: { in: ["overdue", "sent"] } },
    _sum: { amount: true },
  });
  const finalOp = await prisma.bankAccount.findUnique({ where: { id: opAcct.id } });
  const finalTax = await prisma.bankAccount.findUnique({ where: { id: taxAcct.id } });

  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  console.log(`✓ Created 1 business, 2 accounts, ${clients.length} clients, ${employees.length} employees, 14 invoices, ${txCount} transactions over 18 months.`);
  console.log(`  Operating: ${fmt(finalOp?.balance ?? 0)}`);
  console.log(`  Tax reserve: ${fmt(finalTax?.balance ?? 0)}`);
  console.log(`  ARR (last 12 mo income): ${fmt(arr12._sum.amount ?? 0)}`);
  console.log(`  Monthly burn (last mo expenses): ${fmt(Math.abs(burn._sum.amount ?? 0))}`);
  console.log(`  Outstanding AR: ${fmt(ar._sum.amount ?? 0)}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
