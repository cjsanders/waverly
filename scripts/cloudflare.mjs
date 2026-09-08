import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { previewBuildUrls, previewDeployArgs, previewSeedArgs } from './cloudflare-convex.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const apps = new Set(['affiliate', 'website', 'docs'])
const runtimeKeys = [
  'WORKOS_CLIENT_ID',
  'WORKOS_API_KEY',
  'WORKOS_COOKIE_PASSWORD',
  'WORKOS_REDIRECT_URI',
  'WORKOS_API_HOSTNAME',
  'TINYBIRD_API_URL',
  'TINYBIRD_PIPE_READ_TOKEN',
]
const buildKeys = ['VITE_CONVEX_URL', 'VITE_CONVEX_SITE_URL']
const convexPreviewKey = 'CONVEX_PREVIEW_DEPLOY_KEY'

export function buildEnvironment(env, publicValues = {}) {
  const selected = { ...env, ...selectSecrets(publicValues, buildKeys) }
  for (const key of Object.keys(selected)) {
    if (
      /^(DOPPLER_|CLOUDFLARE_|CONVEX_|TEST_USER_|WAVERLY_CONVEX_)/.test(key) ||
      runtimeKeys.includes(key)
    ) {
      delete selected[key]
    }
  }
  return selected
}

export function buildBranch(env = process.env) {
  const branch = env.WORKERS_CI_BRANCH
  if (env.WORKERS_CI && !branch) {
    throw new Error('WORKERS_CI_BRANCH is required in Cloudflare Builds')
  }
  return branch
}

export function previewAlias(branch, worker) {
  const hash = createHash('sha256').update(branch).digest('hex').slice(0, 8)
  const slug = branch
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `branch-${slug.slice(0, 63 - worker.length - 17)}-${hash}`
}

export function selectSecrets(secrets, keys) {
  return Object.fromEntries(
    keys
      .filter((key) => typeof secrets[key] === 'string' && secrets[key] !== '')
      .map((key) => [key, secrets[key]]),
  )
}

export function workerSecrets(secrets, mode, branch) {
  const selected = selectSecrets(secrets, runtimeKeys)
  if (mode === 'preview') {
    const alias = previewAlias(branch || 'manual', 'waverly-affiliate')
    selected.WORKOS_REDIRECT_URI = `https://${alias}-waverly-affiliate.waverly-d46.workers.dev/api/auth/callback`
  }
  return selected
}

export function deployArgs(mode, app, branch) {
  if (!apps.has(app)) throw new Error('App must be affiliate, website, or docs')
  if (!['deploy', 'preview'].includes(mode)) throw new Error('Mode must be deploy or preview')
  if (mode === 'deploy' && branch && branch !== 'main') {
    throw new Error('Production deployment is only allowed from main')
  }
  return mode === 'preview'
    ? ['versions', 'upload', '--preview-alias', previewAlias(branch || 'manual', `waverly-${app}`)]
    : ['deploy']
}

async function downloadSecrets(mode) {
  const token =
    mode === 'preview' ? process.env.DOPPLER_TOKEN_PREVIEW : process.env.DOPPLER_TOKEN_PRODUCTION
  if (!token)
    throw new Error(
      `Set DOPPLER_TOKEN_${mode === 'preview' ? 'PREVIEW' : 'PRODUCTION'} in Cloudflare Build secrets`,
    )
  const url = new URL('https://api.doppler.com/v3/configs/config/secrets/download')
  url.searchParams.set('format', 'json')
  const configKeys = mode === 'preview' ? [convexPreviewKey] : buildKeys
  url.searchParams.set('secrets', [...runtimeKeys, ...configKeys].join(','))
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`Doppler download failed (HTTP ${response.status})`)
  const secrets = await response.json()
  const requiredKeys = [
    ...runtimeKeys.slice(0, 4),
    mode === 'preview' ? convexPreviewKey : 'VITE_CONVEX_URL',
  ]
  const missing = requiredKeys.filter((key) => !secrets[key])
  if (missing.length) throw new Error(`Missing Doppler values: ${missing.join(', ')}`)
  if (secrets.WORKOS_COOKIE_PASSWORD.length < 32)
    throw new Error('WORKOS_COOKIE_PASSWORD must contain at least 32 characters')
  for (const key of mode === 'preview'
    ? ['WORKOS_REDIRECT_URI']
    : ['VITE_CONVEX_URL', 'WORKOS_REDIRECT_URI']) {
    const urlValue = new URL(secrets[key])
    if (urlValue.protocol !== 'https:' || urlValue.hostname.endsWith('.localhost')) {
      throw new Error(`${key} must use a deployed HTTPS URL`)
    }
  }
  return secrets
}

function run(command, args, cwd, env = process.env) {
  const child = spawnSync(command, args, { cwd, env, stdio: 'inherit' })
  if (child.error) throw child.error
  if (child.status !== 0) throw new Error(`${command} ${args[0]} failed (exit ${child.status})`)
}

async function main() {
  const [app, mode, ...extra] = process.argv.slice(2)
  if (extra.length)
    throw new Error('Usage: node scripts/cloudflare.mjs <affiliate|website|docs> <deploy|preview>')
  const branch = buildBranch()
  const args = deployArgs(mode, app, branch)
  const cwd = join(root, 'apps', app)
  const secrets = app === 'affiliate' ? await downloadSecrets(mode) : {}
  let temporary
  try {
    let publicValues = selectSecrets(secrets, buildKeys)
    if (app === 'affiliate') {
      temporary = await mkdtemp(join(tmpdir(), 'waverly-secrets-'))
      if (mode === 'preview') {
        const convexArgs = previewDeployArgs(branch, secrets[convexPreviewKey])
        const urlFile = join(temporary, 'preview-urls.json')
        const convexEnv = buildEnvironment(process.env)
        // No shared backend URL may survive into preview provisioning or bundling.
        for (const key of buildKeys) delete convexEnv[key]
        convexEnv.CONVEX_DEPLOY_KEY = secrets[convexPreviewKey]
        convexEnv.WAVERLY_CONVEX_PREVIEW_URL_FILE = urlFile
        // Invoke Convex directly: bunx in the CI Bun version splits --cmd's
        // whitespace-containing value into extra positional arguments.
        run(process.execPath, convexArgs, cwd, convexEnv)
        // --preview-run only runs on creation. Retry the idempotent seed to recover
        // a preview whose earlier build provisioned the database but failed seeding.
        run(process.execPath, previewSeedArgs(branch, secrets[convexPreviewKey]), cwd, convexEnv)
        publicValues = previewBuildUrls(JSON.parse(await readFile(urlFile, 'utf8')))
      }
    }
    // Convex code and seed must succeed before building/uploading a Worker version.
    run('bun', ['run', 'build'], cwd, buildEnvironment(process.env, publicValues))
    if (app === 'affiliate') {
      const path = join(temporary, 'secrets.json')
      await writeFile(path, JSON.stringify(workerSecrets(secrets, mode, branch)), { mode: 0o600 })
      args.push('--secrets-file', path)
    }
    run('bunx', ['--no-install', 'wrangler', ...args], cwd)
  } finally {
    if (temporary) await rm(temporary, { recursive: true, force: true })
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
