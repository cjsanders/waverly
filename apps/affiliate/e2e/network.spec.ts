/* eslint-disable no-await-in-loop -- Each navigation must complete before exercising the next page. */
import { expect, test, type Page } from '@playwright/test'

const workspaces = [
  {
    role: 'operator',
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
    role: 'northstar',
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
    ],
  },
  {
    role: 'everyday',
    pages: [
      'Overview',
      'For you',
      'Product catalog',
      'Brand catalog',
      'Cost-per-click',
      'Loyalty programs',
      'Lists',
      'Properties',
      'Messages',
      'Settings',
    ],
  },
  {
    role: 'avery',
    pages: [
      'Overview',
      'Opportunities',
      'Projects',
      'Portfolio',
      'Performance',
      'Earnings',
      'Payouts',
      'Publishers',
      'Messages',
      'Settings',
    ],
  },
  {
    role: 'puroair',
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
]

async function signIn(page: Page, role: string, surface = 'Overview') {
  const destination = `/dashboard?role=${role}&page=${encodeURIComponent(surface)}`
  await page.goto(`/api/auth/sign-in?returnPathname=${encodeURIComponent(destination)}`)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}

for (const workspace of workspaces) {
  test(`${workspace.role}: all core pages render without errors`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await signIn(page, workspace.role)
    const navigation = page.getByRole('navigation', { name: 'Workspace navigation' })
    for (const surface of workspace.pages) {
      await navigation.getByRole('button', { name: surface, exact: true }).click()
      await expect(page).toHaveURL(
        new RegExp(`page=${encodeURIComponent(surface).replaceAll('%20', '(?:%20|\\+)')}`),
      )
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByText('Loading workspace…', { exact: true })).toHaveCount(0)
      await expect(navigation.getByRole('button', { name: surface, exact: true })).toHaveAttribute(
        'aria-current',
        'page',
      )
      await expect(page.getByText('Something went wrong')).toHaveCount(0)
    }
    expect(errors).toEqual([])
  })
}

test('navigation survives refresh and browser back', async ({ page }) => {
  await signIn(page, 'operator', 'Publishers')
  await page.getByRole('navigation').getByRole('button', { name: 'Offers', exact: true }).click()
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
  await page.goto('/dashboard?role=northstar&page=Messages')
  await expect(
    page.locator('[data-slot=message]').getByText(message, { exact: true }),
  ).toBeVisible()
})

test('mobile navigation exposes the demo role switcher without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await signIn(page, 'operator')
  await page.getByRole('combobox', { name: 'Demo identity' }).click()
  await page.getByRole('option', { name: 'PuroAir' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('PuroAir creator program')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})

test('publisher can save a product, revisit it, and export a report', async ({ page }) => {
  await signIn(page, 'northstar', 'Product catalog')
  await page.getByRole('button', { name: 'View product', exact: true }).first().click()
  const productHeading = await page.getByRole('heading', { level: 2 }).first().textContent()
  const save = page.getByRole('button', { name: 'Save product', exact: true })
  if (await save.count()) await save.click()
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()
  await page.getByRole('navigation').getByRole('button', { name: 'Reports', exact: true }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export CSV', exact: true }).click()
  expect((await downloadPromise).suggestedFilename()).toMatch(/^waverly-.*\.csv$/)
  await page
    .getByRole('navigation')
    .getByRole('button', { name: 'Product catalog', exact: true })
    .click()
  await page.getByRole('button', { name: 'View product', exact: true }).first().click()
  await expect(page.getByRole('heading', { level: 2 }).first()).toHaveText(productHeading!)
  await expect(page.getByRole('button', { name: 'Saved', exact: true })).toBeVisible()
})

test('seller can accept an application in the demo workflow', async ({ page }) => {
  await signIn(page, 'puroair', 'Applications')
  const accept = page.getByRole('button', { name: 'Accept', exact: true })
  await expect(accept.first()).toBeVisible()
  const pending = await accept.count()
  await accept.first().click()
  await expect(page.getByText('Application accepted', { exact: true })).toBeVisible()
  await expect(accept).toHaveCount(pending - 1)
})

test('creator can accept a brief and find the new project', async ({ page }) => {
  await signIn(page, 'avery', 'Opportunities')
  await page.getByRole('button', { name: 'Accept brief', exact: true }).first().click()
  await expect(page.getByRole('button', { name: 'Accepted', exact: true }).first()).toBeVisible()
  await page.getByRole('navigation').getByRole('button', { name: 'Projects', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Projects')
  await expect(page.getByRole('button', { name: 'Open brief', exact: true }).first()).toBeVisible()
})
