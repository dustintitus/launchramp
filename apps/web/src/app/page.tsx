import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f1729] px-6 py-12">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center text-center">
        <div className="relative mb-10 w-full max-w-sm">
          <Image
            src="/launchramp-hero.png"
            alt="Launch Ramp — AI powered customer service"
            width={936}
            height={930}
            className="h-auto w-full drop-shadow-xl"
            priority
            sizes="(max-width: 512px) 100vw, 512px"
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Launch Ramp
        </h1>
        <p className="mt-2 text-neutral-300">
          AI powered customer service for messaging-first teams
        </p>
        <Link
          href="/inbox"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-medium text-[#0f1729] transition-colors hover:bg-neutral-100"
        >
          Open Inbox
        </Link>
      </div>
    </div>
  );
}
