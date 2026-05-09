import prisma from "@/lib/prisma";
import DashboardNav from "./nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const business = await prisma.business.findFirst();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-200 bg-zinc-50">
        {/* Brand */}
        <div className="border-b border-zinc-200 px-6 py-5">
          <p className="text-sm font-semibold text-zinc-900 leading-tight">
            {business?.name ?? "Studio CFO"}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">Studio CFO</p>
        </div>

        {/* Nav */}
        <DashboardNav />
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
