"use client";

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-4">
      <div className="panel max-w-lg p-6">
        <p className="font-semibold text-ink">Something went wrong</p>
        <p className="mt-2 text-sm text-slate-600">{error.message || "The page could not be loaded."}</p>
        <button className="btn-primary mt-4" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
