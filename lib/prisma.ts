import { resolve } from "node:path";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  const rawUrl = process.env.DATABASE_URL ?? "file:./dev.db";
  const url = rawUrl.startsWith("file:./") || rawUrl.startsWith("file:../")
    ? `file:${resolve(rawUrl.replace("file:", ""))}`
    : rawUrl;
  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter });
}

const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
