import assert from 'node:assert/strict'
import { test } from 'node:test'
import { deployArgs, previewAlias, selectSecrets, workerSecrets } from './cloudflare.mjs'

test('previews upload versions without changing Worker names or production traffic', () => {
  for (const app of ['affiliate', 'website', 'docs']) {
    const args = deployArgs('preview', app, 'feature/new-page')
    assert.deepEqual(args.slice(0, 3), ['versions', 'upload', '--preview-alias'])
    assert.ok(!args.includes('deploy'))
    assert.ok(!args.includes('--name'))
  }
  assert.throws(() => deployArgs('deploy', 'affiliate', 'feature/new-page'))
  assert.deepEqual(deployArgs('deploy', 'website', 'main'), ['deploy'])
})

test('aliases are stable, DNS-safe and distinct for normalized or truncated branch names', () => {
  const worker = 'waverly-affiliate'
  const branches = [
    'feature/a',
    'feature-a',
    '123',
    'feature/' + 'a'.repeat(100),
    'feature/' + 'a'.repeat(99) + 'b',
  ]
  const aliases = branches.map((branch) => previewAlias(branch, worker))
  assert.equal(new Set(aliases).size, branches.length)
  for (const alias of aliases) {
    assert.match(alias, /^[a-z][a-z0-9-]*$/)
    assert.ok(`${alias}-${worker}`.length <= 63)
  }
  assert.equal(previewAlias('feature/a', worker), aliases[0])
})

test('only explicitly selected, nonempty string secrets reach the Worker', () => {
  assert.deepEqual(
    selectSecrets(
      {
        WORKOS_API_KEY: 'sample',
        TEST_USER_PASSWORD: 'never',
        DOPPLER_TOKEN: 'never',
        EMPTY: '',
        INVALID: 1,
      },
      ['WORKOS_API_KEY', 'EMPTY', 'INVALID'],
    ),
    { WORKOS_API_KEY: 'sample' },
  )
})

test('preview authentication returns to the same branch alias without changing production', () => {
  const secrets = {
    WORKOS_REDIRECT_URI: 'https://affiliate.example.com/api/auth/callback',
    WORKOS_API_KEY: 'sample',
    DOPPLER_TOKEN_PREVIEW: 'never',
  }
  const branch = 'feature/auth-test'
  const preview = workerSecrets(secrets, 'preview', branch)
  assert.equal(
    preview.WORKOS_REDIRECT_URI,
    `https://${previewAlias(branch, 'waverly-affiliate')}-waverly-affiliate.waverly-d46.workers.dev/api/auth/callback`,
  )
  assert.equal(
    workerSecrets(secrets, 'deploy', 'main').WORKOS_REDIRECT_URI,
    secrets.WORKOS_REDIRECT_URI,
  )
  assert.equal(secrets.WORKOS_REDIRECT_URI, 'https://affiliate.example.com/api/auth/callback')
  assert.ok(!('DOPPLER_TOKEN_PREVIEW' in preview))
})
