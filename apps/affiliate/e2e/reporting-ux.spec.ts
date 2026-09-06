import { expect, test, type Page } from '@playwright/test'

async function openReports(page: Page) {
  const destination = '/dashboard?role=northstar&page=Reports'
  await page.goto(`/api/auth/sign-in?returnPathname=${encodeURIComponent(destination)}`)
  await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible()
}

for (const width of [1440, 1024, 768, 390]) {
  test(`reports: controls remain separate and contained at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 940 })
    await openReports(page)
    const controls = page.getByRole('region', { name: 'Report controls' })
    const dates = controls.getByRole('button', { name: /^Report period/ })
    const provider = controls.getByRole('combobox', { name: 'Provider', exact: true })
    const metric = controls.getByRole('combobox', { name: 'Chart metric', exact: true })
    const boundary = (await controls.boundingBox())!
    const boxes = await Promise.all(
      [dates, provider, metric].map((control) => control.boundingBox()),
    )
    for (const box of boxes) {
      expect(box!.x).toBeGreaterThanOrEqual(boundary.x)
      expect(box!.x + box!.width).toBeLessThanOrEqual(boundary.x + boundary.width)
      expect(box!.height).toBeCloseTo(boxes[0]!.height, 0)
    }
    for (let i = 0; i < boxes.length; i++) {
      for (const other of boxes.slice(i + 1)) {
        const box = boxes[i]!
        expect(
          box.x + box.width <= other!.x ||
            other!.x + other!.width <= box.x ||
            box.y + box.height <= other!.y ||
            other!.y + other!.height <= box.y,
        ).toBe(true)
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button', { name: /^Report period/ }).click()
    const popup = page.getByRole('dialog', { name: 'Report period' })
    const popupBox = (await popup.boundingBox())!
    expect(popupBox.x).toBeGreaterThanOrEqual(0)
    expect(popupBox.x + popupBox.width).toBeLessThanOrEqual(width)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: /^Report period/ })).toBeFocused()
  })
}

test('reports: presets and valid custom dates update data; cancel preserves the range', async ({
  page,
}) => {
  await openReports(page)
  const trigger = page.getByRole('button', { name: /^Report period/ })
  const comparison = page.locator('.waverly-report-comparison')
  const rows = page.getByRole('table').locator('tbody tr')
  await trigger.click()
  await page.getByRole('button', { name: 'Last 7 days', exact: true }).click()
  await expect(rows).toHaveCount(7)
  await expect(comparison).toContainText('7 days')
  await trigger.click()
  const popup = page.getByRole('dialog', { name: 'Report period' })
  await popup.getByLabel('From', { exact: true }).fill('2026-08-14')
  await popup.getByLabel('To', { exact: true }).fill('2026-08-13')
  await expect(popup.getByRole('alert')).toContainText('End date must be on or after')
  await expect(popup.getByRole('button', { name: 'Apply dates' })).toBeDisabled()
  await popup.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect(rows).toHaveCount(7)
  await trigger.click()
  await expect(popup.getByLabel('From', { exact: true })).toHaveValue('2026-08-09')
  await popup.getByLabel('From', { exact: true }).fill('2026-08-10')
  await popup.getByLabel('To', { exact: true }).fill('2026-08-12')
  await popup.getByRole('button', { name: 'Apply dates' }).click()
  await expect(rows).toHaveCount(3)
  await expect(comparison).toContainText('3 days')
})

test('reports: filters and keyboard tabs update the chart with a visible active indicator', async ({
  page,
}) => {
  await openReports(page)
  await page.getByRole('combobox', { name: 'Provider', exact: true }).click()
  await page.getByRole('option', { name: /Amazon/ }).click()
  await page.getByRole('combobox', { name: 'Chart metric', exact: true }).click()
  await page.getByRole('option', { name: 'Gross commission', exact: true }).click()
  await expect(
    page.getByRole('img', {
      name: 'Gross commission for the selected and previous reporting periods',
    }),
  ).toBeVisible()
  const tabs = page.getByRole('tablist', { name: 'Report views' })
  await tabs.getByRole('tab', { name: 'Performance', exact: true }).focus()
  await page.keyboard.press('ArrowRight')
  const products = tabs.getByRole('tab', { name: 'Products', exact: true })
  await expect(products).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(products).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByRole('img', { name: 'Gross commission ranked by product' })).toBeVisible()
  await expect
    .poll(() => products.evaluate((element) => getComputedStyle(element, '::after').opacity))
    .toBe('1')
  const indicator = await products.evaluate((element) => {
    const style = getComputedStyle(element, '::after')
    return {
      opacity: style.opacity,
      width: parseFloat(style.width),
      height: parseFloat(style.height),
    }
  })
  expect(indicator.opacity).toBe('1')
  expect(indicator.width).toBeGreaterThan(0)
  expect(indicator.height).toBeGreaterThan(0)
})
