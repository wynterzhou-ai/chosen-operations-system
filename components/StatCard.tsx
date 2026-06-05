import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
};

export default function StatCard({ label, value, helper, icon: Icon }: StatCardProps) {
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
          {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
        </div>
        <div className="rounded-md bg-teal-50 p-2 text-brand">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
