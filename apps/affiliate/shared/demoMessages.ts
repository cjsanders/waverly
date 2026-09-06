export type DemoMessageIdentity = 'operator' | 'northstar' | 'everyday' | 'avery' | 'puroair'

export interface DemoMessageParticipantSeed {
  identityKey: DemoMessageIdentity
  title: string
  team: string
  unreadCount: number
}

export interface DemoMessageSeed {
  senderIdentityKey: string
  senderLabel: string
  body: string
  sentAt: number
}

export interface DemoMessageThreadSeed {
  key: string
  subject: string
  team: string
  status: 'online' | 'away'
  participants: DemoMessageParticipantSeed[]
  messages: DemoMessageSeed[]
}

const at = (day: number, hour: number, minute: number) => Date.UTC(2026, 7, day, hour, minute)

export const demoMessageThreads: DemoMessageThreadSeed[] = [
  {
    key: 'avery-northstar-puroair',
    subject: 'PuroAir fall home reset',
    team: 'Northstar Media',
    status: 'online',
    participants: [
      {
        identityKey: 'northstar',
        title: 'Avery Lane · PuroAir',
        team: 'Creator partnerships',
        unreadCount: 0,
      },
      {
        identityKey: 'avery',
        title: 'PuroAir fall home reset',
        team: 'Jamie · Northstar Media',
        unreadCount: 2,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'northstar',
        senderLabel: 'Jamie · Northstar Media',
        body: 'The PuroAir brief is locked. We need one 45–60 second vertical video and three story frames by September 3.',
        sentAt: at(15, 8, 42),
      },
      {
        senderIdentityKey: 'avery',
        senderLabel: 'Avery Lane',
        body: 'I have the purifier and the first scene is shot. I’ll send the rough cut before noon on September 1.',
        sentAt: at(15, 9, 6),
      },
      {
        senderIdentityKey: 'northstar',
        senderLabel: 'Jamie · Northstar Media',
        body: 'Perfect. Keep the opening focused on the room reset; legal approved the on-screen claims in the brief.',
        sentAt: at(15, 9, 22),
      },
    ],
  },
  {
    key: 'avery-northstar-hero',
    subject: 'Hero Cosmetics review',
    team: 'Northstar Media',
    status: 'online',
    participants: [
      {
        identityKey: 'northstar',
        title: 'Avery Lane · Hero Cosmetics',
        team: 'Creator partnerships',
        unreadCount: 1,
      },
      {
        identityKey: 'avery',
        title: 'Hero Cosmetics review',
        team: 'Jamie · Northstar Media',
        unreadCount: 1,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'avery',
        senderLabel: 'Avery Lane',
        body: 'The newsletter feature and final product selects are submitted for review.',
        sentAt: at(14, 14, 18),
      },
      {
        senderIdentityKey: 'northstar',
        senderLabel: 'Jamie · Northstar Media',
        body: 'The edit is strong. We only need the second image recropped to 4:5 before approval.',
        sentAt: at(14, 15, 4),
      },
    ],
  },
  {
    key: 'avery-everyday-sports-research',
    subject: 'Sports Research morning wellness',
    team: 'Everyday Finds',
    status: 'away',
    participants: [
      {
        identityKey: 'everyday',
        title: 'Avery Lane · Sports Research',
        team: 'Creator partnerships',
        unreadCount: 0,
      },
      {
        identityKey: 'avery',
        title: 'Sports Research morning wellness',
        team: 'Robin · Everyday Finds',
        unreadCount: 0,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'everyday',
        senderLabel: 'Robin · Everyday Finds',
        body: 'Thanks for accepting. The project room now has the guide outline, usage terms, and the September 12 delivery date.',
        sentAt: at(13, 11, 36),
      },
      {
        senderIdentityKey: 'avery',
        senderLabel: 'Avery Lane',
        body: 'Received. I’ll confirm the shot list after the sample arrives.',
        sentAt: at(13, 12, 8),
      },
    ],
  },
  {
    key: 'everyday-review',
    subject: 'Everyday Finds review',
    team: 'Partner operations',
    status: 'online',
    participants: [
      {
        identityKey: 'operator',
        title: 'Everyday Finds review',
        team: 'Partner operations',
        unreadCount: 2,
      },
      {
        identityKey: 'everyday',
        title: 'Partner operations',
        team: 'Waverly partner operations',
        unreadCount: 1,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'partner-operations',
        senderLabel: 'Maya · Partner operations',
        body: 'Everyday Finds submitted its website and newsletter. Both properties passed the initial completeness check.',
        sentAt: at(15, 9, 18),
      },
      {
        senderIdentityKey: 'everyday',
        senderLabel: 'Everyday Finds',
        body: 'Can we browse offers while the application is under review?',
        sentAt: at(15, 9, 27),
      },
      {
        senderIdentityKey: 'operator',
        senderLabel: 'Waverly Operator',
        body: 'Keep the properties together so the publisher receives one approval decision.',
        sentAt: at(15, 9, 34),
      },
      {
        senderIdentityKey: 'partner-operations',
        senderLabel: 'Maya · Partner operations',
        body: 'Done. Both properties are ready for the same review, and the publisher can continue browsing offers while we finish.',
        sentAt: at(15, 10, 42),
      },
    ],
  },
  {
    key: 'northstar-partner-operations',
    subject: 'Northstar Media partnership',
    team: 'Partner operations',
    status: 'online',
    participants: [
      {
        identityKey: 'operator',
        title: 'Northstar Media partnership',
        team: 'Partner operations',
        unreadCount: 0,
      },
      {
        identityKey: 'northstar',
        title: 'Partner operations',
        team: 'Waverly partner operations',
        unreadCount: 0,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'partner-operations',
        senderLabel: 'Maya · Waverly',
        body: 'Northstar Media is current. Four featured offers were added to the eligible marketplace this week.',
        sentAt: at(14, 9, 18),
      },
      {
        senderIdentityKey: 'northstar',
        senderLabel: 'Northstar Media',
        body: 'Flag any offer with a 30-day attribution window for our commerce team.',
        sentAt: at(14, 9, 27),
      },
      {
        senderIdentityKey: 'operator',
        senderLabel: 'Waverly Operator',
        body: 'Done. The matching offers are ready in Discover.',
        sentAt: at(14, 10, 42),
      },
    ],
  },
  {
    key: 'shopify-delay',
    subject: 'Shopify sync delay',
    team: 'Data operations',
    status: 'away',
    participants: [
      {
        identityKey: 'operator',
        title: 'Shopify sync delay',
        team: 'Data operations',
        unreadCount: 1,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'data-operations',
        senderLabel: 'Leon · Data operations',
        body: 'Shopify freshness crossed the 60-minute target. No provider transactions are missing.',
        sentAt: at(14, 9, 21),
      },
      {
        senderIdentityKey: 'operator',
        senderLabel: 'Waverly Operator',
        body: 'Confirm the cursor can resume without replaying imported transactions.',
        sentAt: at(14, 9, 40),
      },
      {
        senderIdentityKey: 'data-operations',
        senderLabel: 'Leon · Data operations',
        body: 'Confirmed. The cursor is healthy; the next sync is queued and provider transaction identity will prevent duplicates.',
        sentAt: at(14, 9, 56),
      },
    ],
  },
  {
    key: 'northstar-finance',
    subject: 'Northstar payout schedule',
    team: 'Finance operations',
    status: 'away',
    participants: [
      {
        identityKey: 'operator',
        title: 'Northstar payout schedule',
        team: 'Finance operations',
        unreadCount: 0,
      },
      {
        identityKey: 'northstar',
        title: 'Finance operations',
        team: 'Waverly finance',
        unreadCount: 0,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'finance-operations',
        senderLabel: 'Nora · Waverly',
        body: 'Your payable balance exceeds the $50 minimum and remains on schedule for the September 1 payout.',
        sentAt: at(13, 14, 16),
      },
    ],
  },
  {
    key: 'everyday-finance',
    subject: 'Everyday Finds payout setup',
    team: 'Finance operations',
    status: 'away',
    participants: [
      {
        identityKey: 'operator',
        title: 'Everyday Finds payout setup',
        team: 'Finance operations',
        unreadCount: 0,
      },
      {
        identityKey: 'everyday',
        title: 'Finance operations',
        team: 'Waverly finance',
        unreadCount: 0,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'finance-operations',
        senderLabel: 'Nora · Waverly',
        body: 'Payout setup will unlock as soon as your organization is approved.',
        sentAt: at(13, 13, 48),
      },
    ],
  },
  {
    key: 'northstar-reporting',
    subject: 'Northstar reporting support',
    team: 'Data operations',
    status: 'online',
    participants: [
      {
        identityKey: 'operator',
        title: 'Northstar reporting support',
        team: 'Data operations',
        unreadCount: 0,
      },
      {
        identityKey: 'northstar',
        title: 'Reporting support',
        team: 'Waverly data operations',
        unreadCount: 0,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'data-operations',
        senderLabel: 'Leon · Waverly',
        body: 'Provider records are normalized before they reach reporting, so every conversion uses the same Waverly states and snapshotted economics.',
        sentAt: at(12, 16, 8),
      },
    ],
  },
  {
    key: 'everyday-reporting',
    subject: 'Everyday Finds reporting access',
    team: 'Data operations',
    status: 'online',
    participants: [
      {
        identityKey: 'operator',
        title: 'Everyday Finds reporting access',
        team: 'Data operations',
        unreadCount: 0,
      },
      {
        identityKey: 'everyday',
        title: 'Reporting support',
        team: 'Waverly data operations',
        unreadCount: 0,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'data-operations',
        senderLabel: 'Leon · Waverly',
        body: 'Reporting will begin as soon as the first approved link starts receiving provider activity.',
        sentAt: at(12, 15, 42),
      },
    ],
  },
  {
    key: 'record-matching',
    subject: 'Three records need matching',
    team: 'Data operations',
    status: 'online',
    participants: [
      {
        identityKey: 'operator',
        title: 'Three records need matching',
        team: 'Data operations',
        unreadCount: 0,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'data-operations',
        senderLabel: 'Leon · Data operations',
        body: 'Three Creator Connections records have valid transaction IDs but no confident Waverly link match.',
        sentAt: at(12, 15, 4),
      },
      {
        senderIdentityKey: 'operator',
        senderLabel: 'Waverly Operator',
        body: 'Route them to the PuroAir destination review queue and preserve the provider payload.',
        sentAt: at(12, 15, 12),
      },
    ],
  },
  {
    key: 'payout-details',
    subject: 'Payout details incomplete',
    team: 'Finance operations',
    status: 'away',
    participants: [
      {
        identityKey: 'operator',
        title: 'Payout details incomplete',
        team: 'Finance operations',
        unreadCount: 0,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'finance-operations',
        senderLabel: 'Nora · Finance operations',
        body: 'One publisher reached the payout threshold but has incomplete bank details.',
        sentAt: at(12, 11, 20),
      },
      {
        senderIdentityKey: 'operator',
        senderLabel: 'Waverly Operator',
        body: 'Hold settlement and leave the ledger balance in payable state.',
        sentAt: at(12, 11, 31),
      },
      {
        senderIdentityKey: 'finance-operations',
        senderLabel: 'Nora · Finance operations',
        body: 'The balance will remain payable until the publisher completes its payout details.',
        sentAt: at(12, 11, 35),
      },
    ],
  },
  {
    key: 'puroair-avery-placement',
    subject: 'PuroAir fall home reset',
    team: 'Avery Lane',
    status: 'online',
    participants: [
      {
        identityKey: 'puroair',
        title: 'Avery Lane · fall home reset',
        team: 'Paid placements',
        unreadCount: 1,
      },
      {
        identityKey: 'avery',
        title: 'PuroAir brand team',
        team: 'Creator partnerships',
        unreadCount: 0,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'puroair',
        senderLabel: 'Mina · PuroAir',
        body: 'Your proposal is approved at $2,400 for one 45–60 second vertical video and three story frames. The agreement is ready and escrow is funded.',
        sentAt: at(15, 8, 12),
      },
      {
        senderIdentityKey: 'avery',
        senderLabel: 'Avery Lane',
        body: 'Accepted. The 130i sample arrived, and I’ll upload the rough cut before noon on September 1.',
        sentAt: at(15, 8, 38),
      },
      {
        senderIdentityKey: 'puroair',
        senderLabel: 'Mina · PuroAir',
        body: 'Great. Keep the opening focused on the room reset; the approved product claims are attached to the brief.',
        sentAt: at(15, 8, 51),
      },
    ],
  },
  {
    key: 'puroair-northstar-partnership',
    subject: 'Northstar Media private commission',
    team: 'Northstar Media',
    status: 'online',
    participants: [
      {
        identityKey: 'puroair',
        title: 'Northstar Media',
        team: 'Creator partnerships',
        unreadCount: 0,
      },
      {
        identityKey: 'northstar',
        title: 'PuroAir brand team',
        team: 'Brand partnership',
        unreadCount: 0,
      },
    ],
    messages: [
      {
        senderIdentityKey: 'puroair',
        senderLabel: 'Mina · PuroAir',
        body: 'We added a 15% private commission for Northstar on the 130i through September 30. Your existing links keep working.',
        sentAt: at(14, 10, 10),
      },
      {
        senderIdentityKey: 'northstar',
        senderLabel: 'Northstar Media',
        body: 'Confirmed. We’ll prioritize the purifier in the fall home newsletter and the evergreen air-quality guide.',
        sentAt: at(14, 10, 36),
      },
    ],
  },
]
