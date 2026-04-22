'use client';

import { signIn } from 'next-auth/react';

export function LoginButtons({ callbackUrl }: { callbackUrl: string }) {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => signIn('google', { callbackUrl })}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50"
      >
        Continue with Google
      </button>
      <button
        type="button"
        onClick={() => signIn('azure-ad', { callbackUrl })}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm transition hover:bg-slate-50"
      >
        Continue with Microsoft
      </button>
    </div>
  );
}

