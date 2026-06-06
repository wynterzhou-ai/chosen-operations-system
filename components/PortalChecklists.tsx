import { Camera, CheckCircle2, XCircle } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { ChecklistSubmission } from "@/types/database";

export default function PortalChecklists({ submissions }: { submissions: ChecklistSubmission[] }) {
  return (
    <div className="space-y-4">
      {submissions.map((submission) => {
        const failedItems = submission.checklist_submission_items?.filter((item) => item.result === "fail") ?? [];

        return (
          <article className="panel p-5" key={submission.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-ink">{submission.checklist_templates?.name ?? "Checklist"}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(submission.submission_date)}
                  {submission.site_name ? ` / ${submission.site_name}` : ""}
                </p>
              </div>
              <span className={`rounded-md px-3 py-2 text-sm font-medium ${submission.status === "issue" ? "bg-red-50 text-red-700" : "bg-teal-50 text-brand"}`}>
                {submission.status === "issue" ? `${failedItems.length} issue${failedItems.length === 1 ? "" : "s"}` : "Completed"}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {submission.checklist_submission_items?.map((item) => (
                <div className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm" key={item.id}>
                  <div>
                    <p className="font-medium text-ink">{item.checklist_items?.item_text ?? "Checklist item"}</p>
                    {item.remarks ? <p className="mt-1 text-slate-500">{item.remarks}</p> : null}
                  </div>
                  <span className={`inline-flex items-center gap-1 font-medium ${item.result === "fail" ? "text-red-700" : "text-brand"}`}>
                    {item.result === "fail" ? <XCircle size={15} /> : <CheckCircle2 size={15} />}
                    {item.result}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {submission.before_photo_url ? (
                <a className="inline-flex items-center gap-2 font-medium text-brand hover:underline" href={submission.before_photo_url} target="_blank">
                  <Camera size={16} />
                  Before Photo
                </a>
              ) : null}
              {submission.after_photo_url ? (
                <a className="inline-flex items-center gap-2 font-medium text-brand hover:underline" href={submission.after_photo_url} target="_blank">
                  <Camera size={16} />
                  After Photo
                </a>
              ) : null}
              {submission.supervisor_name ? <span className="text-slate-500">Supervisor: {submission.supervisor_name}</span> : null}
            </div>

            {submission.remarks ? <p className="mt-3 rounded-md border border-line px-3 py-2 text-sm text-slate-600">{submission.remarks}</p> : null}
          </article>
        );
      })}

      {!submissions.length ? <div className="panel p-6 text-sm text-slate-500">No checklist submissions available.</div> : null}
    </div>
  );
}
