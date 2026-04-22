import { LoginButtons } from './login-buttons';
import { isMicrosoftAuthConfigured } from '@/lib/oauth-provider-flags';

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  OAuthCreateAccount:
    'We could not finish creating your account. This is usually fixed on the server (database or default organization). Try again after a moment, or contact support.',
  OAuthCallback:
    'Google sign-in could not be completed. Check that this site’s URL is listed under Authorized redirect URIs in your Google Cloud OAuth client.',
  OAuthAccountNotLinked:
    'An account already exists with this email using a different sign-in provider. Use the same provider you used originally, or ask an admin to link accounts.',
  AccessDenied: 'You do not have permission to sign in (this account may be disabled).',
  Configuration:
    'Sign-in is misconfigured on the server (for example NEXTAUTH_SECRET, NEXTAUTH_URL, or OAuth client IDs).',
  Callback:
    'Something failed after Google returned to this app (database write, session cookie, or redirect URL). In Vercel open the latest deployment → Logs, filter for OAUTH_CALLBACK or Prisma. Confirm DATABASE_URL works from serverless, NEXTAUTH_URL matches this site (including https and no trailing slash), and try signing in from an incognito window so an old callback URL cookie cannot break the redirect.',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string; error?: string };
}) {
  const callbackUrl = searchParams?.callbackUrl ?? '/dashboard';
  const showMicrosoft = isMicrosoftAuthConfigured();
  const errorKey = searchParams?.error;
  const errorMessage =
    errorKey &&
    (AUTH_ERROR_MESSAGES[errorKey] ??
      `Sign-in failed (${errorKey}). Try again or use a different provider.`);

  return (
    <main className="flex min-h-screen items-center justify-center bg-dashboard-frame p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Sign in to Launch Ramp
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {showMicrosoft
              ? 'Use Google or Microsoft to continue.'
              : 'Use Google to continue.'}
          </p>
          {errorMessage ? (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
            >
              {errorMessage}
            </p>
          ) : null}
        </div>

        <LoginButtons callbackUrl={callbackUrl} showMicrosoft={showMicrosoft} />
      </div>
    </main>
  );
}

