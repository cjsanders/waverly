import { createHash } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'

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
const requiredKeys = [...runtimeKeys.slice(0, 4), 'VITE_CONVEX_URL']

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
  url.searchParams.set('secrets', [...runtimeKeys, ...buildKeys].join(','))
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`Doppler download failed (HTTP ${response.status})`)
  const secrets = await response.json()
  const missing = requiredKeys.filter((key) => !secrets[key])
  if (missing.length) throw new Error(`Missing Doppler values: ${missing.join(', ')}`)
  if (secrets.WORKOS_COOKIE_PASSWORD.length < 32)
    throw new Error('WORKOS_COOKIE_PASSWORD must contain at least 32 characters')
  for (const key of ['VITE_CONVEX_URL', 'WORKOS_REDIRECT_URI']) {
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
  const branch = process.env.CF_BUILD_BRANCH
  const args = deployArgs(mode, app, branch)
  const cwd = join(root, 'apps', app)
  const secrets = app === 'affiliate' ? await downloadSecrets(mode) : {}
  const env = { ...process.env, ...selectSecrets(secrets, buildKeys) }
  // Keep deployment credentials and server secrets out of the build process.
  for (const key of Object.keys(env)) {
    if (
      key.startsWith('DOPPLER_') ||
      key.startsWith('CLOUDFLARE_') ||
      runtimeKeys.includes(key) ||
      key.startsWith('TEST_USER_')
    )
      delete env[key]
  }
  run('bun', ['run', 'build'], cwd, env)
  let temporary
  try {
    if (app === 'affiliate') {
      temporary = await mkdtemp(join(tmpdir(), 'waverly-secrets-'))
      const path = join(temporary, 'secrets.json')
      await writeFile(path, JSON.stringify(selectSecrets(secrets, runtimeKeys)), { mode: 0o600 })
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
