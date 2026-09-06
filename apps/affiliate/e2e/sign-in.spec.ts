import { expect, test } from '@playwright/test'

// The emulator's authorize endpoint signs in the first seeded user without showing a login page.
const seededUser = /Alice Example/

test('signs in with WorkOS and lands on the dashboard', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Sign in with WorkOS' }).click()

  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/)
  await expect(page.getByRole('heading', { name: 'Network overview' })).toBeVisible()
  await expect(page.getByRole('button', { name: seededUser })).toBeVisible()
})

test('Convex accepts the WorkOS access token', async ({ page }) => {
  await page.goto('/api/auth/sign-in?returnPathname=/dashboard')

  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/)
  // Rendered only after the local Convex backend verified the token against the emulator's JWKS.
  await expect(page.getByTestId('convex-session')).toHaveText(
    'Convex session · admin · org_01E2E00000000000000000BRAND',
  )
})

test('a signed-out visit to the dashboard goes through sign-in and back', async ({ page }) => {
  await page.goto('/dashboard')

  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/)
  await expect(page.getByRole('button', { name: seededUser })).toBeVisible()
})

test('signing out returns to the landing page', async ({ page }) => {
  await page.goto('/api/auth/sign-in?returnPathname=/dashboard')
  await page.getByRole('button', { name: seededUser }).click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()

  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: 'Sign in with WorkOS' })).toBeVisible()
})
