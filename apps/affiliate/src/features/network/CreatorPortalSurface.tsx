import {
  AspectRatio,
  Avatar,
  AvatarStatusDot,
  Banner,
  Button,
  Card,
  Grid,
  Heading,
  HStack,
  Icon,
  List,
  ListItem,
  ProgressBar,
  Section,
  StatusDot,
  Tab,
  TabList,
  Text,
  TextInput,
  Token,
  useMediaQuery,
  VStack,
} from '#/features/network/ui/primitives'
import {
  ArrowRight,
  Banknote,
  BarChart3,
  CalendarClock,
  Check,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  FolderHeart,
  Handshake,
  Image,
  MessageSquareText,
  PackageCheck,
  Send,
  Sparkles,
  Users,
  WalletCards,
} from 'lucide-react'
import { useState, type CSSProperties, type Dispatch, type SetStateAction } from 'react'
import { advertisers, programOffers } from '../../../shared/demoData'

export type CreatorPage =
  | 'Overview'
  | 'Opportunities'
  | 'Projects'
  | 'Portfolio'
  | 'Publishers'
  | 'Performance'
  | 'Earnings'
  | 'Payouts'

type Notice = { status: 'success' | 'info'; title: string; description: string } | null

interface CreatorProject {
  id: string
  publisher: string
  campaign: string
  deliverable: string
  due: string
  value: number
  stage: 'Brief' | 'Creating' | 'Publisher review' | 'Approved'
  progress: number
  offerKey: string
}

interface CreatorOpportunity {
  id: string
  publisher: string
  title: string
  deliverable: string
  due: string
  value: number
  offerKey: string
  fit: number
}

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

const imageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
}

const projectSeeds: CreatorProject[] = [
  {
    id: 'project-puroair',
    publisher: 'Northstar Media',
    campaign: 'PuroAir fall home reset',
    deliverable: '45–60 sec vertical video + 3 story frames',
    due: 'Sep 3',
    value: 2_400,
    stage: 'Creating',
    progress: 58,
    offerKey: 'vera-impact',
  },
  {
    id: 'project-hero',
    publisher: 'Northstar Media',
    campaign: 'Hero Cosmetics back-to-routine',
    deliverable: 'Newsletter feature + product photography',
    due: 'Sep 6',
    value: 1_850,
    stage: 'Publisher review',
    progress: 82,
    offerKey: 'skin-shopify',
  },
  {
    id: 'project-sports',
    publisher: 'Everyday Finds',
    campaign: 'Sports Research morning wellness',
    deliverable: 'Integrated guide + 2 short-form cutdowns',
    due: 'Sep 12',
    value: 1_200,
    stage: 'Brief',
    progress: 18,
    offerKey: 'kitchen-amazon',
  },
  {
    id: 'project-luxe',
    publisher: 'Signal & Story',
    campaign: 'LUXE Bidet small-space living',
    deliverable: 'Dedicated newsletter',
    due: 'Aug 27',
    value: 650,
    stage: 'Approved',
    progress: 100,
    offerKey: 'notes-impact',
  },
]

const opportunitySeeds: CreatorOpportunity[] = [
  {
    id: 'opp-renpho',
    publisher: 'Northstar Media',
    title: 'Recovery routines for people who stand all day',
    deliverable: '1 vertical video · 30-day usage',
    due: 'Apply by Sep 2',
    value: 1_600,
    offerKey: 'games-impact',
    fit: 96,
  },
  {
    id: 'opp-coslus',
    publisher: 'The Useful Edit',
    title: 'A better travel-ready dental routine',
    deliverable: 'Photo set + newsletter inclusion',
    due: 'Apply by Sep 5',
    value: 1_050,
    offerKey: 'arbor-shopify',
    fit: 92,
  },
  {
    id: 'opp-coop',
    publisher: 'Northstar Media',
    title: 'The sleep upgrades that actually stay in rotation',
    deliverable: 'Integrated article + 2 story frames',
    due: 'Apply by Sep 7',
    value: 1_900,
    offerKey: 'solis-impact',
    fit: 89,
  },
  {
    id: 'opp-powerstep',
    publisher: 'Field Tested',
    title: 'Everyday movement without the gear lecture',
    deliverable: '45 sec vertical video',
    due: 'Apply by Sep 9',
    value: 1_250,
    offerKey: 'tide-amazon',
    fit: 85,
  },
]

const creatorPublishers = [
  {
    name: 'Northstar Media',
    relationship: 'Preferred creator',
    contact: 'Jamie · Commerce editor',
    projects: 8,
    earned: 12_480,
    status: 'online' as const,
  },
  {
    name: 'Everyday Finds',
    relationship: 'Active',
    contact: 'Robin · Partnerships',
    projects: 3,
    earned: 3_200,
    status: 'online' as const,
  },
  {
    name: 'Signal & Story',
    relationship: 'Active',
    contact: 'Nia · Features',
    projects: 4,
    earned: 4_850,
    status: 'away' as const,
  },
  {
    name: 'The Useful Edit',
    relationship: 'Invited',
    contact: 'Creator desk',
    projects: 0,
    earned: 0,
    status: 'away' as const,
  },
]

function offerFor(key: string) {
  return programOffers.find((offer) => offer.key === key) ?? programOffers[0]
}

function brandFor(offerKey: string) {
  const offer = offerFor(offerKey)
  return advertisers.find((brand) => brand.key === offer.advertiserKey)
}

function ProductThumb({ offerKey }: { offerKey: string }) {
  const offer = offerFor(offerKey)
  return (
    <VStack width="var(--spacing-12)">
      <AspectRatio ratio={1} fit="contain">
        <img src={offer.productImageUrl} alt={`${offer.offerName} product`} style={imageStyle} />
      </AspectRatio>
    </VStack>
  )
}

function PageIntro({
  icon,
  title,
  description,
  meta,
}: {
  icon: typeof Sparkles
  title: string
  description: string
  meta: string
}) {
  return (
    <Section variant="muted" padding={5}>
      <HStack justify="between" align="center" gap={4} wrap="wrap">
        <HStack gap={3} align="center">
          <Icon icon={icon} color="accent" size="lg" />
          <VStack gap={0.5}>
            <Text weight="semibold">{title}</Text>
            <Text type="supporting" color="secondary">
              {description}
            </Text>
          </VStack>
        </HStack>
        <Text type="supporting" color="secondary">
          {meta}
        </Text>
      </HStack>
    </Section>
  )
}

function CreatorMetricStrip() {
  const metrics = [
    { label: 'Booked', value: '$7,450', detail: '4 active projects' },
    { label: 'Due this week', value: '2', detail: 'Next on Sep 3' },
    { label: 'Awaiting review', value: '1', detail: 'Northstar Media' },
    { label: 'Available', value: '$2,980', detail: 'Payout Sep 1' },
  ]
  return (
    <Grid columns={{ minWidth: 140, max: 4, repeat: 'fit' }} gap={3}>
      {metrics.map((metric) => (
        <Card key={metric.label} padding={4}>
          <VStack gap={1}>
            <Text type="supporting" color="secondary" weight="semibold">
              {metric.label.toUpperCase()}
            </Text>
            <Text type="display-3" weight="semibold" hasTabularNumbers>
              {metric.value}
            </Text>
            <Text type="supporting" color="secondary">
              {metric.detail}
            </Text>
          </VStack>
        </Card>
      ))}
    </Grid>
  )
}

function ProductionRunway({
  projects,
  onNavigate,
}: {
  projects: CreatorProject[]
  onNavigate: (page: string) => void
}) {
  const stages = ['Brief', 'Creating', 'Publisher review', 'Approved'] as const
  return (
    <VStack gap={3}>
      <HStack justify="between" align="end" gap={3} wrap="wrap">
        <VStack gap={0.5}>
          <Heading level={2}>Production runway</Heading>
          <Text color="secondary">
            Every commitment, sequenced by what needs your attention next.
          </Text>
        </VStack>
        <Button
          label="Open all projects"
          icon={<Icon icon={ArrowRight} />}
          variant="ghost"
          size="sm"
          onClick={() => onNavigate('Projects')}
        />
      </HStack>
      <Grid columns={{ minWidth: 210, max: 4, repeat: 'fit' }} gap={3}>
        {stages.map((stage) => {
          const stageProjects = projects.filter((project) => project.stage === stage)
          const lead = stageProjects[0]
          return (
            <Card key={stage} padding={4} variant={stage === 'Creating' ? 'blue' : 'default'}>
              <VStack gap={4} height="100%" justify="between">
                <VStack gap={2}>
                  <HStack justify="between" align="center">
                    <HStack gap={2} align="center">
                      <StatusDot
                        variant={
                          stage === 'Approved'
                            ? 'success'
                            : stage === 'Publisher review'
                              ? 'warning'
                              : 'accent'
                        }
                        label={stage}
                      />
                      <Text weight="semibold">{stage}</Text>
                    </HStack>
                    <Token label={String(stageProjects.length)} size="sm" />
                  </HStack>
                  {lead ? (
                    <VStack gap={1}>
                      <Text type="supporting" color="secondary">
                        {lead.publisher}
                      </Text>
                      <Text weight="semibold">{lead.campaign}</Text>
                      <Text type="supporting" color="secondary">
                        {lead.due} · {money.format(lead.value)}
                      </Text>
                    </VStack>
                  ) : (
                    <Text type="supporting" color="secondary">
                      Nothing waiting here.
                    </Text>
                  )}
                </VStack>
                {lead ? (
                  <ProgressBar
                    label={`${lead.campaign} progress`}
                    value={lead.progress}
                    isLabelHidden
                    hasValueLabel
                    variant={stage === 'Approved' ? 'success' : 'accent'}
                  />
                ) : null}
              </VStack>
            </Card>
          )
        })}
      </Grid>
    </VStack>
  )
}

function CreatorOverview({
  projects,
  onNavigate,
}: {
  projects: CreatorProject[]
  onNavigate: (page: string) => void
}) {
  const isNarrow = useMediaQuery('(max-width: 560px)')
  const openProjectButton = (
    <Button
      label="Open project"
      icon={<Icon icon={ArrowRight} />}
      variant="secondary"
      size="sm"
      width={isNarrow ? '100%' : undefined}
      onClick={() => onNavigate('Projects')}
    />
  )
  return (
    <VStack gap={6}>
      <Banner
        status="warning"
        title="PuroAir rough cut is due in 2 days"
        description="Northstar needs one vertical video and three story frames by Sep 3. The brief is locked; no requirements changed."
        endContent={isNarrow ? undefined : openProjectButton}
        collapsible={false}
      >
        {isNarrow ? openProjectButton : null}
      </Banner>
      <CreatorMetricStrip />
      <ProductionRunway projects={projects} onNavigate={onNavigate} />
      <Grid columns={{ minWidth: 320, max: 2, repeat: 'fit' }} gap={5}>
        <List
          density="balanced"
          hasDividers
          header={
            <VStack gap={0.5}>
              <Heading level={2}>Next deadlines</Heading>
              <Text type="supporting" color="secondary">
                Ordered by the date you need to act
              </Text>
            </VStack>
          }
        >
          {projects
            .filter((project) => project.stage !== 'Approved')
            .map((project) => (
              <ListItem
                key={project.id}
                label={project.campaign}
                description={`${project.publisher} · ${project.deliverable}`}
                startContent={
                  <Icon
                    icon={CalendarClock}
                    color={project.due === 'Sep 3' ? 'orange' : 'secondary'}
                  />
                }
                endContent={
                  <VStack gap={0.5} align="end">
                    <Text weight="semibold">{project.due}</Text>
                    <Text type="supporting" color="secondary">
                      {money.format(project.value)}
                    </Text>
                  </VStack>
                }
                onClick={() => onNavigate('Projects')}
              />
            ))}
        </List>
        <List
          density="balanced"
          hasDividers
          header={
            <VStack gap={0.5}>
              <Heading level={2}>Recommended briefs</Heading>
              <Text type="supporting" color="secondary">
                Publisher demand matched to your portfolio
              </Text>
            </VStack>
          }
        >
          {opportunitySeeds.slice(0, 3).map((opportunity) => (
            <ListItem
              key={opportunity.id}
              label={opportunity.title}
              description={`${opportunity.publisher} · ${money.format(opportunity.value)} · ${opportunity.due}`}
              startContent={<ProductThumb offerKey={opportunity.offerKey} />}
              endContent={<Token label={`${opportunity.fit}% fit`} color="blue" size="sm" />}
              onClick={() => onNavigate('Opportunities')}
            />
          ))}
        </List>
      </Grid>
    </VStack>
  )
}

function OpportunitiesSurface({
  projects,
  onAccept,
}: {
  projects: CreatorProject[]
  onAccept: (opportunity: CreatorOpportunity) => void
}) {
  const [tab, setTab] = useState('recommended')
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState<Notice>(null)
  const normalized = search.trim().toLowerCase()
  const visible = opportunitySeeds.filter((opportunity) => {
    const brand = brandFor(opportunity.offerKey)
    return (
      !normalized ||
      [opportunity.title, opportunity.publisher, brand?.name ?? ''].some((value) =>
        value.toLowerCase().includes(normalized),
      )
    )
  })
  const accept = (id: string, title: string) => {
    const opportunity = opportunitySeeds.find((item) => item.id === id)
    if (opportunity) onAccept(opportunity)
    setNotice({
      status: 'success',
      title: 'Brief accepted',
      description: `${title} is now in Projects with its requirements preserved.`,
    })
  }
  return (
    <VStack gap={5}>
      <PageIntro
        icon={Sparkles}
        title="Publisher opportunities"
        description="Compare the brief, fee, usage rights, timing, and audience fit before committing."
        meta="12 open · 4 strong matches"
      />
      <TabList value={tab} onChange={setTab} size="sm" hasDivider>
        <Tab value="recommended" label="Recommended" icon={<Icon icon={Sparkles} />} />
        <Tab value="invited" label="Invitations" icon={<Icon icon={Handshake} />} />
        <Tab value="saved" label="Saved" icon={<Icon icon={FolderHeart} />} />
      </TabList>
      {notice ? (
        <Banner
          status={notice.status}
          title={notice.title}
          description={notice.description}
          isDismissable
          onDismiss={() => setNotice(null)}
        />
      ) : null}
      <TextInput
        label="Search opportunities"
        isLabelHidden
        placeholder="Search briefs, publishers, or brands…"
        value={search}
        onChange={setSearch}
        hasClear
        width="100%"
      />
      <List
        density="spacious"
        hasDividers
        header={
          <Text weight="semibold">
            {tab === 'recommended'
              ? 'Best matches for Avery'
              : tab === 'invited'
                ? 'Direct publisher invitations'
                : 'Saved for later'}
          </Text>
        }
      >
        {(tab === 'saved'
          ? visible.slice(2, 4)
          : tab === 'invited'
            ? visible.slice(0, 2)
            : visible
        ).map((opportunity) => {
          const brand = brandFor(opportunity.offerKey)
          const isAccepted = projects.some((project) => project.id === `project-${opportunity.id}`)
          return (
            <ListItem
              key={opportunity.id}
              label={opportunity.title}
              description={`${opportunity.publisher} for ${brand?.name ?? 'Brand'} · ${opportunity.deliverable} · ${opportunity.due}`}
              startContent={<ProductThumb offerKey={opportunity.offerKey} />}
              endContent={
                <HStack gap={3} align="center">
                  <VStack gap={0.5} align="end">
                    <Text weight="semibold">{money.format(opportunity.value)}</Text>
                    <Text type="supporting" color="secondary">
                      {opportunity.fit}% portfolio fit
                    </Text>
                  </VStack>
                  <Button
                    label={isAccepted ? 'Accepted' : 'Accept brief'}
                    icon={<Icon icon={isAccepted ? Check : ArrowRight} />}
                    variant={isAccepted ? 'secondary' : 'primary'}
                    size="sm"
                    isDisabled={isAccepted}
                    onClick={() => accept(opportunity.id, opportunity.title)}
                  />
                </HStack>
              }
            />
          )
        })}
      </List>
    </VStack>
  )
}

function ProjectsSurface({
  projects,
  setProjects,
}: {
  projects: CreatorProject[]
  setProjects: Dispatch<SetStateAction<CreatorProject[]>>
}) {
  const [tab, setTab] = useState('active')
  const [notice, setNotice] = useState<Notice>(null)
  const submit = (project: CreatorProject) => {
    setProjects((current) =>
      current.map((item) =>
        item.id === project.id ? { ...item, stage: 'Publisher review', progress: 82 } : item,
      ),
    )
    setNotice({
      status: 'success',
      title: 'Deliverables submitted',
      description: `${project.publisher} can now review ${project.campaign}. The submitted version is preserved.`,
    })
  }
  const visible =
    tab === 'completed'
      ? projects.filter((project) => project.stage === 'Approved')
      : projects.filter((project) => project.stage !== 'Approved')
  return (
    <VStack gap={5}>
      <PageIntro
        icon={FileCheck2}
        title="Project room"
        description="Work from one locked brief, keep versions together, and make publisher feedback actionable."
        meta="3 active · 1 in review"
      />
      <TabList value={tab} onChange={setTab} size="sm" hasDivider>
        <Tab value="active" label="Active" icon={<Icon icon={Clock3} />} />
        <Tab value="completed" label="Completed" icon={<Icon icon={PackageCheck} />} />
      </TabList>
      {notice ? (
        <Banner
          status={notice.status}
          title={notice.title}
          description={notice.description}
          isDismissable
          onDismiss={() => setNotice(null)}
        />
      ) : null}
      <List
        density="spacious"
        hasDividers
        header={
          <Text weight="semibold">{tab === 'active' ? 'Production queue' : 'Approved work'}</Text>
        }
      >
        {visible.map((project) => (
          <ListItem
            key={project.id}
            label={project.campaign}
            description={
              <VStack gap={2}>
                <Text color="secondary">
                  {project.publisher} · {project.deliverable}
                </Text>
                <ProgressBar
                  label={`${project.campaign} completion`}
                  value={project.progress}
                  isLabelHidden
                />
              </VStack>
            }
            startContent={<ProductThumb offerKey={project.offerKey} />}
            endContent={
              <HStack gap={3} align="center">
                <VStack gap={0.5} align="end">
                  <Token
                    label={project.stage}
                    color={
                      project.stage === 'Approved'
                        ? 'green'
                        : project.stage === 'Publisher review'
                          ? 'yellow'
                          : 'blue'
                    }
                    size="sm"
                  />
                  <Text type="supporting" color="secondary">
                    {project.due} · {money.format(project.value)}
                  </Text>
                </VStack>
                {project.stage === 'Creating' ? (
                  <Button
                    label="Submit work"
                    icon={<Icon icon={Send} />}
                    variant="primary"
                    size="sm"
                    onClick={() => submit(project)}
                  />
                ) : (
                  <Button
                    label={project.stage === 'Publisher review' ? 'View feedback' : 'Open brief'}
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setNotice({
                        status: 'info',
                        title:
                          project.stage === 'Publisher review'
                            ? 'Publisher feedback opened'
                            : 'Locked brief opened',
                        description:
                          project.stage === 'Publisher review'
                            ? `${project.publisher} left all feedback on the submitted version for ${project.campaign}.`
                            : `${project.campaign} includes the approved scope, usage rights, fee, and ${project.due} deadline.`,
                      })
                    }
                  />
                )}
              </HStack>
            }
          />
        ))}
      </List>
    </VStack>
  )
}

function PortfolioSurface() {
  return (
    <VStack gap={5}>
      <PageIntro
        icon={Image}
        title="Portfolio"
        description="Show publishers what you make, the audiences you understand, and the formats you can deliver."
        meta="18 published examples · 4 categories"
      />
      <Grid columns={{ minWidth: 260, max: 3, repeat: 'fit' }} gap={4}>
        {projectSeeds.map((project, index) => {
          const offer = offerFor(project.offerKey)
          return (
            <Card key={project.id} padding={0} height="100%">
              <VStack gap={0} height="100%">
                <AspectRatio ratio={4 / 3} fit="contain">
                  <img
                    src={offer.productImageUrl}
                    alt={`${project.campaign} portfolio work`}
                    style={imageStyle}
                  />
                </AspectRatio>
                <VStack gap={2} padding={4}>
                  <Text type="supporting" color="accent" weight="semibold">
                    {project.publisher}
                  </Text>
                  <Heading level={3}>{project.campaign}</Heading>
                  <Text type="supporting" color="secondary">
                    {index % 2 === 0 ? 'Vertical video' : 'Editorial feature'} ·{' '}
                    {8_400 + index * 2_175} views
                  </Text>
                </VStack>
              </VStack>
            </Card>
          )
        })}
      </Grid>
    </VStack>
  )
}

function PublishersSurface({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <VStack gap={5}>
      <PageIntro
        icon={Users}
        title="Publisher relationships"
        description="See who you work with, your shared history, and the person responsible for each partnership."
        meta="3 active · 1 invitation"
      />
      <List
        density="spacious"
        hasDividers
        header={<Text weight="semibold">Your publisher network</Text>}
      >
        {creatorPublishers.map((publisher) => (
          <ListItem
            key={publisher.name}
            label={publisher.name}
            description={`${publisher.contact} · ${publisher.projects} completed projects · ${money.format(publisher.earned)} earned`}
            startContent={
              <Avatar
                name={publisher.name}
                size="lg"
                status={
                  <AvatarStatusDot
                    variant={publisher.status === 'online' ? 'success' : 'neutral'}
                    label={publisher.status === 'online' ? 'Available' : 'Away'}
                  />
                }
              />
            }
            endContent={
              <HStack gap={2} align="center">
                <Token
                  label={publisher.relationship}
                  color={publisher.relationship === 'Invited' ? 'blue' : 'green'}
                  size="sm"
                />
                <Button
                  label="Message"
                  icon={<Icon icon={MessageSquareText} />}
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate('Messages')}
                />
              </HStack>
            }
          />
        ))}
      </List>
    </VStack>
  )
}

function PerformanceSurface() {
  const rows = [
    ['PuroAir fall home reset', 'Northstar Media', '38.4K', '4.8%', '$3,140'],
    ['Hero Cosmetics back-to-routine', 'Northstar Media', '29.1K', '5.6%', '$2,870'],
    ['LUXE Bidet small-space living', 'Signal & Story', '18.7K', '3.9%', '$1,460'],
    ['Sports Research morning wellness', 'Everyday Finds', '16.2K', '4.3%', '$1,280'],
  ]
  return (
    <VStack gap={5}>
      <PageIntro
        icon={BarChart3}
        title="Creator performance"
        description="Connect content reach to publisher outcomes without exposing provider-level attribution complexity."
        meta="Last 90 days · USD"
      />
      <CreatorMetricStrip />
      <List
        density="balanced"
        hasDividers
        header={<Text weight="semibold">Performance by collaboration</Text>}
      >
        {rows.map(([campaign, publisher, views, engagement, revenue]) => (
          <ListItem
            key={campaign}
            label={campaign}
            description={`${publisher} · ${views} views · ${engagement} engagement`}
            startContent={<Icon icon={BarChart3} color="accent" />}
            endContent={
              <VStack gap={0.5} align="end">
                <Text weight="semibold">{revenue}</Text>
                <Text type="supporting" color="secondary">
                  Attributed sales
                </Text>
              </VStack>
            }
          />
        ))}
      </List>
    </VStack>
  )
}

function EarningsSurface() {
  const rows = [
    ['PuroAir fall home reset', 'Northstar Media', 'Milestone 1', '$1,200', 'Scheduled'],
    ['Hero Cosmetics back-to-routine', 'Northstar Media', 'Final approval', '$1,850', 'In review'],
    ['Sports Research morning wellness', 'Everyday Finds', 'Project fee', '$1,200', 'Booked'],
    ['LUXE Bidet small-space living', 'Signal & Story', 'Project fee', '$650', 'Available'],
  ]
  return (
    <VStack gap={5}>
      <PageIntro
        icon={CircleDollarSign}
        title="Earnings"
        description="Track fixed project fees, approval gates, and affiliate upside without mixing their accounting."
        meta="$7,450 booked · $2,980 available"
      />
      <List density="balanced" hasDividers header={<Text weight="semibold">Earning events</Text>}>
        {rows.map(([campaign, publisher, milestone, value, state]) => (
          <ListItem
            key={`${campaign}-${milestone}`}
            label={campaign}
            description={`${publisher} · ${milestone}`}
            startContent={<Icon icon={Banknote} color="accent" />}
            endContent={
              <HStack gap={3} align="center">
                <Text weight="semibold">{value}</Text>
                <Token
                  label={state}
                  color={
                    state === 'Available' ? 'green' : state === 'In review' ? 'yellow' : 'blue'
                  }
                  size="sm"
                />
              </HStack>
            }
          />
        ))}
      </List>
    </VStack>
  )
}

function PayoutsSurface() {
  const [notice, setNotice] = useState<Notice>(null)
  return (
    <VStack gap={5}>
      <PageIntro
        icon={WalletCards}
        title="Payouts"
        description="See exactly which approved creator earnings are included in each settlement."
        meta="Next payout Sep 1"
      />
      {notice ? (
        <Banner
          status={notice.status}
          title={notice.title}
          description={notice.description}
          isDismissable
          onDismiss={() => setNotice(null)}
        />
      ) : null}
      <Banner
        status="success"
        title="$2,980 is scheduled for Sep 1"
        description="Bank account ending in 2048 · No payout minimum · Two approved publisher payments included."
        endContent={
          <Button
            label="Review details"
            variant="secondary"
            size="sm"
            onClick={() =>
              setNotice({
                status: 'info',
                title: 'Payout details ready',
                description:
                  'Northstar Media contributes $2,330 and Signal & Story contributes $650 to this settlement.',
              })
            }
          />
        }
      />
      <List
        density="balanced"
        hasDividers
        header={<Text weight="semibold">Settlement history</Text>}
      >
        {[
          ['Sep 1, 2026', '$2,980', 'Scheduled', '2 publishers'],
          ['Aug 1, 2026', '$4,320', 'Paid', '3 publishers'],
          ['Jul 1, 2026', '$3,650', 'Paid', '2 publishers'],
        ].map(([date, amount, state, scope]) => (
          <ListItem
            key={date}
            label={date}
            description={`${scope} · ACH ending in 2048`}
            startContent={<Icon icon={WalletCards} color="accent" />}
            endContent={
              <HStack gap={3} align="center">
                <Text weight="semibold">{amount}</Text>
                <Token label={state} color="green" size="sm" />
              </HStack>
            }
          />
        ))}
      </List>
    </VStack>
  )
}

export function CreatorPortalSurface({
  page,
  onNavigate,
}: {
  page: CreatorPage
  onNavigate: (page: string) => void
}) {
  const [projects, setProjects] = useState(projectSeeds)
  const acceptOpportunity = (opportunity: CreatorOpportunity) => {
    setProjects((current) => {
      const id = `project-${opportunity.id}`
      if (current.some((project) => project.id === id)) return current
      return [
        ...current,
        {
          id,
          publisher: opportunity.publisher,
          campaign: opportunity.title,
          deliverable: opportunity.deliverable,
          due: opportunity.due.replace('Apply by ', ''),
          value: opportunity.value,
          stage: 'Brief',
          progress: 8,
          offerKey: opportunity.offerKey,
        },
      ]
    })
  }
  const renderContent = () => {
    if (page === 'Overview') return <CreatorOverview projects={projects} onNavigate={onNavigate} />
    if (page === 'Opportunities')
      return <OpportunitiesSurface projects={projects} onAccept={acceptOpportunity} />
    if (page === 'Projects')
      return <ProjectsSurface projects={projects} setProjects={setProjects} />
    if (page === 'Portfolio') return <PortfolioSurface />
    if (page === 'Publishers') return <PublishersSurface onNavigate={onNavigate} />
    if (page === 'Performance') return <PerformanceSurface />
    if (page === 'Earnings') return <EarningsSurface />
    return <PayoutsSurface />
  }
  return <VStack gap={0}>{renderContent()}</VStack>
}
