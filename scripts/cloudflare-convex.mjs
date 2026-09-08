import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function convexPreviewName(branch) {
  if (!branch || branch === 'main') throw new Error('Convex previews require a non-main branch')
  const slug = branch
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const hash = createHash('sha256').update(branch).digest('hex').slice(0, 12)
  return `waverly-affiliate-${slug.slice(0, 60)}-${hash}`
}

export function previewDeployArgs(branch, key) {
  // Project preview keys can create previews but cannot deploy to production.
  // A key for a single existing deployment has a different, two-part prefix.
  if (typeof key !== 'string' || !/^preview:[^:|\s]+:[^:|\s]+\|[^\s|]+$/.test(key)) {
    throw new Error('CONVEX_PREVIEW_DEPLOY_KEY must be a project preview deploy key')
  }
  return [
    'node_modules/convex/bin/main.js',
    'deploy',
    '--preview-name',
    convexPreviewName(branch),
    '--preview-run',
    'previewSeed',
    '--typecheck',
    'enable',
    '--cmd',
    'node ../../scripts/cloudflare-convex.mjs capture',
    '--cmd-url-env-var-name',
    'VITE_CONVEX_URL',
  ]
}

export function previewSeedArgs(branch, key) {
  previewDeployArgs(branch, key)
  return [
    'node_modules/convex/bin/main.js',
    'run',
    '--preview-name',
    convexPreviewName(branch),
    'previewSeed',
  ]
}

export function previewBuildUrls(env) {
  const result = {}
  const hosts = []
  for (const [key, suffix] of [
    ['VITE_CONVEX_URL', '.convex.cloud'],
    ['VITE_CONVEX_SITE_URL', '.convex.site'],
  ]) {
    let url
    try {
      url = new URL(env[key])
    } catch {
      throw new Error(`Convex did not provide a valid ${key}`)
    }
    if (
      url.protocol !== 'https:' ||
      !url.hostname.endsWith(suffix) ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error(`Unexpected Convex preview URL for ${key}`)
    }
    hosts.push(url.hostname.slice(0, -suffix.length))
    result[key] = url.origin
  }
  if (hosts[0] !== hosts[1] || !/^[a-z0-9-]+$/.test(hosts[0])) {
    throw new Error('Convex preview URLs must refer to the same deployment')
  }
  return result
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (
      process.argv[2] !== 'capture' ||
      process.argv.length !== 3 ||
      !process.env.WAVERLY_CONVEX_PREVIEW_URL_FILE
    ) {
      throw new Error('This helper is only called by the Convex preview deployment command')
    }
    await writeFile(
      process.env.WAVERLY_CONVEX_PREVIEW_URL_FILE,
      JSON.stringify(previewBuildUrls(process.env)),
      { mode: 0o600, flag: 'wx' },
    )
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
