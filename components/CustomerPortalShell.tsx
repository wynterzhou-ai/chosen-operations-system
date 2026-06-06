"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, FileText, Gauge, ListChecks, Receipt } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const portalNav = [
  { href: "/portal", label: "Overview", icon: Gauge },
  { href: "/portal/invoices", label: "Invoices", icon: Receipt },
  { href: "/portal/quotations", label: "Quotations", icon: FileText },
  { href: "/portal/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/portal/checklists", label: "Checklists", icon: ListChecks }
];

export default function CustomerPortalShell({ clientName, children }: { clientName?: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chosen Customer Portal</p>
              <h1 className="text-lg font-semibold text-ink">{clientName ?? "Client Access"}</h1>
            </div>
            <div className="w-full sm:w-auto">
              <LogoutButton />
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {portalNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    active ? "bg-teal-50 text-brand" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
