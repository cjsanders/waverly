/* eslint-disable no-await-in-loop -- Each navigation must complete before exercising the next page. */
import { expect, test, type Page } from '@playwright/test'

const workspaces = [
  {
    kind: 'operator',
    pages: [
      'Overview',
      'Publishers',
      'Advertisers',
      'Programs',
      'Offers',
      'Links',
      'Clicks',
      'Conversions',
      'Reports',
      'Balances',
      'Payouts',
      'Providers',
      'Messages',
      'Settings',
    ],
  },
  {
    kind: 'creator',
    pages: [
      'Overview',
      'For you',
      'Product catalog',
      'Brand catalog',
      'Cost-per-click',
      'Loyalty programs',
      'Lists',
      'Partnerships',
      'Placements',
      'Tracking',
      'Storefront',
      'Reports',
      'Earnings',
      'Payouts',
      'Properties',
      'Messages',
      'Settings',
      'Opportunities',
      'Projects',
      'Portfolio',
      'Performance',
      'Publishers',
      'Getting started',
    ],
  },
  {
    kind: 'brand',
    pages: [
      'Overview',
      'Brand profile',
      'Products & commissions',
      'Deals & CPC',
      'Samples',
      'Creator directory',
      'Applications',
      'Partnerships',
      'Paid placements',
      'Performance',
      'Deep reports',
      'Billing',
      'Messages',
      'Settings',
    ],
  },
] as const

const organizations = {
  operator: 'org_01E2E000000000000000OPERATOR',
  creator: 'org_01E2E000000000000000CREATOR',
  brand: 'org_01E2E00000000000000000BRAND',
} as const

type WorkspaceKind = keyof typeof organizations

async function signIn(page: Page, kind: WorkspaceKind, surface = 'Overview') {
  await page.goto(
    `/api/auth/sign-in?returnPathname=/dashboard&organizationId=${organizations[kind]}`,
  )
  await page.goto(`/${kind}?page=${encodeURIComponent(surface)}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

for (const workspace of workspaces) {
  test(`${workspace.kind}: all core pages render without errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await signIn(page, workspace.kind)
    const navigation = page.getByRole('navigation', { name: 'Workspace navigation' })
    for (const surface of workspace.pages) {
      const navItem = navigation.locator('.waverly-nav-item').filter({ hasText: surface })
      if ((await navItem.getAttribute('aria-current')) !== 'page') await navItem.click()
      await expect(page).toHaveURL(
        new RegExp(`page=${encodeURIComponent(surface).replaceAll('%20', '(?:%20|\\+)')}`),
      )
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByText('Loading workspace…', { exact: true })).toHaveCount(0)
      await expect(navItem).toHaveAttribute('aria-current', 'page')
      await expect(page.getByText('Something went wrong')).toHaveCount(0)
    }
    expect(errors).toEqual([])
  })
}

test('navigation survives refresh and browser back', async ({ page }) => {
  await signIn(page, 'operator', 'Publishers')
  await page.getByRole('navigation').getByRole('link', { name: 'Offers', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Offers')
  await page.goBack()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Publishers')
})

test('operator tables support filtering and an empty search', async ({ page }) => {
  await signIn(page, 'operator', 'Publishers')
  await page.getByRole('textbox', { name: 'Search publishers' }).fill('Everyday')
  await expect(page.locator('tbody tr')).toHaveCount(1)
  await expect(page.locator('tbody')).toContainText('Everyday Finds')
  await page.getByRole('textbox', { name: 'Search publishers' }).fill('no-matching-publisher')
  await expect(page.locator('tbody tr')).toHaveCount(0)
})

test('messages persist across refresh and are visible to the counterpart', async ({ page }) => {
  await signIn(page, 'operator', 'Messages')
  await page.getByPlaceholder('Search conversations…').fill('Northstar')
  await page
    .getByRole('button', { name: /Northstar/ })
    .first()
    .click()
  const message = `Local test message ${Date.now()}`
  await page.locator('form input:not([type=file])').fill(message)
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(
    page.locator('[data-slot=message]').getByText(message, { exact: true }),
  ).toBeVisible()
  await page.reload()
  await expect(
    page.locator('[data-slot=message]').getByText(message, { exact: true }),
  ).toBeVisible()
  await page.goto('/creator?page=Messages')
  await expect(
    page.locator('[data-slot=message]').getByText(message, { exact: true }),
  ).toBeVisible()
})

test('mobile navigation exposes the organization switcher without page overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await signIn(page, 'operator')
  await page
    .getByRole('button', { name: /Waverly Operations/ })
    .first()
    .click()
  await page.getByRole('menuitem', { name: /Waverly Test Brand/ }).click()
  await expect(page).toHaveURL(/\/brand(?:\?|$)/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Waverly Test Brand creator program',
  )
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})

test('publisher can save a product, revisit it, and export a report', async ({ page }) => {
  await signIn(page, 'creator', 'Product catalog')
  await page.getByRole('button', { name: 'View product', exact: true }).first().click()
  const productHeading = await page.getByRole('heading', { level: 2 }).first().textContent()
  const save = page.getByRole('button', { name: 'Save product', exact: true })
  if (await save.count()) await save.click()
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()
  await page.getByRole('navigation').getByRole('link', { name: 'Reports', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click()
  expect((await downloadPromise).suggestedFilename()).toMatch(/^waverly-.*\.csv$/)
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Product catalog', exact: true })
    .click()
  await page.getByRole('button', { name: 'View product', exact: true }).first().click()
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(productHeading!)
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()
})

test('seller can accept an application in the workspace workflow', async ({ page }) => {
  await signIn(page, 'brand', 'Applications')
  const accept = page.getByRole('button', { name: 'Accept', exact: true })
  await expect(accept.first()).toBeVisible()
  await accept.first().click()
  await expect(page.getByText('Application accepted', { exact: true })).toBeVisible()
})

test('creator can accept a brief and find the new project', async ({ page }) => {
  await signIn(page, 'creator', 'Opportunities')
  await page.getByRole('button', { name: 'Accept brief', exact: true }).first().click()
  await expect(page.getByRole('button', { name: 'Accepted', exact: true }).first()).toBeVisible()
  await page.getByRole('navigation').getByRole('link', { name: 'Projects', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projects')
  await expect(page.getByRole('button', { name: 'Open brief', exact: true }).first()).toBeVisible()
})

test.describe('server rendering', () => {
  test.use({ javaScriptEnabled: false })

  for (const kind of ['operator', 'brand', 'creator'] as const) {
    test(`${kind}: workspace and persisted messages render without JavaScript`, async ({
      page,
    }) => {
      await signIn(page, kind)
      await expect(page.getByRole('navigation', { name: 'Workspace navigation' })).toBeVisible()
      await page.getByRole('link', { name: 'Messages', exact: true }).click()
      await expect(page.getByPlaceholder('Search conversations…')).toBeVisible()
      await expect(page.locator('[data-slot=message]').first()).toBeVisible()
      await expect(page.getByText('Loading workspace…', { exact: true })).toHaveCount(0)
    })
  }
})

test('hovering Messages prefetches the inbox and selected conversation before navigation', async ({
  page,
}) => {
  const queries: string[] = []
  page.on('websocket', (socket) => {
    socket.on('framesent', ({ payload }) => queries.push(payload.toString()))
  })
  await signIn(page, 'operator')
  queries.length = 0
  const messages = page.getByRole('link', { name: 'Messages', exact: true })
  await messages.hover()
  await expect
    .poll(() => queries.some((query) => query.includes('messages:listThreads')))
    .toBe(true)
  await expect
    .poll(() => queries.some((query) => query.includes('messages:listMessages')))
    .toBe(true)
  await expect(page).toHaveURL(/page=Overview/)
  await messages.click()
  await expect(page.locator('[data-slot=message]').first()).toBeVisible()
})

test('cached workspace navigation does not make auth server requests', async ({ page }) => {
  await signIn(page, 'operator', 'Publishers')
  await expect(page.getByRole('button', { name: /Alice Example/ })).toBeVisible()
  const requests: string[] = []
  await page.route('**/_serverFn/**', async (route) => {
    requests.push(route.request().url())
    await route.abort()
  })
  for (const name of ['Advertisers', 'Programs', 'Publishers']) {
    await page.getByRole('link', { name, exact: true }).click()
    await expect(page.getByRole('heading', { name, level: 1, exact: true })).toBeVisible()
  }
  expect(requests).toEqual([])
})

for (const [destination, moduleName] of [
  ['Messages', 'MessagesSurface'],
  ['Reports', 'ReportingSurface'],
] as const) {
  test(`${destination}: intent preloads page JavaScript before navigation`, async ({ page }) => {
    await signIn(page, 'operator')
    const loaded = page.waitForResponse(
      (response) => response.url().includes(`/assets/${moduleName}-`) && response.ok(),
    )
    const link = page.getByRole('link', { name: destination, exact: true })
    await link.hover()
    await (await loaded).finished()
    await expect(page).toHaveURL(/page=Overview/)
    const lateScripts: string[] = []
    page.on('request', (request) => {
      if (request.resourceType() === 'script') lateScripts.push(request.url())
    })
    await link.click()
    await expect(
      page.getByRole('heading', { name: destination, level: 1, exact: true }),
    ).toBeVisible()
    if (destination === 'Messages')
      await expect(page.getByPlaceholder('Search conversations…')).toBeVisible()
    else await expect(page.getByRole('button', { name: 'Export CSV', exact: true })).toBeVisible()
    expect(lateScripts).toEqual([])
  })
}

test('background session revalidation removes an expired workspace session', async ({
  page,
  context,
}) => {
  await signIn(page, 'operator')
  await expect(page.getByRole('button', { name: /Alice Example/ })).toBeVisible()
  const redirect = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/operator' && response.status() === 307,
  )
  await context.clearCookies()
  await page.evaluate(() => window.dispatchEvent(new Event('visibilitychange')))
  expect((await redirect).headers().location).toContain('/api/auth/sign-in')
})
