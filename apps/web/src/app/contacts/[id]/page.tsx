import { ContactDetailView } from './contact-detail-view';

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ContactDetailView id={id} />
    </div>
  );
}
