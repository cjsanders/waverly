import { expect, test } from '@playwright/test'

// The emulator's authorize endpoint signs in the first seeded user without showing a login page.
const seededUser = /Alice Example/
const brandOrganizationId = 'org_01E2E00000000000000000BRAND'
const signInUrl = `/api/auth/sign-in?returnPathname=/dashboard&organizationId=${brandOrganizationId}`

test('signs in with WorkOS and lands in the active organization', async ({ page }) => {
  await page.goto(signInUrl)

  await expect(page).toHaveURL(/\/brand(?:\?|$)/)
  await expect(
    page.getByRole('heading', { name: 'Waverly Test Brand creator program' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: seededUser })).toBeVisible()
})

test('the organization switcher changes the WorkOS session and workspace route', async ({
  page,
}) => {
  await page.goto(signInUrl)

  await expect(page).toHaveURL(/\/brand(?:\?|$)/)
  await page.getByRole('button', { name: /Waverly Test Brand/ }).click()
  await page.getByRole('menuitem', { name: /Creator Studio/ }).click()
  await expect(page).toHaveURL(/\/creator(?:\?|$)/)
  await expect(page.getByRole('heading', { name: 'Creator Studio overview' })).toBeVisible()
})

test('signing out returns to the landing page', async ({ page }) => {
  await page.goto(signInUrl)
  await page.getByRole('button', { name: seededUser }).click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: 'Sign in with WorkOS' })).toBeVisible()
})
