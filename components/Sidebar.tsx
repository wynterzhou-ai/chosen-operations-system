"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardCheck,
  FileText,
  Gauge,
  ListChecks,
  MapPinCheck,
  Receipt,
  ShieldAlert,
  WalletCards,
  Users,
  UserRound
} from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/employees", label: "Employees", icon: UserRound },
  { href: "/attendance", label: "Attendance", icon: MapPinCheck },
  { href: "/checklists", label: "Checklists", icon: ListChecks },
  { href: "/compliance", label: "Compliance", icon: ShieldAlert },
  { href: "/payroll", label: "Payroll", icon: WalletCards },
  { href: "/rosters", label: "Rosters", icon: CalendarDays },
  { href: "/inspections", label: "Inspections", icon: ClipboardCheck },
  { href: "/quotations", label: "Quotations", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-line bg-white px-4 py-5">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chosen</p>
        <h1 className="text-lg font-semibold text-ink">Operations System</h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${
                active ? "bg-teal-50 text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
              }`}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <LogoutButton />
    </aside>
  );
}
