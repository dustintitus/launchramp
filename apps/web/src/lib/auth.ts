/**
 * Placeholder auth - replace with NextAuth, Clerk, etc.
 * For MVP we use a fixed org + user from env or defaults.
 */
export const MOCK_ORG_ID = 'org_launchramp_demo';
export const MOCK_USER_ID = 'user_demo_1';

export function getCurrentOrgId(): string {
  return process.env.NEXT_PUBLIC_ORG_ID ?? MOCK_ORG_ID;
}

export function getCurrentUserId(): string {
  return process.env.NEXT_PUBLIC_USER_ID ?? MOCK_USER_ID;
}
