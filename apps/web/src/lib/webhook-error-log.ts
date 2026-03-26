export function logWebhookError(scope: string, error: unknown) {
  const err = error as {
    message?: string;
    stack?: string;
    code?: string;
    meta?: unknown;
  };
  console.error(`[${scope}]`, {
    message: err?.message ?? String(error),
    code: err?.code,
    meta: err?.meta,
    stack: err?.stack,
  });
}
