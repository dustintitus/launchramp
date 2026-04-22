import { LoginButtons } from './login-buttons';

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string };
}) {
  const callbackUrl = searchParams?.callbackUrl ?? '/dashboard';

  return (
    <main className="flex min-h-screen items-center justify-center bg-dashboard-frame p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Sign in to Launch Ramp
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Use Google or Microsoft to continue.
          </p>
        </div>

        <LoginButtons callbackUrl={callbackUrl} />
      </div>
    </main>
  );
}

