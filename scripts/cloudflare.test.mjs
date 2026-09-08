import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  buildBranch,
  buildEnvironment,
  deployArgs,
  previewAlias,
  selectSecrets,
  workerSecrets,
} from './cloudflare.mjs'
import {
  convexPreviewName,
  previewBuildUrls,
  previewDeployArgs,
  previewSeedArgs,
} from './cloudflare-convex.mjs'

async function exerciseDeployment(mode, failure) {
  const directory = await realpath(await mkdtemp(join(tmpdir(), 'waverly-deployment-test-')))
  const log = join(directory, 'commands.jsonl')
  const captureScript = fileURLToPath(new URL('./cloudflare-convex.mjs', import.meta.url))
  const fixture = {
    CONVEX_PREVIEW_DEPLOY_KEY: 'preview:sample-team:sample-project|sample-key',
    VITE_CONVEX_URL: 'https://shared-backend.convex.cloud',
    VITE_CONVEX_SITE_URL: 'https://shared-backend.convex.site',
    WORKOS_CLIENT_ID: 'sample-client',
    WORKOS_API_KEY: 'sample-workos-key',
    WORKOS_COOKIE_PASSWORD: 'x'.repeat(32),
    WORKOS_REDIRECT_URI: 'https://waverly-affiliate.waverly-d46.workers.dev/api/auth/callback',
  }
  try {
    await mkdir(join(directory, 'scripts'), { recursive: true })
    await mkdir(join(directory, 'apps/affiliate/node_modules/convex/bin'), { recursive: true })
    await Promise.all(
      ['cloudflare.mjs', 'cloudflare-convex.mjs'].map((script) =>
        copyFile(new URL(script, import.meta.url), join(directory, 'scripts', script)),
      ),
    )
    const fetchMock = join(directory, 'fetch.mjs')
    await writeFile(
      fetchMock,
      `globalThis.fetch = async () => ({ ok: true, json: async () => (${JSON.stringify(fixture)}) })`,
    )
    const executable = `#!${process.execPath}
const { appendFileSync, readFileSync } = require('node:fs');
const { basename } = require('node:path');
const { spawnSync } = require('node:child_process');
const args = process.argv.slice(2);
const isConvex = basename(process.argv[1]) === 'main.js';
const stage = isConvex ? 'convex-' + args[0] : basename(process.argv[1]) === 'bun' ? 'build' : 'worker';
const record = { stage, args, url: process.env.VITE_CONVEX_URL, site: process.env.VITE_CONVEX_SITE_URL,
  credentialNames: Object.keys(process.env).filter(key => /^(CONVEX_|DOPPLER_|CLOUDFLARE_|WORKOS_|TEST_USER_)/.test(key)),
  temporaryFile: process.env.WAVERLY_CONVEX_PREVIEW_URL_FILE };
if (stage === 'worker') {
  const secrets = JSON.parse(readFileSync(args[args.indexOf('--secrets-file') + 1], 'utf8'));
  record.runtimeKeys = Object.keys(secrets);
  record.callback = secrets.WORKOS_REDIRECT_URI;
}
appendFileSync(process.env.WAVERLY_TEST_LOG, JSON.stringify(record) + '\\n');
if (process.env.WAVERLY_TEST_FAILURE === stage) process.exit(21);
if (stage === 'convex-deploy') {
  const result = spawnSync(process.execPath, [${JSON.stringify(captureScript)}, 'capture'], {
    env: { ...process.env, VITE_CONVEX_URL: 'https://isolated-preview.convex.cloud', VITE_CONVEX_SITE_URL: 'https://isolated-preview.convex.site' },
    stdio: 'inherit'
  });
  process.exit(result.status ?? 1);
}
`
    await Promise.all(
      ['bun', 'bunx', 'apps/affiliate/node_modules/convex/bin/main.js'].map((command) =>
        writeFile(join(directory, command), executable, { mode: 0o700 }),
      ),
    )
    const result = spawnSync(
      process.execPath,
      ['--import', fetchMock, join(directory, 'scripts/cloudflare.mjs'), 'affiliate', mode],
      {
        encoding: 'utf8',
        env: {
          PATH: `${directory}:${process.env.PATH}`,
          WORKERS_CI: '1',
          WORKERS_CI_BRANCH: mode === 'deploy' ? 'main' : 'feature/auth',
          DOPPLER_TOKEN_PREVIEW: 'sample-preview',
          DOPPLER_TOKEN_PRODUCTION: 'sample-prod',
          CLOUDFLARE_API_TOKEN: 'sample-cloudflare',
          WORKOS_API_KEY: 'sample-workos',
          TEST_USER_PASSWORD: 'sample-test-password',
          CONVEX_DEPLOYMENT: 'prod:shared',
          VITE_CONVEX_URL: fixture.VITE_CONVEX_URL,
          VITE_CONVEX_SITE_URL: fixture.VITE_CONVEX_SITE_URL,
          WAVERLY_TEST_LOG: log,
          WAVERLY_TEST_FAILURE: failure ?? '',
        },
      },
    )
    const commands = (await readFile(log, 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
    await Promise.all(
      commands
        .filter((command) => command.temporaryFile)
        .map((command) => assert.rejects(access(command.temporaryFile), { code: 'ENOENT' })),
    )
    return { result, commands }
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}

test('preview entry point deploys and seeds Convex before building and uploading one Worker version', async () => {
  const { result, commands } = await exerciseDeployment('preview')
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(
    commands.map((command) => command.stage),
    ['convex-deploy', 'convex-run', 'build', 'worker'],
  )
  for (const command of commands.slice(0, 2)) {
    assert.deepEqual(command.credentialNames, ['CONVEX_DEPLOY_KEY'])
    assert.equal(command.url, undefined)
    assert.equal(command.site, undefined)
  }
  assert.equal(
    commands[0].args[commands[0].args.indexOf('--cmd') + 1],
    'node ../../scripts/cloudflare-convex.mjs capture',
  )
  assert.deepEqual(commands[2].credentialNames, [])
  assert.equal(commands[2].url, 'https://isolated-preview.convex.cloud')
  assert.equal(commands[2].site, 'https://isolated-preview.convex.site')
  assert.ok(commands[3].args.includes('versions'))
  assert.ok(!commands[3].args.includes('deploy'))
  assert.deepEqual(commands[3].runtimeKeys.sort(), [
    'WORKOS_API_KEY',
    'WORKOS_CLIENT_ID',
    'WORKOS_COOKIE_PASSWORD',
    'WORKOS_REDIRECT_URI',
  ])
})

test('Convex deployment or seeding failure prevents frontend build and Worker upload', async () => {
  await Promise.all(
    ['convex-deploy', 'convex-run'].map(async (failure) => {
      const { result, commands } = await exerciseDeployment('preview', failure)
      assert.equal(result.status, 1)
      assert.ok(commands.every((command) => command.stage.startsWith('convex-')))
    }),
  )
})

test('production keeps its configured backend and never provisions or seeds Convex', async () => {
  const { result, commands } = await exerciseDeployment('deploy')
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(
    commands.map((command) => command.stage),
    ['build', 'worker'],
  )
  assert.deepEqual(commands[0].credentialNames, [])
  assert.equal(commands[0].url, 'https://shared-backend.convex.cloud')
  assert.ok(commands[1].args.includes('deploy'))
  assert.equal(
    commands[1].callback,
    'https://waverly-affiliate.waverly-d46.workers.dev/api/auth/callback',
  )
})

test('Convex previews reuse one isolated deployment per branch and seed it', () => {
  const key = 'preview:sample-team:sample-project|sample-key'
  const args = previewDeployArgs('feature/auth', key)
  assert.equal(args[args.indexOf('--preview-name') + 1], convexPreviewName('feature/auth'))
  assert.equal(args[args.indexOf('--preview-run') + 1], 'previewSeed')
  assert.ok(!args.includes('--preview-create'))
  assert.ok(!args.includes('--prod'))
  assert.ok(!args.includes(key))
  assert.deepEqual(previewSeedArgs('feature/auth', key), [
    'node_modules/convex/bin/main.js',
    'run',
    '--preview-name',
    convexPreviewName('feature/auth'),
    'previewSeed',
  ])
  assert.notEqual(convexPreviewName('feature/auth'), convexPreviewName('feature-auth'))
  assert.ok(convexPreviewName('feature/' + 'a'.repeat(200)).length <= 100)
  assert.throws(() => previewDeployArgs('main', key))
  assert.throws(() => previewDeployArgs(undefined, key))
})

test('production, dev, individual-deployment and malformed Convex keys cannot provision previews', () => {
  for (const key of [
    undefined,
    '',
    'prod:deployment|key',
    'dev:deployment|key',
    'preview:deployment|key',
    'project:team:project|key',
    'preview:team:project|',
    'preview:team:project|key with spaces',
  ]) {
    assert.throws(() => previewDeployArgs('feature/auth', key), /project preview deploy key/)
  }
})

test('only a matching Convex preview cloud/site URL pair reaches the frontend', () => {
  const urls = {
    VITE_CONVEX_URL: 'https://new-preview-123.convex.cloud',
    VITE_CONVEX_SITE_URL: 'https://new-preview-123.convex.site',
  }
  assert.deepEqual(previewBuildUrls({ ...urls, CONVEX_DEPLOY_KEY: 'never' }), urls)
  for (const invalid of [
    {},
    { ...urls, VITE_CONVEX_URL: 'http://localhost:3210' },
    { ...urls, VITE_CONVEX_SITE_URL: 'https://different.convex.site' },
    { ...urls, VITE_CONVEX_URL: 'https://new-preview-123.convex.cloud.evil.example' },
    { ...urls, VITE_CONVEX_URL: 'https://user:password@new-preview-123.convex.cloud' },
  ])
    assert.throws(() => previewBuildUrls(invalid))
})

test('build subprocesses do not receive deployment credentials or shared preview URLs', () => {
  const env = buildEnvironment(
    {
      PATH: '/usr/bin',
      CONVEX_DEPLOY_KEY: 'never',
      CONVEX_PREVIEW_DEPLOY_KEY: 'never',
      CONVEX_DEPLOYMENT: 'prod:shared',
      DOPPLER_TOKEN_PREVIEW: 'never',
      CLOUDFLARE_API_TOKEN: 'never',
      WORKOS_API_KEY: 'never',
      TEST_USER_PASSWORD: 'never',
      WAVERLY_CONVEX_PREVIEW_URL_FILE: '/temporary',
      VITE_CONVEX_URL: 'https://shared.convex.cloud',
    },
    { VITE_CONVEX_URL: 'https://isolated.convex.cloud' },
  )
  assert.deepEqual(env, { PATH: '/usr/bin', VITE_CONVEX_URL: 'https://isolated.convex.cloud' })
})

test('Cloudflare branch metadata controls preview aliases and production guards', () => {
  const branch = buildBranch({
    WORKERS_CI: '1',
    WORKERS_CI_BRANCH: 'feature/auth',
  })
  assert.equal(branch, 'feature/auth')
  assert.equal(
    deployArgs('preview', 'affiliate', branch)[3],
    previewAlias(branch, 'waverly-affiliate'),
  )
  assert.throws(() => deployArgs('deploy', 'affiliate', branch), /only allowed from main/)
  assert.deepEqual(
    deployArgs('deploy', 'affiliate', buildBranch({ WORKERS_CI: '1', WORKERS_CI_BRANCH: 'main' })),
    ['deploy'],
  )
  assert.throws(() => buildBranch({ WORKERS_CI: '1' }), /WORKERS_CI_BRANCH is required/)
  assert.equal(buildBranch({}), undefined)
})

test('the deployment entry point fails closed when Cloudflare branch metadata is missing', () => {
  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('./cloudflare.mjs', import.meta.url)), 'affiliate', 'deploy'],
    { env: { WORKERS_CI: '1' }, encoding: 'utf8' },
  )
  assert.equal(result.status, 1)
  assert.match(result.stderr, /WORKERS_CI_BRANCH is required/)
  assert.doesNotMatch(result.stderr, /DOPPLER_TOKEN/)
})

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
