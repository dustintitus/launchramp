import { type DefaultSession } from 'next-auth';
import { type UserRole } from '@launchramp/db';

declare module 'next-auth' {
  interface Session {
    user: DefaultSession['user'] & {
      id: string;
      role: UserRole;
      organizationId: string;
      disabled: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
    organizationId?: string;
    disabled?: boolean;
  }
}

