import { Camera, MapPin } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { AttendanceRecord } from "@/types/database";

function formatTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-SG", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatGps(lat: number | null, lng: number | null) {
  if (lat === null || lng === null) return "No GPS";
  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
}

export default function PortalAttendance({ records }: { records: AttendanceRecord[] }) {
  return (
    <div className="space-y-4">
      {records.map((record) => (
        <article className="panel p-5" key={record.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-ink">{record.employees?.name ?? "Cleaner"}</p>
              <p className="mt-1 text-sm text-slate-500">{formatDate(record.check_in_time)}</p>
            </div>
            <span className="rounded-md bg-slate-50 px-3 py-2 text-sm font-medium capitalize text-slate-600">{record.status.replace(/_/g, " ")}</span>
          </div>

          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="label">Check In</p>
              <p className="mt-1 font-medium text-ink">{formatTime(record.check_in_time)}</p>
            </div>
            <div>
              <p className="label">Check Out</p>
              <p className="mt-1 font-medium text-ink">{formatTime(record.check_out_time)}</p>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin size={16} />
              {formatGps(record.check_in_lat, record.check_in_lng)}
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin size={16} />
              {formatGps(record.check_out_lat, record.check_out_lng)}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {record.check_in_photo_url ? (
              <a className="inline-flex items-center gap-2 font-medium text-brand hover:underline" href={record.check_in_photo_url} target="_blank">
                <Camera size={16} />
                Check-in Photo
              </a>
            ) : null}
            {record.check_out_photo_url ? (
              <a className="inline-flex items-center gap-2 font-medium text-brand hover:underline" href={record.check_out_photo_url} target="_blank">
                <Camera size={16} />
                Check-out Photo
              </a>
            ) : null}
          </div>

          {record.remarks ? <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{record.remarks}</p> : null}
        </article>
      ))}

      {!records.length ? <div className="panel p-6 text-sm text-slate-500">No attendance records available.</div> : null}
    </div>
  );
}
