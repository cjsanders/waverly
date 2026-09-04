import 'dotenv/config'
import { browserbase, Stagehand, type StagehandBrowser } from '@browserbasehq/stagehand'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const apiKey = process.env.BROWSERBASE_API_KEY
const baseUrl = process.env.E2E_BASE_URL
const portalLoginUrl = process.env.E2E_PORTAL_LOGIN_URL

if (apiKey && !baseUrl) {
  throw new Error('E2E_BASE_URL is required when BROWSERBASE_API_KEY is set')
}

describe.skipIf(!apiKey)('Stagehand smoke test', () => {
  let browser: StagehandBrowser | undefined
  let stagehand: Stagehand | undefined

  beforeAll(async () => {
    browser = await browserbase.launch({
      apiKey: apiKey!,
      keepAlive: false,
      userMetadata: { suite: 'waverly-vitest-e2e' },
    })

    try {
      stagehand = await Stagehand.create({ browser })
    } catch (error) {
      await browser.close().catch(() => undefined)
      throw error
    }
  })

  afterAll(async () => {
    try {
      await stagehand?.close()
    } finally {
      await browser?.close()
    }
  })

  it('opens the configured application', async () => {
    if (!browser) throw new Error('Browser was not initialized')
    if (!baseUrl) throw new Error('E2E_BASE_URL is required')

    const pages = await browser.context.pages()
    const page = pages[0] ?? (await browser.context.newPage())

    if (portalLoginUrl) {
      await page.goto(portalLoginUrl, { waitUntil: 'load' })
    }

    await page.goto(baseUrl, { waitUntil: 'load' })

    await expect(page.url()).resolves.toContain(new URL(baseUrl).hostname)
    await expect(page.title()).resolves.not.toBe('')
  })
})
