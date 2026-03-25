import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
          LaunchRamp
        </h1>
        <p className="mt-2 text-neutral-600">
          Shared inbox & CRM for dealers and local operators
        </p>
        <Link
          href="/inbox"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
        >
          Open Inbox
        </Link>
      </div>
    </div>
  );
}
