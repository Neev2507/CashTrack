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
      <aside className="flex w-60 shrink-0 flex-col border-r border-outline-variant bg-surface-container-low">
        {/* Brand */}
        <div className="border-b border-outline-variant px-6 py-5">
          <p className="text-display text-on-surface leading-tight">
            {business?.name ?? "Studio CFO"}
          </p>
          <p className="text-label-xs uppercase tracking-tight text-on-surface-variant mt-0.5">
            Studio CFO
          </p>
        </div>

        {/* Nav */}
        <DashboardNav />
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-background">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
