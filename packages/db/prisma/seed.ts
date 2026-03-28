import './seed-env';
import { prisma } from '../src';

async function main() {
  const ORG_ID = 'org_launchramp_demo';
  const USER1_ID = 'user_demo_1';
  const USER2_ID = 'user_demo_2';

  const org = await prisma.organization.upsert({
    where: { slug: 'launchramp-demo' },
    update: { name: 'Bala Cove Marina' },
    create: {
      id: ORG_ID,
      name: 'Bala Cove Marina',
      slug: 'launchramp-demo',
    },
  });

  const [user1, user2] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alex@launchramp.demo' },
      update: { organizationId: org.id },
      create: {
        id: USER1_ID,
        email: 'alex@launchramp.demo',
        name: 'Alex Johnson',
        organizationId: org.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'jamie@launchramp.demo' },
      update: { organizationId: org.id },
      create: {
        id: USER2_ID,
        email: 'jamie@launchramp.demo',
        name: 'Jamie Smith',
        organizationId: org.id,
      },
    }),
  ]);

  /** Must match the E.164 Twilio number that receives SMS (webhook `To` field). */
  const inboundTwilioPhone =
    process.env.TWILIO_INBOUND_NUMBER ?? '+18077818017';

  let channelAccount = await prisma.channelAccount.findFirst({
    where: { organizationId: org.id, channelType: 'sms' },
  });
  if (!channelAccount) {
    channelAccount = await prisma.channelAccount.create({
      data: {
        organizationId: org.id,
        channelType: 'sms',
        phoneNumber: inboundTwilioPhone,
        externalId: inboundTwilioPhone,
      },
    });
  } else if (channelAccount.phoneNumber !== inboundTwilioPhone) {
    channelAccount = await prisma.channelAccount.update({
      where: { id: channelAccount.id },
      data: {
        phoneNumber: inboundTwilioPhone,
        externalId: inboundTwilioPhone,
      },
    });
  }

  const contacts = await Promise.all(
    [
      { phone: '+15551234567', name: 'Sarah Chen', email: 'sarah@example.com', stage: 'qualified' as const, ownerId: user1.id, tags: ['vip'] },
      { phone: '+15559876543', name: 'Mike Rodriguez', email: null, stage: 'lead' as const, ownerId: null, tags: [] },
      { phone: '+15555555555', name: 'Emma Wilson', email: 'emma@example.com', stage: 'customer' as const, ownerId: user1.id, tags: ['repeat'] },
      { phone: '+15552223333', name: 'James Lee', email: null, stage: 'lead' as const, ownerId: null, tags: [] },
      { phone: '+15554445566', name: 'Lisa Park', email: 'lisa@example.com', stage: 'qualified' as const, ownerId: user2.id, tags: [] },
      { phone: '+15557778899', name: 'David Kim', email: null, stage: 'lead' as const, ownerId: null, tags: [] },
      { phone: '+15551112233', name: 'Rachel Green', email: 'rachel@example.com', stage: 'customer' as const, ownerId: user2.id, tags: ['vip'] },
      { phone: '+15553334444', name: 'Tom Brown', email: null, stage: 'churned' as const, ownerId: null, tags: [] },
      { phone: '+15556667777', name: 'Anna Martinez', email: 'anna@example.com', stage: 'qualified' as const, ownerId: user1.id, tags: [] },
      { phone: '+15559990000', name: 'Chris Taylor', email: null, stage: 'lead' as const, ownerId: null, tags: [] },
    ].map((c) =>
      prisma.contact.upsert({
        where: {
          organizationId_phone: { organizationId: org.id, phone: c.phone },
        },
        update: { ...c },
        create: {
          organizationId: org.id,
          ...c,
        },
      })
    )
  );

  for (let i = 0; i < contacts.length; i++) {
    const contact = contacts[i];
    let conv = await prisma.conversation.findUnique({
      where: {
        organizationId_contactId_channelAccountId: {
          organizationId: org.id,
          contactId: contact.id,
          channelAccountId: channelAccount.id,
        },
      },
    });
    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          organizationId: org.id,
          contactId: contact.id,
          channelAccountId: channelAccount.id,
          channelType: 'sms',
          assignedToId: contact.ownerId,
          isUnread: i < 4,
          lastMessageAt: new Date(Date.now() - i * 3600000),
        },
      });
    }

    const msgCount = Math.min(5, 2 + (i % 4));
    for (let j = 0; j < msgCount; j++) {
      const isInbound = j % 2 === 0;
      await prisma.message.create({
        data: {
          conversationId: conv.id,
          body: isInbound
            ? `Inbound message ${j + 1} from ${contact.name ?? contact.phone}`
            : `Reply ${j + 1} to customer`,
          direction: isInbound ? 'inbound' : 'outbound',
          channelType: 'sms',
          status: 'delivered',
          providerMessageId: `ext_${conv.id}_${j}`,
          createdAt: new Date(Date.now() - (msgCount - j) * 600000),
        },
      });
    }

    await prisma.activity.createMany({
      data: [
        { organizationId: org.id, contactId: contact.id, type: 'message_received', createdAt: new Date(Date.now() - 3600000) },
        { organizationId: org.id, contactId: contact.id, type: 'message_sent', createdAt: new Date(Date.now() - 3000000) },
        { organizationId: org.id, contactId: contact.id, type: 'note_added', metadata: { content: `Note for ${contact.name ?? contact.phone}` }, createdAt: new Date(Date.now() - 86400000) },
      ],
    });
  }

  await prisma.template.createMany({
    data: [
      { organizationId: org.id, name: 'Welcome', body: 'Hi {{name}}, thanks for reaching out! How can we help you today?', variables: ['name'] },
      { organizationId: org.id, name: 'Follow-up', body: 'Hi {{name}}, just checking in. Do you have any questions?', variables: ['name'] },
      { organizationId: org.id, name: 'Appointment Reminder', body: 'Hi {{name}}, this is a reminder of your appointment tomorrow at {{time}}.', variables: ['name', 'time'] },
    ],
    skipDuplicates: true,
  });

  const bookingRows = [
    {
      orderNumber: 'LR-2401',
      service: 'Dry Launch',
      scheduledAt: new Date(Date.now() + 86400000),
      status: 'PENDING' as const,
    },
    {
      orderNumber: 'LR-2402',
      service: 'Pick-Up',
      scheduledAt: new Date(Date.now() + 172800000),
      status: 'READY' as const,
    },
    {
      orderNumber: 'LR-2403',
      service: 'Drop-Off',
      scheduledAt: new Date(Date.now() + 259200000),
      status: 'COMPLETE' as const,
    },
    {
      orderNumber: 'LR-2404',
      service: 'Dry Launch',
      scheduledAt: new Date(Date.now() + 345600000),
      status: 'PENDING' as const,
    },
    {
      orderNumber: 'LR-2405',
      service: 'Pick-Up',
      scheduledAt: new Date(Date.now() + 432000000),
      status: 'PENDING' as const,
    },
  ];

  for (const b of bookingRows) {
    await prisma.booking.upsert({
      where: {
        organizationId_orderNumber: {
          organizationId: org.id,
          orderNumber: b.orderNumber,
        },
      },
      update: {},
      create: {
        organizationId: org.id,
        orderNumber: b.orderNumber,
        service: b.service,
        scheduledAt: b.scheduledAt,
        status: b.status,
      },
    });
  }

  const staffRows = [
    {
      name: 'Alex Lee',
      role: 'Driver',
      license: 'G',
      availability: 10,
      status: 'NA' as const,
    },
    {
      name: 'John Smith',
      role: 'Driver',
      license: 'A',
      availability: 8,
      status: 'PICK_UP' as const,
    },
    {
      name: 'Maria Garcia',
      role: 'Driver',
      license: 'G',
      availability: 5,
      status: 'AVAILABLE' as const,
    },
    {
      name: 'Sam Wilson',
      role: 'Driver',
      license: 'G',
      availability: null,
      status: 'ON_JOB' as const,
    },
  ];

  for (const s of staffRows) {
    await prisma.staffMember.upsert({
      where: {
        organizationId_name: { organizationId: org.id, name: s.name },
      },
      update: {
        role: s.role,
        license: s.license,
        availability: s.availability,
        status: s.status,
      },
      create: {
        organizationId: org.id,
        name: s.name,
        role: s.role,
        license: s.license,
        availability: s.availability,
        status: s.status,
      },
    });
  }

  console.log('Seed complete. Org ID:', org.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
