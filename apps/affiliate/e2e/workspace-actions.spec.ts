import { expect, test, type Page } from '@playwright/test'

async function openWorkspace(page: Page) {
  const destination = '/dashboard?role=northstar&page=For%20you'
  await page.goto(`/api/auth/sign-in?returnPathname=${encodeURIComponent(destination)}`)
  await expect(page.getByRole('heading', { name: 'For you', exact: true })).toBeVisible()
}

test('workspace actions: footer shortcuts open messages and relevant alerts', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 940 })
  await openWorkspace(page)
  const footer = page.locator('.waverly-side-nav-footer')
  const messages = footer.getByRole('button', { name: 'Messages', exact: true })
  await expect(messages).toHaveAccessibleDescription(/^\d+ unread messages$/)
  await footer.getByRole('button', { name: 'Alerts', exact: true }).click()
  const alerts = page.getByRole('dialog', { name: 'Alerts', exact: true })
  await expect(alerts).toContainText('Northstar Media')
  await expect(alerts).not.toContainText('Everyday Finds')
  await alerts.getByRole('button', { name: /Review reversed conversions/ }).click()
  await expect(alerts).toBeHidden()
  await expect(page).toHaveURL(/page=Earnings/)
  await messages.click()
  await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible()
  await expect(
    page.getByRole('navigation').getByRole('button', { name: 'Messages', exact: true }),
  ).toHaveCount(1)
  await expect(messages).toHaveAttribute('aria-current', 'page')
})

test('workspace actions: collapsed and mobile shortcuts remain usable without overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 940 })
  await openWorkspace(page)
  await page.getByRole('button', { name: 'Collapse navigation', exact: true }).click()
  const utilities = page.getByRole('group', { name: 'Messages and alerts' })
  const alertsButton = utilities.getByRole('button', { name: 'Alerts', exact: true })
  await expect(utilities.getByRole('button', { name: 'Messages', exact: true })).toBeVisible()
  await alertsButton.click()
  await expect(page.getByRole('dialog', { name: 'Alerts', exact: true })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(alertsButton).toBeFocused()
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(utilities).toBeVisible()
  await alertsButton.click()
  const popup = page.getByRole('dialog', { name: 'Alerts', exact: true })
  const box = (await popup.boundingBox())!
  expect(box.x).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(390)
  await popup.getByRole('button', { name: 'Close alerts', exact: true }).click()
  await utilities.getByRole('button', { name: 'Messages', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Messages', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
