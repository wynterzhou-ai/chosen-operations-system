import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4">
      <div className="panel max-w-lg p-6">
        <p className="font-semibold text-ink">Page not found</p>
        <p className="mt-2 text-sm text-slate-600">The page you opened does not exist or is no longer available.</p>
        <Link className="btn-primary mt-4" href="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
