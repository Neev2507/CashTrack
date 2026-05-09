"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet,
  Landmark,
  FileText,
  Users,
  GitBranch,
  Sparkles,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { label: "Cash Command",  href: "/dashboard/cash",      icon: Wallet     },
  { label: "Tax Vault",     href: "/dashboard/tax",       icon: Landmark   },
  { label: "AR Engine",     href: "/dashboard/ar",        icon: FileText   },
  { label: "Pay Planner",   href: "/dashboard/pay",       icon: Users      },
  { label: "Scenario Lab",  href: "/dashboard/scenarios", icon: GitBranch  },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-l-2 border-zinc-900 bg-white pl-[10px] text-zinc-900"
                : "border-l-2 border-transparent text-zinc-600 hover:bg-zinc-100"
            )}
          >
            <Icon size={16} strokeWidth={1.5} className="shrink-0" />
            {label}
          </Link>
        );
      })}

      <div className="mt-auto pt-4">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 transition-colors"
        >
          <Sparkles size={16} strokeWidth={1.5} />
          AI Advisor
        </button>
      </div>
    </nav>
  );
}
