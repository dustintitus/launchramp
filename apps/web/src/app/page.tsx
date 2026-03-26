import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 py-12">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
        <div className="relative mb-8 w-full max-w-md overflow-hidden rounded-2xl shadow-lg ring-1 ring-neutral-200/80">
          <img
            src="/launchramp-hero.svg"
            alt="Launch Ramp — AI powered customer service"
            width={800}
            height={420}
            className="h-auto w-full"
            fetchPriority="high"
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          Launch Ramp
        </h1>
        <p className="mt-2 text-neutral-600">
          AI powered customer service for messaging-first teams
        </p>
        <Link
          href="/inbox"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Open Inbox
        </Link>
      </div>
    </div>
  );
}
