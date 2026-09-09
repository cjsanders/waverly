import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const manifest = async (path) =>
  JSON.parse(await readFile(new URL(`../${path}/package.json`, import.meta.url), 'utf8'))

for (const [app, server] of [
  ['affiliate', 'vite'],
  ['website', 'astro'],
  ['docs', 'astro'],
]) {
  test(`${app} loads its scoped Doppler config before starting the dev server`, async () => {
    const { scripts } = await manifest(`apps/${app}`)
    assert.equal(scripts.dev, `doppler run -- portless ${app}.waverly ${server} dev`)
    const setup = await readFile(new URL(`../apps/${app}/doppler.yaml`, import.meta.url), 'utf8')
    assert.match(setup, new RegExp(`project: waverly-${app}\\b`))
    assert.match(setup, /config: dev\b/)
  })
}

test('Convex development uses the same scoped Doppler configuration', async () => {
  const { scripts } = await manifest('apps/affiliate')
  assert.equal(scripts['dev:convex'], 'doppler run -- bunx convex dev')
})

test('root dev delegates to app tasks instead of injecting one shared project', async () => {
  const { scripts } = await manifest('.')
  assert.equal(scripts.dev, 'turbo run dev')
})

test('credential-free agent commands stay independent of Doppler', async () => {
  const { scripts } = await manifest('apps/affiliate')
  for (const [name, command] of Object.entries(scripts)) {
    if (name.includes('agent') || name === 'dev:workos') {
      assert.doesNotMatch(command, /doppler|bun run dev:convex\b/, name)
    }
  }
})
