import { Thumbnail } from '@waverly/design-system/ui/thumbnail'
import {
  AspectRatio,
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
  VStack,
} from '#/features/network/ui/primitives'
import {
  BadgePercent,
  BellRing,
  BookImage,
  Box,
  Check,
  CircleDollarSign,
  Clipboard,
  FileText,
  FolderOpen,
  Gift,
  Handshake,
  Link2,
  Megaphone,
  ReceiptText,
  Send,
  ShoppingBag,
  Store,
  TicketPercent,
} from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'
import { advertisers, links, programOffers } from '../../../shared/demoData'

type WorkspacePage = 'Partnerships' | 'Placements' | 'Tracking' | 'Storefront'
type Notice = { status: 'success' | 'info'; title: string; description: string } | null

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

function offerBrand(offer: (typeof programOffers)[number]) {
  return advertisers.find((advertiser) => advertiser.key === offer.advertiserKey)
}

function ProductThumb({ src, name }: { src: string; name: string }) {
  return <Thumbnail src={src} alt={name} size="lg" />
}

function BrandThumb({ src, name }: { src: string; name: string }) {
  return <Thumbnail src={src} alt={name} fit="cover" />
}

function WorkspaceIntro({
  icon,
  title,
  description,
  meta,
}: {
  icon: typeof Handshake
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

function PartnershipsSurface() {
  const [tab, setTab] = useState('brands')
  const [notice, setNotice] = useState<Notice>(null)
  const [search, setSearch] = useState('')
  const normalized = search.trim().toLowerCase()
  const visibleOffers = programOffers.filter((offer) => {
    const brand = offerBrand(offer)
    return (
      !normalized ||
      [offer.offerName, brand?.name ?? '', brand?.category ?? ''].some((value) =>
        value.toLowerCase().includes(normalized),
      )
    )
  })

  const action = (title: string, description: string) => {
    setNotice({ status: 'success', title, description })
  }

  let content
  if (tab === 'brands') {
    content = (
      <List
        density="balanced"
        hasDividers
        header={<Text weight="semibold">Active brand partnerships</Text>}
      >
        {advertisers.slice(0, 14).map((brand, index) => (
          <ListItem
            key={brand.key}
            label={brand.name}
            description={`${brand.category} · ${programOffers.filter((offer) => offer.advertiserKey === brand.key).length} product opportunities · ${index % 4 === 0 ? 'New announcement' : 'Terms current'}`}
            startContent={<BrandThumb src={brand.logoUrl} name={brand.name} />}
            endContent={
              <Token
                label={index % 5 === 0 ? 'Eligible' : 'Partnered'}
                color={index % 5 === 0 ? 'blue' : 'green'}
                size="sm"
              />
            }
          />
        ))}
      </List>
    )
  } else if (tab === 'products') {
    content = (
      <List
        density="balanced"
        hasDividers
        header={<Text weight="semibold">Products in your partnerships</Text>}
      >
        {visibleOffers.slice(0, 16).map((offer) => {
          const brand = offerBrand(offer)
          return (
            <ListItem
              key={offer.key}
              label={offer.offerName}
              description={`${brand?.name ?? 'Brand'} · ${offer.marketplace} ${offer.countryCode} · ${(offer.commissionRateBps / 100).toFixed(0)}% commission · ${offer.attributionWindowDays}-day attribution`}
              startContent={<ProductThumb src={offer.productImageUrl} name={offer.offerName} />}
              endContent={
                <Button
                  label="Create link"
                  icon={<Icon icon={Link2} />}
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    action(
                      'Link draft created',
                      `${offer.offerName} is ready in the Tracking workspace.`,
                    )
                  }
                />
              }
            />
          )
        })}
      </List>
    )
  } else if (tab === 'announcements') {
    content = (
      <List
        density="spacious"
        hasDividers
        header={<Text weight="semibold">Brand announcements</Text>}
      >
        {[
          [
            'PuroAir holiday rates are live',
            'Commission increases to 45% for selected purifier bundles through Sep 13.',
            'Today',
          ],
          [
            'Hero Cosmetics added fall creative',
            'Six new product images and messaging notes are available for Mighty Patch.',
            'Yesterday',
          ],
          [
            'Sports Research sample window',
            'Applications are open for the D3 + K2 fall wellness campaign.',
            'Aug 27',
          ],
          [
            'LUXE Bidet updated attribution',
            'Eligible products now use a 30-day attribution window.',
            'Aug 25',
          ],
        ].map(([title, description, date]) => (
          <ListItem
            key={title}
            label={title}
            description={description}
            startContent={<Icon icon={BellRing} color="accent" />}
            endContent={
              <Text type="supporting" color="secondary">
                {date}
              </Text>
            }
          />
        ))}
      </List>
    )
  } else if (tab === 'samples') {
    const sampleOffers = visibleOffers.filter((offer) => offer.samplesAvailable)
    content = (
      <List
        density="balanced"
        hasDividers
        header={<Text weight="semibold">Products available to sample</Text>}
      >
        {sampleOffers.map((offer) => (
          <ListItem
            key={offer.key}
            label={offer.offerName}
            description={`${offerBrand(offer)?.name ?? 'Brand'} · Ships in 3–5 days · Content requested within 30 days`}
            startContent={<ProductThumb src={offer.productImageUrl} name={offer.offerName} />}
            endContent={
              <Button
                label="Request sample"
                icon={<Icon icon={Gift} />}
                variant="primary"
                size="sm"
                onClick={() =>
                  action(
                    'Sample request saved',
                    `A demo request for ${offer.offerName} was added locally.`,
                  )
                }
              />
            }
          />
        ))}
      </List>
    )
  } else if (tab === 'campaigns') {
    content = (
      <List
        density="balanced"
        hasDividers
        header={<Text weight="semibold">Creator campaigns</Text>}
      >
        {programOffers
          .filter((offer) => offer.cpcCents >= 40)
          .slice(0, 10)
          .map((offer, index) => (
            <ListItem
              key={offer.key}
              label={`${offerBrand(offer)?.name ?? 'Brand'} · ${offer.offerName}`}
              description={`$${(offer.cpcCents / 100).toFixed(2)} EPC · ${(4_800 + index * 1_375).toLocaleString()} clicks remaining · Ends Sep ${8 + index}`}
              startContent={<Icon icon={CircleDollarSign} color="accent" />}
              endContent={
                <Button
                  label="Join campaign"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    action(
                      'Campaign joined locally',
                      `${offerBrand(offer)?.name ?? 'Brand'} is now included in My CPC.`,
                    )
                  }
                />
              }
            />
          ))}
      </List>
    )
  } else {
    content = (
      <List density="spacious" hasDividers header={<Text weight="semibold">Loyalty progress</Text>}>
        {programOffers.slice(0, 10).map((offer, index) => {
          const progress = 42 + ((index * 13) % 57)
          return (
            <ListItem
              key={offer.key}
              label={offerBrand(offer)?.name ?? 'Brand'}
              description={
                <ProgressBar
                  label={`Progress for ${offer.offerName}`}
                  value={progress}
                  max={100}
                  hasValueLabel
                  formatValueLabel={() =>
                    `${progress}% · ${money.format(offer.loyaltyBonusCents / 100)} next bonus`
                  }
                />
              }
              startContent={<Icon icon={BadgePercent} color="accent" />}
              endContent={
                <Token
                  label={progress >= 90 ? 'Nearly unlocked' : 'Active'}
                  color={progress >= 90 ? 'green' : 'blue'}
                  size="sm"
                />
              }
            />
          )
        })}
      </List>
    )
  }

  return (
    <VStack gap={5}>
      <WorkspaceIntro
        icon={Handshake}
        title="Partnership center"
        description="Manage brands, product access, campaigns, samples, and bonuses together."
        meta="18 active · 2 awaiting review"
      />
      <TabList value={tab} onChange={setTab} size="sm" hasDivider overflow="scroll">
        <Tab value="brands" label="Brands" icon={<Icon icon={Handshake} />} />
        <Tab value="products" label="My products" icon={<Icon icon={ShoppingBag} />} />
        <Tab value="announcements" label="Announcements" icon={<Icon icon={Megaphone} />} />
        <Tab value="samples" label="Samples" icon={<Icon icon={Gift} />} />
        <Tab value="campaigns" label="Campaigns" icon={<Icon icon={CircleDollarSign} />} />
        <Tab value="loyalty" label="Loyalty" icon={<Icon icon={BadgePercent} />} />
      </TabList>
      {notice ? (
        <Banner
          status={notice.status}
          title={notice.title}
          description={notice.description}
          endContent={
            <Button label="Dismiss" variant="ghost" size="sm" onClick={() => setNotice(null)} />
          }
        />
      ) : null}
      {tab === 'products' || tab === 'samples' ? (
        <TextInput
          label="Search products"
          isLabelHidden
          placeholder="Search products or brands…"
          value={search}
          onChange={setSearch}
          hasClear
          width="100%"
        />
      ) : null}
      {content}
    </VStack>
  )
}

function PlacementsSurface() {
  const [tab, setTab] = useState('active')
  const [notice, setNotice] = useState<Notice>(null)
  const [rates, setRates] = useState([350, 650, 1_200, 2_400])
  const rateItems = [
    'Newsletter feature',
    'Dedicated social video',
    'Homepage placement',
    'Integrated campaign',
  ]

  return (
    <VStack gap={5}>
      <WorkspaceIntro
        icon={ReceiptText}
        title="Paid placements"
        description="Keep proposals, deliverables, and commissionable links in one contract record."
        meta="$8,450 booked · 3 active"
      />
      <TabList value={tab} onChange={setTab} size="sm" hasDivider>
        <Tab value="active" label="Active" icon={<Icon icon={FileText} />} />
        <Tab value="paid" label="Paid" icon={<Icon icon={Check} />} />
        <Tab value="archived" label="Archived" icon={<Icon icon={Box} />} />
        <Tab value="rate-card" label="Rate card" icon={<Icon icon={ReceiptText} />} />
      </TabList>
      {notice ? (
        <Banner
          status={notice.status}
          title={notice.title}
          description={notice.description}
          endContent={
            <Button label="Dismiss" variant="ghost" size="sm" onClick={() => setNotice(null)} />
          }
        />
      ) : null}
      {tab === 'rate-card' ? (
        <VStack gap={4}>
          <Banner
            status="info"
            title="Your rate card is visible to eligible brands"
            description="Every placement supports commissionable Waverly links in addition to the fixed fee."
          />
          <List
            density="balanced"
            hasDividers
            header={<Text weight="semibold">Placement menu</Text>}
          >
            {rateItems.map((item, index) => (
              <ListItem
                key={item}
                label={item}
                description={
                  index % 2 === 0
                    ? 'Includes one revision · 14-day delivery'
                    : 'Includes usage rights for 30 days'
                }
                startContent={<Icon icon={TicketPercent} color="accent" />}
                endContent={
                  <HStack gap={2} align="center">
                    <Text weight="semibold">{money.format(rates[index])}</Text>
                    <Button
                      label="Raise $50"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setRates((current) =>
                          current.map((rate, rateIndex) =>
                            rateIndex === index ? rate + 50 : rate,
                          ),
                        )
                      }
                    />
                  </HStack>
                }
              />
            ))}
          </List>
          <HStack justify="end">
            <Button
              label="Publish rate card"
              icon={<Icon icon={Send} />}
              variant="primary"
              onClick={() =>
                setNotice({
                  status: 'success',
                  title: 'Rate card published',
                  description: 'The updated demo rates are now visible in this session.',
                })
              }
            />
          </HStack>
        </VStack>
      ) : (
        <List
          density="spacious"
          hasDividers
          header={
            <Text weight="semibold">
              {tab === 'active'
                ? 'Contracts in progress'
                : tab === 'paid'
                  ? 'Completed and paid'
                  : 'Archived proposals'}
            </Text>
          }
        >
          {[
            ['PuroAir holiday home refresh', '2 deliverables · Sep 3–17', '$2,400', 'Creative due'],
            [
              'Hero Cosmetics back-to-routine',
              'Newsletter + short video · Sep 8',
              '$1,850',
              'In review',
            ],
            ['Sports Research wellness guide', 'Integrated article · Sep 14', '$1,200', 'Accepted'],
            ['LUXE Bidet small-space living', 'Dedicated newsletter · Sep 21', '$650', 'Proposed'],
          ]
            .slice(0, tab === 'archived' ? 2 : 4)
            .map(([name, detail, value, status], index) => (
              <ListItem
                key={`${tab}-${name}`}
                label={name}
                description={`${detail} · ${value}`}
                startContent={
                  <StatusDot
                    variant={index === 0 && tab === 'active' ? 'warning' : 'success'}
                    label={status}
                  />
                }
                endContent={
                  <Token
                    label={tab === 'paid' ? 'Paid' : tab === 'archived' ? 'Archived' : status}
                    color={tab === 'paid' ? 'green' : 'blue'}
                    size="sm"
                  />
                }
              />
            ))}
        </List>
      )}
    </VStack>
  )
}

function TrackingSurface() {
  const [tab, setTab] = useState('products')
  const [notice, setNotice] = useState<Notice>(null)
  const rows = useMemo(
    () =>
      links.slice(0, 18).map((link, index) => ({
        ...link,
        offer: programOffers.find((offer) => offer.key === link.offerKey) ?? programOffers[0],
        clicks: 430 + index * 137,
        state: index % 7 === 0 ? 'Archived' : 'Active',
      })),
    [],
  )

  const copy = async (label: string, value: string) => {
    await navigator.clipboard?.writeText(value)
    setNotice({ status: 'success', title: `${label} copied`, description: value })
  }

  const visible =
    tab === 'archived'
      ? rows.filter((row) => row.state === 'Archived')
      : rows.filter((row) => row.state === 'Active')

  return (
    <VStack gap={5}>
      <WorkspaceIntro
        icon={Link2}
        title="Tracking workspace"
        description="Create, organize, and measure durable links and discount codes."
        meta="100 links · 60,359 clicks"
      />
      <TabList value={tab} onChange={setTab} size="sm" hasDivider>
        <Tab value="products" label="Product links" icon={<Icon icon={ShoppingBag} />} />
        <Tab value="storefront" label="Storefront links" icon={<Icon icon={Store} />} />
        <Tab value="archived" label="Archived" icon={<Icon icon={Box} />} />
        <Tab value="codes" label="Discount codes" icon={<Icon icon={TicketPercent} />} />
      </TabList>
      {notice ? (
        <Banner
          status={notice.status}
          title={notice.title}
          description={notice.description}
          endContent={
            <Button label="Dismiss" variant="ghost" size="sm" onClick={() => setNotice(null)} />
          }
        />
      ) : null}
      {tab === 'codes' ? (
        <List
          density="balanced"
          hasDividers
          header={<Text weight="semibold">Active discount codes</Text>}
        >
          {[
            ['TRUSKIN20', 'TruSkin', '20% off', 'Sep 30'],
            ['PUROHOME', 'PuroAir', '15% off', 'Oct 12'],
            ['HERO15', 'Hero Cosmetics', '15% off', 'Sep 21'],
            ['LUXE10', 'LUXE Bidet', '10% off', 'No end date'],
          ].map(([code, brand, offer, end]) => (
            <ListItem
              key={code}
              label={code}
              description={`${brand} · ${offer} · Ends ${end}`}
              startContent={<Icon icon={TicketPercent} color="accent" />}
              endContent={
                <Button
                  label="Copy code"
                  icon={<Icon icon={Clipboard} />}
                  variant="secondary"
                  size="sm"
                  onClick={() => copy('Discount code', code)}
                />
              }
            />
          ))}
        </List>
      ) : tab === 'storefront' ? (
        <List
          density="balanced"
          hasDividers
          header={<Text weight="semibold">Published storefront routes</Text>}
        >
          {[
            'Fall home refresh',
            'Wellness essentials',
            'Travel favorites',
            'Everyday upgrades',
          ].map((folder, index) => (
            <ListItem
              key={folder}
              label={folder}
              description={`${6 + index * 3} products · ${1_240 + index * 418} clicks · Updated ${index + 1}d ago`}
              startContent={<Icon icon={Store} color="accent" />}
              endContent={
                <Button
                  label="Copy link"
                  icon={<Icon icon={Clipboard} />}
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    copy(
                      'Storefront link',
                      `https://waverly.example/northstar/${folder.toLowerCase().replaceAll(' ', '-')}`,
                    )
                  }
                />
              }
            />
          ))}
        </List>
      ) : (
        <List
          density="balanced"
          hasDividers
          header={
            <Text weight="semibold">
              {tab === 'archived' ? 'Archived product links' : 'Product links'}
            </Text>
          }
        >
          {visible.map((row) => (
            <ListItem
              key={row.key}
              label={row.displayName}
              description={`${offerBrand(row.offer)?.name ?? 'Brand'} · ${row.clicks.toLocaleString()} clicks · ${row.offer.marketplace} ${row.offer.countryCode}`}
              startContent={
                <ProductThumb src={row.offer.productImageUrl} name={row.offer.offerName} />
              }
              endContent={
                <Button
                  label="Copy link"
                  icon={<Icon icon={Clipboard} />}
                  variant="secondary"
                  size="sm"
                  onClick={() => copy('Waverly link', `https://go.waverly.example/${row.slug}`)}
                />
              }
            />
          ))}
        </List>
      )}
    </VStack>
  )
}

function StorefrontSurface() {
  const [tab, setTab] = useState('products')
  const [published, setPublished] = useState(false)
  const [selected, setSelected] = useState(
    () => new Set(programOffers.slice(0, 9).map((offer) => offer.key)),
  )
  const [notice, setNotice] = useState<Notice>(null)

  const toggle = (key: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <VStack gap={5}>
      <WorkspaceIntro
        icon={Store}
        title="Northstar storefront"
        description="Curate shoppable products and editorial collections under one public profile."
        meta={`${selected.size} products · ${published ? 'Published' : 'Draft changes'}`}
      />
      <HStack justify="between" align="center" gap={3} wrap="wrap">
        <TabList value={tab} onChange={setTab} size="sm" hasDivider>
          <Tab value="products" label="Products" icon={<Icon icon={ShoppingBag} />} />
          <Tab value="posts" label="Posts" icon={<Icon icon={BookImage} />} />
          <Tab value="profile" label="Profile" icon={<Icon icon={Store} />} />
          <Tab value="folders" label="Folders" icon={<Icon icon={FolderOpen} />} />
        </TabList>
        <Button
          label={published ? 'Published' : 'Publish storefront'}
          icon={<Icon icon={published ? Check : Send} />}
          variant={published ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => {
            setPublished(true)
            setNotice({
              status: 'success',
              title: 'Storefront published',
              description: `${selected.size} products are now included in this local preview.`,
            })
          }}
        />
      </HStack>
      {notice ? (
        <Banner
          status={notice.status}
          title={notice.title}
          description={notice.description}
          endContent={
            <Button label="Dismiss" variant="ghost" size="sm" onClick={() => setNotice(null)} />
          }
        />
      ) : null}
      {tab === 'products' ? (
        <Grid columns={{ minWidth: 250, max: 3, repeat: 'fit' }} gap={4}>
          {programOffers.slice(0, 16).map((offer) => {
            const brand = offerBrand(offer)
            const included = selected.has(offer.key)
            return (
              <Card key={offer.key} padding={0} height="100%">
                <VStack gap={0} height="100%">
                  <AspectRatio ratio={4 / 3} fit="contain">
                    <img src={offer.productImageUrl} alt={offer.offerName} style={imageStyle} />
                  </AspectRatio>
                  <VStack gap={3} padding={4} style={{ flex: 1 }} justify="between">
                    <VStack gap={1}>
                      <Text type="supporting" color="accent" weight="semibold">
                        {brand?.name ?? 'Brand'}
                      </Text>
                      <Heading level={3}>{offer.offerName}</Heading>
                      <Text type="supporting" color="secondary">
                        {money.format(offer.priceCents / 100)} ·{' '}
                        {(offer.commissionRateBps / 100).toFixed(0)}% commission
                      </Text>
                    </VStack>
                    <Button
                      label={included ? 'In storefront' : 'Add to storefront'}
                      icon={<Icon icon={included ? Check : Store} />}
                      variant={included ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => toggle(offer.key)}
                    />
                  </VStack>
                </VStack>
              </Card>
            )
          })}
        </Grid>
      ) : tab === 'posts' ? (
        <List
          density="spacious"
          hasDividers
          header={<Text weight="semibold">Shoppable editorial posts</Text>}
        >
          {[
            ['9 small upgrades that make home feel calmer', '7 linked products', 'Published'],
            ['The wellness shelf we actually use', '6 linked products', 'Draft'],
            ['A practical reset for fall routines', '8 linked products', 'Scheduled'],
          ].map(([title, products, state]) => (
            <ListItem
              key={title}
              label={title}
              description={`${products} · Updated Aug 28`}
              startContent={<Icon icon={BookImage} color="accent" />}
              endContent={
                <Token label={state} color={state === 'Published' ? 'green' : 'blue'} size="sm" />
              }
            />
          ))}
        </List>
      ) : tab === 'folders' ? (
        <List
          density="balanced"
          hasDividers
          header={<Text weight="semibold">Product folders</Text>}
        >
          {[
            ['Fall home refresh', 12],
            ['Wellness essentials', 9],
            ['Travel favorites', 7],
            ['Worth the splurge', 5],
          ].map(([folder, count]) => (
            <ListItem
              key={folder}
              label={String(folder)}
              description={`${count} products · Public collection`}
              startContent={<Icon icon={FolderOpen} color="accent" />}
              endContent={<Button label="Open" variant="ghost" size="sm" />}
            />
          ))}
        </List>
      ) : (
        <Section variant="muted" padding={6}>
          <VStack gap={4} maxWidth="var(--content-width-readable)">
            <VStack gap={1}>
              <Heading level={2}>Northstar Living</Heading>
              <Text color="secondary">
                Useful products, tested routines, and honest context for a more considered everyday.
              </Text>
            </VStack>
            <HStack gap={2} wrap="wrap">
              <Token label="Home" color="blue" />
              <Token label="Wellness" color="green" />
              <Token label="Travel" color="purple" />
            </HStack>
            <Button
              label="Preview public profile"
              icon={<Icon icon={Store} />}
              variant="secondary"
              onClick={() =>
                setNotice({
                  status: 'info',
                  title: 'Public preview ready',
                  description:
                    'The storefront profile preview is available in this session without opening a new route.',
                })
              }
            />
          </VStack>
        </Section>
      )}
    </VStack>
  )
}

export function CreatorWorkspaceSurface({ page }: { page: WorkspacePage }) {
  if (page === 'Partnerships') return <PartnershipsSurface />
  if (page === 'Placements') return <PlacementsSurface />
  if (page === 'Tracking') return <TrackingSurface />
  return <StorefrontSurface />
}
