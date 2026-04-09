import type { Metadata } from 'next';
import { MicrosoftSearchChat } from '@/components/microsoft/microsoft-search-chat';

export const metadata: Metadata = {
  title: 'Microsoft 365 Search | Launch Ramp',
};

export default function MicrosoftSearchPage() {
  return <MicrosoftSearchChat />;
}
