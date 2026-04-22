/** Server-only: whether Microsoft Entra is fully configured (no secret values exposed). */
export function isMicrosoftAuthConfigured(): boolean {
  return (
    Boolean(process.env.MICROSOFT_CLIENT_ID?.trim()) &&
    Boolean(process.env.MICROSOFT_CLIENT_SECRET?.trim()) &&
    Boolean(process.env.MICROSOFT_TENANT_ID?.trim())
  );
}
