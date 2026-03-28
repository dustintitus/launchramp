import Image from 'next/image';
import Link from 'next/link';

const CTA_IMAGE =
  'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=2400&q=80';

const nav = [
  { label: 'About', href: '#about' },
  { label: 'Features', href: '#features' },
  { label: 'Contact', href: '#contact' },
] as const;

const features = [
  'Schedule boat pick-up, service requests, and follow-ups from one place',
  'Manage payments and keep a clear record of every customer touchpoint',
  'Skinned to look like your business — your marina, your brand',
  'Shared inbox for SMS and messaging so nothing slips through the cracks',
  'With more on the horizon.',
];

function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-baseline gap-1 font-semibold tracking-tight ${className ?? ''}`}
    >
      <span className="rounded border border-current px-1.5 py-0.5 text-xs font-bold leading-none">
        LR
      </span>
      <span className="text-sm font-semibold tracking-[0.2em]">LAUNCH RAMP</span>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      {/* Hero — background: /public/videos/hero.mov (Adobe stock) */}
      <section className="relative flex min-h-[min(92vh,900px)] flex-col overflow-hidden">
        <video
          className="absolute inset-0 z-0 h-full min-h-full w-full object-cover object-center"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
        >
          <source src="/videos/hero.mov" type="video/quicktime" />
        </video>
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#0b1220]/75 via-[#0b1220]/45 to-[#0b1220]/85" />

        <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-6 md:px-10 lg:px-14">
          <LogoMark className="text-white" />
          <nav className="flex flex-1 flex-wrap items-center justify-end gap-x-6 gap-y-2 text-[10px] font-medium tracking-[0.18em] text-white/95 sm:text-[11px] sm:tracking-[0.2em]">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition-opacity hover:opacity-80"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/dashboard"
              className="rounded-full border border-white/40 bg-white/10 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:px-4 sm:text-[11px]"
            >
              Open app
            </Link>
          </nav>
        </header>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-24 pt-8 md:px-12">
          <p className="max-w-4xl text-center text-2xl font-bold leading-snug tracking-tight text-white md:text-4xl md:leading-tight lg:text-[2.65rem] lg:leading-[1.15]">
            Launch Ramp is an automated customer service platform that makes managing
            service requests, sales, and relationships easy.
          </p>
        </div>
      </section>

      {/* About + features */}
      <section
        id="about"
        className="border-t border-white/5 bg-[#0b1220] px-6 py-20 md:px-12 lg:px-16 lg:py-28"
      >
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-2xl font-bold leading-snug text-white md:text-3xl lg:text-[1.75rem] lg:leading-snug">
              Customer service and sales are a priority at any marina. There are boats to
              haul out, parts to order, service to be done. And it all requires a lot of
              time, effort, and attention.
            </p>
          </div>
          <div id="features" className="space-y-8">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#e8b4a0]">
              Launch Ramp can help
            </p>
            <p className="text-base leading-relaxed text-white/85">
              Launch Ramp brings your customer conversations into one place — so your team
              can respond faster, stay organized, and deliver a consistent experience on
              every channel.
            </p>
            <div>
              <p className="mb-4 text-sm font-semibold text-white">Features include</p>
              <ul className="space-y-3">
                {features.map((line) => (
                  <li key={line} className="flex gap-3 text-sm leading-relaxed text-white/85">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400"
                      aria-hidden
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative min-h-[420px] py-24 md:min-h-[480px]">
        <Image
          src={CTA_IMAGE}
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0b1220]/65" />
        <div className="relative z-10 flex min-h-[420px] flex-col items-center justify-center px-6 text-center md:min-h-[480px]">
          <LogoMark className="mb-10 text-white" />
          <h2 className="max-w-3xl text-2xl font-bold uppercase leading-tight tracking-tight text-white md:text-3xl lg:text-[2rem]">
            Want to bring Launch Ramp to your marina?{' '}
            <span className="block pt-2 md:inline md:pt-0">Let&apos;s talk.</span>
          </h2>
          <a
            id="contact"
            href="mailto:dustin@launchramp.com"
            className="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-white underline decoration-white/50 underline-offset-8 transition-colors hover:decoration-white"
          >
            Let&apos;s talk
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-teal-600 px-6 py-5 text-white md:px-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="rounded border border-white/80 px-1.5 py-0.5 text-[10px] font-bold leading-none">
              LR
            </span>
            <span className="text-xs font-medium tracking-[0.15em]">
              © LAUNCH RAMP {new Date().getFullYear()}
            </span>
          </div>
          <div className="text-center text-sm sm:text-right">
            <span className="font-semibold uppercase tracking-wide">Dustin Titus</span>
            <a
              href="mailto:dustin@launchramp.com"
              className="ml-2 text-white/95 underline-offset-2 hover:underline"
            >
              dustin@launchramp.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
