import {
  Banner,
  Button,
  Card,
  Divider,
  Grid,
  HStack,
  Heading,
  Icon,
  Layout,
  LayoutContent,
  LayoutPanel,
  List,
  ListItem,
  Selector,
  Switch,
  Text,
  TextInput,
  Token,
  VStack,
  useMediaQuery,
  type IconType,
} from '#/features/network/ui/primitives'
import { ArrowLeft, Bell, Building2, HandCoins, Link2, PlugZap } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import type { NetworkIdentity, SettingsCategory } from './types'
export const settingsCategoryIcons: Record<SettingsCategory['id'], IconType> = {
  workspace: Building2,
  notifications: Bell,
  integrations: PlugZap,
  payouts: HandCoins,
}

export function SettingsSurface({ identity }: { identity: NetworkIdentity }) {
  const isNarrow = useMediaQuery('(max-width: 900px)')
  const [mobileView, setMobileView] = useState<'nav' | 'detail'>('nav')
  const [activeCategory, setActiveCategory] = useState<SettingsCategory['id']>('workspace')
  const [workspaceName, setWorkspaceName] = useState(
    identity === 'operator'
      ? 'Waverly Network'
      : identity === 'everyday'
        ? 'Everyday Finds'
        : identity === 'avery'
          ? 'Avery Lane Studio'
          : identity === 'puroair'
            ? 'PuroAir'
            : 'Northstar Media',
  )
  const [contactEmail, setContactEmail] = useState(
    identity === 'operator'
      ? 'operations@waverly.example'
      : identity === 'avery'
        ? 'hello@averylane.example'
        : identity === 'puroair'
          ? 'creators@puroair.example'
          : `finance@${identity === 'everyday' ? 'everyday-finds' : 'northstar'}.example`,
  )
  const [timezone, setTimezone] = useState('Pacific')
  const [operationalAlerts, setOperationalAlerts] = useState(true)
  const [payoutAlerts, setPayoutAlerts] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(identity !== 'everyday')
  const [autoImport, setAutoImport] = useState(true)
  const [reviewMatches, setReviewMatches] = useState(true)
  const [payoutSchedule, setPayoutSchedule] = useState('Monthly')
  const [payoutMinimum, setPayoutMinimum] = useState('$50')

  const categories: SettingsCategory[] = [
    {
      id: 'workspace',
      label:
        identity === 'operator'
          ? 'Network profile'
          : identity === 'avery'
            ? 'Creator profile'
            : identity === 'puroair'
              ? 'Brand profile'
              : 'Organization profile',
      description: 'Workspace identity and reporting defaults',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'Operational and financial updates',
    },
    {
      id: 'integrations',
      label:
        identity === 'operator'
          ? 'Provider sync'
          : identity === 'avery'
            ? 'Connected accounts'
            : identity === 'puroair'
              ? 'Commerce channels'
              : 'Data connections',
      description:
        identity === 'operator'
          ? 'Import and matching behavior'
          : identity === 'avery'
            ? 'Portfolio and social connections'
            : identity === 'puroair'
              ? 'Amazon and Shopify connections'
              : 'Connected reporting sources',
    },
    {
      id: 'payouts',
      label: identity === 'puroair' ? 'Billing preferences' : 'Payout preferences',
      description:
        identity === 'puroair' ? 'Invoices and payment method' : 'Settlement timing and thresholds',
    },
  ]

  const active = categories.find((category) => category.id === activeCategory) ?? categories[0]
  const selectCategory = (category: SettingsCategory['id']) => {
    setActiveCategory(category)
    setMobileView('detail')
  }

  const categoryList = (
    <VStack gap={4} className="waverly-side-panel">
      <VStack gap={0.5}>
        <Heading level={2}>Workspace settings</Heading>
        <Text color="secondary">Configure this organization without leaving Waverly.</Text>
      </VStack>
      <List density="spacious" hasDividers>
        {categories.map((category) => (
          <ListItem
            key={category.id}
            label={category.label}
            description={category.description}
            startContent={
              <Icon
                icon={settingsCategoryIcons[category.id]}
                color={!isNarrow && activeCategory === category.id ? 'accent' : 'secondary'}
              />
            }
            isSelected={!isNarrow && activeCategory === category.id}
            onClick={() => selectCategory(category.id)}
            endContent={
              category.id === 'integrations' && identity === 'operator' ? (
                <Token label="3 connected" size="sm" />
              ) : undefined
            }
          />
        ))}
      </List>
      <Banner
        status="info"
        title="Workspace preferences"
        description="Changes stay in this browser session and do not alter provider records."
      />
    </VStack>
  )

  const detail = (
    <VStack gap={5} maxWidth={760} className="waverly-settings">
      <div className="waverly-settings-intro">
        <HStack gap={2} align="center">
          {isNarrow ? (
            <Button
              label="Back to settings"
              icon={<Icon icon={ArrowLeft} />}
              variant="ghost"
              size="sm"
              onClick={() => setMobileView('nav')}
            />
          ) : null}
          <VStack gap={0.5}>
            <Heading level={2}>{active.label}</Heading>
            <Text color="secondary">{active.description}</Text>
          </VStack>
        </HStack>
        <Token label="Saved locally" size="sm" color="green" />
      </div>

      {activeCategory === 'workspace' ? (
        <SettingsSection
          title="Workspace identity"
          description="Used in reporting, messages, and payout records."
        >
          <Grid columns={{ minWidth: 280, max: 2, repeat: 'fit' }} gap={4}>
            <TextInput
              label="Workspace name"
              value={workspaceName}
              onChange={setWorkspaceName}
              width="100%"
            />
            <TextInput
              label="Finance contact"
              type="email"
              value={contactEmail}
              onChange={setContactEmail}
              width="100%"
            />
            <Selector
              label="Reporting timezone"
              options={['Pacific', 'Mountain', 'Central', 'Eastern', 'UTC']}
              value={timezone}
              onChange={setTimezone}
              width="100%"
            />
            <TextInput
              label="Settlement currency"
              value="USD"
              onChange={() => {}}
              isReadOnly
              width="100%"
            />
          </Grid>
        </SettingsSection>
      ) : null}

      {activeCategory === 'notifications' ? (
        <SettingsSection
          title="Delivery rules"
          description="These switches take effect immediately for the current workspace."
        >
          <Switch
            label="Operational alerts"
            description="Provider delays, review queues, and matching exceptions"
            value={operationalAlerts}
            onChange={setOperationalAlerts}
            labelPosition="start"
            labelSpacing="spread"
            width="100%"
          />
          <Divider />
          <Switch
            label="Payout notices"
            description="Payable balance changes and settlement status"
            value={payoutAlerts}
            onChange={setPayoutAlerts}
            labelPosition="start"
            labelSpacing="spread"
            width="100%"
          />
          <Divider />
          <Switch
            label="Weekly performance summary"
            description="A Monday digest of traffic, conversions, and earnings"
            value={weeklySummary}
            onChange={setWeeklySummary}
            labelPosition="start"
            labelSpacing="spread"
            width="100%"
          />
        </SettingsSection>
      ) : null}

      {activeCategory === 'integrations' ? (
        <Card padding={5}>
          <VStack gap={5}>
            <Banner
              status={identity === 'operator' || identity === 'puroair' ? 'success' : 'info'}
              title={
                identity === 'operator'
                  ? 'Three provider accounts connected'
                  : identity === 'avery'
                    ? 'Creator accounts are ready to connect'
                    : identity === 'puroair'
                      ? 'Three commerce channels connected'
                      : 'Reporting connections are managed by Waverly'
              }
              description={
                identity === 'operator'
                  ? 'Amazon Attribution, Creator Connections, and Shopify are supplying development records.'
                  : identity === 'avery'
                    ? 'Connect portfolio and social accounts when this POC moves beyond simulated creator data.'
                    : identity === 'puroair'
                      ? 'Amazon US, Amazon CA, and Shopify provide catalog, fulfillment, and attribution context for PuroAir.'
                      : 'Provider-specific credentials stay hidden from publisher workspaces.'
              }
            />
            {identity === 'avery' ? (
              <List density="spacious" hasDividers>
                {[
                  ['Instagram', 'Audience and portfolio highlights', 'Connect'],
                  ['TikTok', 'Video reach and engagement', 'Connect'],
                  ['YouTube', 'Long-form work and audience signals', 'Connect'],
                ].map(([account, description, action]) => (
                  <ListItem
                    key={account}
                    label={account}
                    description={description}
                    startContent={<Icon icon={Link2} color="secondary" />}
                    endContent={<Button label={action} variant="secondary" size="sm" />}
                  />
                ))}
              </List>
            ) : identity === 'puroair' ? (
              <List density="spacious" hasDividers>
                {[
                  ['Amazon US', 'Catalog, attribution, and multi-channel fulfillment', 'Connected'],
                  ['Amazon CA', 'Canada catalog and attribution', 'Connected'],
                  ['Shopify', 'Direct catalog, fulfillment, and conversion reporting', 'Connected'],
                ].map(([account, description, state]) => (
                  <ListItem
                    key={account}
                    label={account}
                    description={description}
                    startContent={<Icon icon={PlugZap} color="accent" />}
                    endContent={<Token label={state} color="green" size="sm" />}
                  />
                ))}
              </List>
            ) : (
              <>
                <Switch
                  label="Automatic provider imports"
                  description="Normalize new provider records as each sync completes"
                  value={autoImport}
                  onChange={setAutoImport}
                  labelPosition="start"
                  labelSpacing="spread"
                  width="100%"
                  isDisabled={identity !== 'operator'}
                  disabledMessage="Only Waverly operators can change provider imports."
                />
                <Divider />
                <Switch
                  label="Review uncertain matches"
                  description="Route records without a confident link match to Messages"
                  value={reviewMatches}
                  onChange={setReviewMatches}
                  labelPosition="start"
                  labelSpacing="spread"
                  width="100%"
                  isDisabled={identity !== 'operator'}
                  disabledMessage="Only Waverly operators can change matching policy."
                />
                <Divider />
                <Selector
                  label="Freshness warning"
                  description="Create an alert when a provider exceeds this delay"
                  options={['30 minutes', '60 minutes', '90 minutes', '2 hours']}
                  value="60 minutes"
                  onChange={() => {}}
                  width="100%"
                  isDisabled={identity !== 'operator'}
                  disabledMessage="Only Waverly operators can change provider thresholds."
                />
              </>
            )}
          </VStack>
        </Card>
      ) : null}

      {activeCategory === 'payouts' ? (
        <SettingsSection
          title={identity === 'puroair' ? 'Invoice policy' : 'Settlement policy'}
          description={
            identity === 'puroair'
              ? 'Creator commissions and paid placements roll into one monthly Waverly invoice.'
              : 'The ledger remains the source of truth; these preferences only control payout scheduling.'
          }
        >
          {identity === 'puroair' ? (
            <>
              <Grid columns={{ minWidth: 280, max: 2, repeat: 'fit' }} gap={4}>
                <Selector
                  label="Billing cycle"
                  options={['Monthly']}
                  value="Monthly"
                  onChange={() => {}}
                  width="100%"
                />
                <Selector
                  label="Payment method"
                  options={['Stripe ending 4242', 'ACH ending 0931']}
                  value="Stripe ending 4242"
                  onChange={() => {}}
                  width="100%"
                />
              </Grid>
              <Banner
                status="info"
                title="One invoice, one payment"
                description="The platform fee, creator commissions, and approved placement fees are consolidated on the fifth of each month."
              />
            </>
          ) : (
            <>
              <Grid columns={{ minWidth: 280, max: 2, repeat: 'fit' }} gap={4}>
                <Selector
                  label="Payout schedule"
                  options={['Monthly', 'Twice monthly', 'Quarterly']}
                  value={payoutSchedule}
                  onChange={setPayoutSchedule}
                  width="100%"
                />
                <Selector
                  label="Minimum payable balance"
                  options={['$25', '$50', '$100', '$250']}
                  value={payoutMinimum}
                  onChange={setPayoutMinimum}
                  width="100%"
                />
              </Grid>
              <Banner
                status="info"
                title={`Next payout uses a ${payoutMinimum} minimum`}
                description={`Eligible ${payoutSchedule.toLowerCase()} balances continue accruing until the threshold is met.`}
              />
            </>
          )}
        </SettingsSection>
      ) : null}
    </VStack>
  )

  if (isNarrow) {
    return mobileView === 'nav' ? categoryList : <div className="waverly-side-detail">{detail}</div>
  }

  return (
    <Layout
      height="fill"
      start={
        <LayoutPanel width={300} padding={0} hasDivider label="Settings categories">
          {categoryList}
        </LayoutPanel>
      }
      content={
        <LayoutContent>
          <div className="waverly-side-detail">{detail}</div>
        </LayoutContent>
      }
    />
  )
}

/** A settings group: white card with a titled header and a padded body. */
function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Card padding={0}>
      <div className="waverly-settings-section-header">
        <Heading level={3}>{title}</Heading>
        <Text color="secondary">{description}</Text>
      </div>
      <VStack gap={5} padding={5}>
        {children}
      </VStack>
    </Card>
  )
}
