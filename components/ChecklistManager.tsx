"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, CheckCircle2, ClipboardCheck, ListPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type {
  ChecklistItem,
  ChecklistItemResult,
  ChecklistSubmission,
  ChecklistTemplate,
  Client
} from "@/types/database";

type ChecklistManagerProps = {
  clients: Client[];
  templates: ChecklistTemplate[];
  items: ChecklistItem[];
  submissions: ChecklistSubmission[];
};

type ItemState = Record<string, { result: ChecklistItemResult; remarks: string }>;

const defaultChecklistItems = [
  "Pantry counter cleaned",
  "Meeting room tables wiped",
  "Meeting room chairs arranged",
  "Glass panels checked",
  "Phone booth cleaned",
  "Waste bins cleared",
  "Carpet/floor vacuumed",
  "High-touch surfaces disinfected",
  "Supplies checked",
  "Issues reported to supervisor"
];

function formatSupabaseError(error: { message?: string; details?: string | null; hint?: string | null; code?: string | null }) {
  return [error.message, error.details, error.hint, error.code ? `Code: ${error.code}` : null].filter(Boolean).join(" ");
}

export default function ChecklistManager({ clients, templates, items, submissions }: ChecklistManagerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [beforePhoto, setBeforePhoto] = useState<File | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [form, setForm] = useState({
    client_id: clients[0]?.id ?? "",
    template_id: templates[0]?.id ?? "",
    site_name: "",
    supervisor_name: "",
    submission_date: new Date().toISOString().slice(0, 10),
    remarks: ""
  });

  const selectedItems = useMemo(() => {
    return items
      .filter((item) => item.template_id === form.template_id)
      .sort((first, second) => first.sort_order - second.sort_order);
  }, [form.template_id, items]);

  const [itemStates, setItemStates] = useState<ItemState>(() => {
    return Object.fromEntries(items.map((item) => [item.id, { result: "pass", remarks: "" }]));
  });

  const completedCount = selectedItems.filter((item) => itemStates[item.id]?.result).length;
  const failedCount = selectedItems.filter((item) => itemStates[item.id]?.result === "fail").length;
  const progressPercent = selectedItems.length ? Math.round((completedCount / selectedItems.length) * 100) : 0;

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateItem(itemId: string, field: "result" | "remarks", value: string) {
    setItemStates((current) => ({
      ...current,
      [itemId]: {
        result: current[itemId]?.result ?? "pass",
        remarks: current[itemId]?.remarks ?? "",
        [field]: value
      }
    }));
  }

  async function uploadPhoto(file: File | null, prefix: string) {
    if (!file) return null;

    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const filePath = `${prefix}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("checklist-photos").upload(filePath, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage.from("checklist-photos").getPublicUrl(filePath);
    return data.publicUrl;
  }

  async function seedDefaultTemplate() {
    setError("");
    setSuccess("");
    setSeedLoading(true);

    try {
      const supabase = createClient();
      const { data: existingTemplate, error: lookupError } = await supabase
        .from("checklist_templates")
        .select("id")
        .eq("name", "Default Office Cleaning Checklist")
        .limit(1)
        .maybeSingle();

      if (lookupError) {
        setError(`Template lookup failed: ${formatSupabaseError(lookupError)}`);
        setSeedLoading(false);
        return;
      }

      let templateId = existingTemplate?.id;

      if (!templateId) {
        const primaryInsert = await supabase
          .from("checklist_templates")
          .insert({
            name: "Default Office Cleaning Checklist",
            description: "Standard checklist for office cleaning operations",
            is_active: true
          })
          .select("id")
          .single();

        if (primaryInsert.error) {
          const fallbackInsert = await supabase
            .from("checklist_templates")
            .insert({
              name: "Default Office Cleaning Checklist",
              description: "Standard checklist for office cleaning operations"
            })
            .select("id")
            .single();

          if (fallbackInsert.error) {
            setError(
              `Template insert failed: ${formatSupabaseError(fallbackInsert.error)} First attempt: ${formatSupabaseError(primaryInsert.error)}`
            );
            setSeedLoading(false);
            return;
          }

          templateId = fallbackInsert.data.id;
        } else {
          templateId = primaryInsert.data.id;
        }
      } else {
        const { error: activateError } = await supabase
          .from("checklist_templates")
          .update({ is_active: true })
          .eq("id", templateId);

        if (activateError && !activateError.message.toLowerCase().includes("is_active")) {
          setError(`Template activation failed: ${formatSupabaseError(activateError)}`);
          setSeedLoading(false);
          return;
        }
      }

      if (!templateId) {
        setError("Template insert failed: no template id was returned.");
        setSeedLoading(false);
        return;
      }

      const { data: existingItems, error: existingItemsError } = await supabase
        .from("checklist_items")
        .select("item_text")
        .eq("template_id", templateId);

      if (existingItemsError) {
        setError(`Checklist item lookup failed: ${formatSupabaseError(existingItemsError)}`);
        setSeedLoading(false);
        return;
      }

      const existingItemTexts = new Set((existingItems ?? []).map((item) => item.item_text));
      const itemsToInsert = defaultChecklistItems
        .map((itemText, index) => ({
          template_id: templateId,
          item_text: itemText,
          sort_order: index + 1,
          is_required: true
        }))
        .filter((item) => !existingItemTexts.has(item.item_text));

      if (!itemsToInsert.length) {
        setSuccess("Default Office Cleaning Checklist already exists.");
        setSeedLoading(false);
        router.refresh();
        return;
      }

      const { error: itemsError } = await supabase.from("checklist_items").insert(itemsToInsert);

      if (itemsError) {
        setError(`Checklist item insert failed: ${formatSupabaseError(itemsError)}`);
        setSeedLoading(false);
        return;
      }

      setSuccess("Default Office Cleaning Checklist created.");
      router.refresh();
    } catch (seedError) {
      setError(seedError instanceof Error ? seedError.message : "Unable to seed default checklist template.");
    } finally {
      setSeedLoading(false);
    }
  }

  async function submitChecklist(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!form.client_id || !form.template_id) {
      setError("Please select a client and checklist template.");
      setLoading(false);
      return;
    }

    if (!selectedItems.length) {
      setError("The selected template has no checklist items.");
      setLoading(false);
      return;
    }

    try {
      const beforePhotoUrl = await uploadPhoto(beforePhoto, "before");
      const afterPhotoUrl = await uploadPhoto(afterPhoto, "after");
      const hasIssue = selectedItems.some((item) => (itemStates[item.id]?.result ?? "pass") === "fail");
      const supabase = createClient();

      const { data: submission, error: submissionError } = await supabase
        .from("checklist_submissions")
        .insert({
          template_id: form.template_id,
          client_id: form.client_id,
          site_name: form.site_name || null,
          supervisor_name: form.supervisor_name || null,
          submission_date: form.submission_date,
          before_photo_url: beforePhotoUrl,
          after_photo_url: afterPhotoUrl,
          remarks: form.remarks || null,
          status: hasIssue ? "issue" : "completed"
        })
        .select()
        .single();

      if (submissionError) {
        setError(submissionError.message);
        setLoading(false);
        return;
      }

      const { error: itemsError } = await supabase.from("checklist_submission_items").insert(
        selectedItems.map((item) => ({
          submission_id: submission.id,
          checklist_item_id: item.id,
          result: itemStates[item.id]?.result ?? "pass",
          remarks: itemStates[item.id]?.remarks || null
        }))
      );

      if (itemsError) {
        setError(itemsError.message);
        setLoading(false);
        return;
      }

      setBeforePhoto(null);
      setAfterPhoto(null);
      setForm((current) => ({ ...current, site_name: "", supervisor_name: "", remarks: "" }));
      setItemStates((current) => {
        const next = { ...current };
        selectedItems.forEach((item) => {
          next[item.id] = { result: "pass", remarks: "" };
        });
        return next;
      });
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit checklist.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <form className="space-y-5 pb-24 lg:pb-0" onSubmit={submitChecklist}>
        <section className="panel p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-ink">New Checklist</h2>
              <p className="mt-1 text-sm text-slate-500">Record supervisor checks for a client or site.</p>
            </div>
            <div className={`rounded-md px-3 py-2 text-sm font-medium ${failedCount ? "bg-red-50 text-red-700" : "bg-teal-50 text-brand"}`}>
              {failedCount ? `${failedCount} issue${failedCount === 1 ? "" : "s"}` : "All clear"}
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-ink">Checklist progress</span>
              <span className="text-slate-500">
                {completedCount}/{selectedItems.length} items
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className={`h-full rounded-full ${failedCount ? "bg-red-500" : "bg-brand"}`} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </section>

        <section className="panel p-5">
          <div className={`rounded-md border p-3 ${templates.length ? "border-line bg-slate-50" : "border-amber-200 bg-amber-50"}`}>
            <p className={templates.length ? "text-sm text-slate-600" : "text-sm text-amber-800"}>
              {templates.length ? "Need the standard office checklist?" : "No checklist templates found."}
            </p>
            <button className="btn-secondary mt-3 w-full sm:w-auto" type="button" onClick={seedDefaultTemplate} disabled={seedLoading}>
              <ListPlus size={16} />
              {seedLoading ? "Creating template..." : "Seed Default Office Template"}
            </button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Client</label>
              <select className="field mt-1" value={form.client_id} onChange={(event) => updateField("client_id", event.target.value)} required>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input className="field mt-1" type="date" value={form.submission_date} onChange={(event) => updateField("submission_date", event.target.value)} required />
            </div>
            <div>
              <label className="label">Site</label>
              <input className="field mt-1" value={form.site_name} onChange={(event) => updateField("site_name", event.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="label">Supervisor</label>
              <input className="field mt-1" value={form.supervisor_name} onChange={(event) => updateField("supervisor_name", event.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="mt-4">
            <label className="label">Template</label>
            <select className="field mt-1" value={form.template_id} onChange={(event) => updateField("template_id", event.target.value)} required>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="space-y-3">
          {selectedItems.map((item, index) => {
            const result = itemStates[item.id]?.result ?? "pass";

            return (
              <article className="panel p-4" key={item.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-600">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{item.item_text}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{result === "fail" ? "Requires follow-up" : "Passed"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 overflow-hidden rounded-md border border-line text-sm sm:min-w-40">
                    <button
                      className={`px-3 py-2 font-medium ${result === "pass" ? "bg-teal-50 text-brand" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                      type="button"
                      onClick={() => updateItem(item.id, "result", "pass")}
                    >
                      Pass
                    </button>
                    <button
                      className={`border-l border-line px-3 py-2 font-medium ${result === "fail" ? "bg-red-50 text-red-700" : "bg-white text-slate-600 hover:bg-slate-50"}`}
                      type="button"
                      onClick={() => updateItem(item.id, "result", "fail")}
                    >
                      Fail
                    </button>
                  </div>
                </div>
                <input
                  className="field mt-3"
                  value={itemStates[item.id]?.remarks ?? ""}
                  onChange={(event) => updateItem(item.id, "remarks", event.target.value)}
                  placeholder="Item remarks"
                />
              </article>
            );
          })}
          {!selectedItems.length ? <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">No items found for this template.</p> : null}
        </section>

        <section className="panel space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Before Photo</label>
              <input className="field mt-1" type="file" accept="image/*" onChange={(event) => setBeforePhoto(event.target.files?.[0] ?? null)} />
            </div>
            <div>
              <label className="label">After Photo</label>
              <input className="field mt-1" type="file" accept="image/*" onChange={(event) => setAfterPhoto(event.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div>
            <label className="label">Overall Remarks</label>
            <textarea className="field mt-1 min-h-20" value={form.remarks} onChange={(event) => updateField("remarks", event.target.value)} />
          </div>

          {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {success ? <p className="rounded-md bg-teal-50 px-3 py-2 text-sm text-brand">{success}</p> : null}
        </section>

        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white/95 p-4 shadow-lg backdrop-blur lg:sticky lg:bottom-4 lg:rounded-lg lg:border lg:shadow-soft">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p className="font-medium text-ink">{progressPercent}% complete</p>
              <p className={failedCount ? "text-red-700" : "text-slate-500"}>
                {failedCount ? `${failedCount} failed item${failedCount === 1 ? "" : "s"}` : "Ready to submit when checks are complete."}
              </p>
            </div>
            <button className="btn-primary w-full sm:w-auto" disabled={loading || !clients.length || !templates.length}>
              <CheckCircle2 size={16} />
              {loading ? "Submitting..." : "Submit Checklist"}
            </button>
          </div>
        </div>
      </form>

      <aside className="space-y-4 xl:sticky xl:top-6">
        <div className="panel p-5">
          <h2 className="font-semibold text-ink">Submitted History</h2>
          <p className="mt-1 text-sm text-slate-500">{submissions.length} recent checklist submission{submissions.length === 1 ? "" : "s"}.</p>
        </div>

        {submissions.map((submission) => {
          const failedItems = submission.checklist_submission_items?.filter((item) => item.result === "fail") ?? [];

          return (
            <article className="panel p-5" key={submission.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{submission.checklist_templates?.name ?? "Checklist"}</p>
                  <p className="text-sm text-slate-500">
                    {submission.clients?.name ?? "Client"}{submission.site_name ? ` · ${submission.site_name}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600">{formatDate(submission.submission_date)}</p>
                  <p className={`text-sm font-medium ${submission.status === "issue" ? "text-red-700" : "text-brand"}`}>
                    {submission.status === "issue" ? `${failedItems.length} issue${failedItems.length === 1 ? "" : "s"}` : "Completed"}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {submission.checklist_submission_items?.map((item) => (
                  <div className="flex items-start justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm" key={item.id}>
                    <div>
                      <p className="font-medium text-ink">{item.checklist_items?.item_text ?? "Checklist item"}</p>
                      {item.remarks ? <p className="mt-1 text-slate-500">{item.remarks}</p> : null}
                    </div>
                    <span className={item.result === "fail" ? "font-medium text-red-700" : "font-medium text-brand"}>{item.result}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {submission.before_photo_url ? (
                  <a className="inline-flex items-center gap-2 font-medium text-brand hover:underline" href={submission.before_photo_url} target="_blank">
                    <Camera size={16} />
                    Before
                  </a>
                ) : null}
                {submission.after_photo_url ? (
                  <a className="inline-flex items-center gap-2 font-medium text-brand hover:underline" href={submission.after_photo_url} target="_blank">
                    <Camera size={16} />
                    After
                  </a>
                ) : null}
                {submission.supervisor_name ? <span className="text-slate-500">Supervisor: {submission.supervisor_name}</span> : null}
              </div>

              {submission.remarks ? <p className="mt-3 rounded-md border border-line px-3 py-2 text-sm text-slate-600">{submission.remarks}</p> : null}
            </article>
          );
        })}

        {!submissions.length ? (
          <div className="panel p-6 text-sm text-slate-500">
            <ClipboardCheck className="mb-3 text-slate-400" size={20} />
            No submitted checklists yet.
          </div>
        ) : null}
      </aside>
    </div>
  );
}
