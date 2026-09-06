import { expect, test, type Page } from '@playwright/test'

async function openCatalog(page: Page) {
  const destination = '/dashboard?role=northstar&page=Brand%20catalog'
  await page.goto(`/api/auth/sign-in?returnPathname=${encodeURIComponent(destination)}`)
  await expect(page.getByRole('heading', { name: 'Find your next brand partner' })).toBeVisible()
}

async function choose(page: Page, label: string, option: string) {
  await page.getByRole('combobox', { name: label, exact: true }).click()
  await page.getByRole('option', { name: option, exact: true }).click()
}

test('catalog: source image dimensions cannot expand rows or columns', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await openCatalog(page)
  const table = page.getByRole('table', { name: 'Brands', exact: true })
  await expect(table.locator('tbody tr')).toHaveCount(20)
  const geometry = await table.evaluate((element) => ({
    heights: Array.from(
      element.querySelectorAll('tbody tr'),
      (row) => row.getBoundingClientRect().height,
    ),
    thumbnails: Array.from(element.querySelectorAll('[data-slot=thumbnail]'), (thumbnail) => ({
      width: thumbnail.getBoundingClientRect().width,
      height: thumbnail.getBoundingClientRect().height,
    })),
    categoryWidth: element.querySelectorAll('th')[1].getBoundingClientRect().width,
  }))
  expect(Math.max(...geometry.heights)).toBeLessThanOrEqual(80)
  expect(
    geometry.thumbnails.every(
      ({ width, height }) => width === height && width >= 32 && width <= 48,
    ),
  ).toBe(true)
  expect(geometry.categoryWidth).toBeCloseTo(100, 0)
  await page.getByRole('textbox', { name: 'Search brands', exact: true }).fill('Rocco')
  await expect(table.locator('tbody tr')).toHaveCount(1)
  await expect(table.getByRole('cell', { name: '78%', exact: true })).toBeVisible()
  await expect(table).not.toContainText('78–78%')
})

test('catalog: combined filters, empty recovery, and numeric sorting work', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await openCatalog(page)
  await choose(page, 'Category', 'Pets')
  await expect(page.getByRole('status')).toHaveText('2 of 20 brands')
  await choose(page, 'Access', 'Review')
  await expect(page.getByRole('heading', { name: 'No brands match your filters' })).toBeVisible()
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click()
  await expect(page.getByRole('status')).toHaveText('20 of 20 brands')
  await choose(page, 'Sort brands', 'Highest earnings')
  const earnings = await page
    .getByRole('table', { name: 'Brands', exact: true })
    .locator('tbody tr')
    .evaluateAll((rows) =>
      rows.map((row) => Number(row.querySelectorAll('td')[5].textContent?.replace(/[^\d.]/g, ''))),
    )
  expect(earnings).toEqual([...earnings].sort((a, b) => b - a))
  await page.getByRole('textbox', { name: 'Search brands', exact: true }).fill('HumanN')
  await page.getByRole('button', { name: 'Clear Search brands', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Search brands', exact: true })).toBeFocused()
})

test('catalog: mobile retains comparison data and opens brands without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openCatalog(page)
  await page.getByRole('textbox', { name: 'Search brands', exact: true }).fill('Rocco')
  const list = page.getByRole('list', { name: 'Brands', exact: true })
  await expect(list).toBeVisible()
  await expect(list).toContainText('Publisher share')
  await expect(list).toContainText('78%')
  await expect(list).toContainText('Network earnings')
  await expect(list).toContainText('Audience fit')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await list.getByRole('button', { name: 'View Rocco & Roxie Supply Co.', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Rocco & Roxie Supply Co.', exact: true }),
  ).toBeVisible()
})

test('catalog: missing images preserve row geometry and readable fallback', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.route('**/demo/catalog/brands/**', (route) => route.abort())
  await openCatalog(page)
  await page.getByRole('textbox', { name: 'Search brands', exact: true }).fill('Rocco')
  const row = page.getByRole('table', { name: 'Brands', exact: true }).locator('tbody tr')
  await expect(
    row.getByText('Rocco & Roxie Supply Co.: image unavailable', { exact: true }),
  ).toHaveCount(1)
  expect((await row.boundingBox())?.height).toBeLessThanOrEqual(80)
})

test('catalog: collapsed navigation stays named and restores labels on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await openCatalog(page)
  await page.getByRole('button', { name: 'Collapse navigation', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Expand navigation', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false')
  const nav = page.getByRole('navigation', { name: 'Workspace navigation' })
  await expect(nav.getByRole('button', { name: 'Brand catalog', exact: true })).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(
    nav.getByRole('button', { name: 'Brand catalog', exact: true }).locator('span'),
  ).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('catalog: product images preserve their ratio and actions stay inside each card', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })
  await openCatalog(page)
  await page
    .getByRole('navigation', { name: 'Workspace navigation' })
    .getByRole('button', { name: 'Product catalog', exact: true })
    .click()
  const action = page.getByRole('button', { name: 'View product', exact: true }).first()
  await expect(action).toBeVisible()
  const geometry = await action.evaluate((button) => {
    const card = button.closest('[data-slot="card"]')!
    const media = card.querySelector('.waverly-aspect-ratio')!.getBoundingClientRect()
    return {
      ratio: media.width / media.height,
      cardBottom: card.getBoundingClientRect().bottom,
      actionBottom: button.getBoundingClientRect().bottom,
    }
  })
  expect(geometry.ratio).toBeCloseTo(4 / 3, 2)
  expect(geometry.actionBottom).toBeLessThan(geometry.cardBottom)
})
