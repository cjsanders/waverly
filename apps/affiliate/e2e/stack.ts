/**
 * Starts everything the end-to-end suite talks to, all on localhost so no container networking
 * or cloud credentials are involved:
 *
 * 1. the WorkOS emulator, seeded from `workos-emulate.config.yaml`
 * 2. a local Convex backend with the app's functions pushed to it and its auth config pointed at
 *    the emulator, so access tokens verify against the emulator's JWKS
 * 3. a production build of the app served by `vite preview`
 *
 * Playwright's global setup calls `startStack` and its global teardown calls `stopStack`.
 */
import { execFileSync, spawn, type ChildProcess } from 'node:child_process'
import {
  chmodSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { writeFile } from 'node:fs/promises'
import { arch, homedir, platform, tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const APP_URL = 'http://localhost:4173'

const WORKOS_PORT = 4100
const WORKOS_URL = `http://localhost:${WORKOS_PORT}`
const WORKOS_CLIENT_ID = 'client_e2e'
// The emulator accepts any bearer token as this key.
const WORKOS_API_KEY = 'sk_test_default'
const WORKOS_COOKIE_PASSWORD = 'e2e-only-cookie-password-not-a-secret-0123456789'
const E2E_TENANT_IDS = [
  'org_01E2E00000000000000000BRAND',
  'org_01E2E000000000000000CREATOR',
  'org_01E2E000000000000000OPERATOR',
]

const CONVEX_PORT = 3210
const CONVEX_SITE_PORT = 3211
const CONVEX_URL = `http://127.0.0.1:${CONVEX_PORT}`
const CONVEX_BACKEND_RELEASE = 'precompiled-2026-08-25-7cce8fb'
const CONVEX_INSTANCE_NAME = 'waverly-e2e'
// Test fixture, not a secret: the backend requires a 32-byte hex instance secret.
const CONVEX_INSTANCE_SECRET = '4361726e697461732c4c697465726174692c5265736f6e616e74652c4d6f7261'

const appDir = fileURLToPath(new URL('..', import.meta.url))
const repoDir = path.resolve(appDir, '..', '..')
const seedPath = path.join(appDir, 'e2e', 'workos-emulate.config.yaml')

type StackProcess = { name: string; child: ChildProcess; logPath: string }

const children: StackProcess[] = []
const logs: StackProcess[] = []
let workDir: string | undefined
let stopping = false

export async function startStack() {
  stopping = false
  workDir = mkdtempSync(path.join(tmpdir(), 'waverly-e2e-'))

  await startWorkosEmulator()
  await prepareConvexBackend()
  await buildApp()
  await serveApp()
}

export async function stopStack() {
  stopping = true
  await Promise.all(children.splice(0).map(({ child }) => terminate(child)))
  if (workDir) rmSync(workDir, { recursive: true, force: true })
}

/** Print captured service output when setup fails and keep it in the CI artifact directory. */
export function reportStackLogs() {
  for (const process of logs) printStackLog(process)
}

function terminate(child: ChildProcess) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve()
    }, 5_000)
    child.once('exit', () => {
      clearTimeout(timer)
      resolve()
    })
    child.kill('SIGTERM')
  })
}

async function startWorkosEmulator() {
  launch(
    'workos-emulate',
    bin('workos-emulate'),
    ['--port', String(WORKOS_PORT), '--seed', seedPath],
    {
      NO_UPDATE_NOTIFIER: '1',
      WORKOS_EMULATE_DISABLE_UPDATE_CHECK: '1',
    },
  )
  await waitForHttp(`${WORKOS_URL}/sso/jwks/${WORKOS_CLIENT_ID}`, 'WorkOS emulator')
}

async function prepareConvexBackend() {
  let lastError: unknown

  // The backend is disposable. Retry once from a fresh database if a runner has a transient
  // startup/schema failure instead of letting the Convex CLI retry a wedged process for 30+ min.
  /* oxlint-disable no-await-in-loop -- attempts must run serially because they share ports */
  for (let attempt = 1; attempt <= 2; attempt++) {
    let backend: StackProcess | undefined
    try {
      backend = await startConvexBackend(attempt)
      await waitForHttp(`${CONVEX_URL}/version`, 'Convex backend')
      await pushConvexFunctions()
      return
    } catch (error) {
      lastError = error
      console.error(`Convex setup attempt ${attempt}/2 failed: ${String(error)}`)
      if (backend) {
        await stopProcess(backend)
        printStackLog(backend)
      }
    }
  }
  /* oxlint-enable no-await-in-loop */

  throw new Error(`Convex backend setup failed after 2 attempts`, { cause: lastError })
}

async function startConvexBackend(attempt: number) {
  const binary = await ensureConvexBackendBinary()
  const dataDir = path.join(workDir!, `convex-${attempt}`)
  mkdirSync(dataDir)

  const backend = launch(
    `convex-local-backend-${attempt}`,
    binary,
    [
      '--port',
      String(CONVEX_PORT),
      '--site-proxy-port',
      String(CONVEX_SITE_PORT),
      '--instance-name',
      CONVEX_INSTANCE_NAME,
      '--instance-secret',
      CONVEX_INSTANCE_SECRET,
      '--local-storage',
      path.join(dataDir, 'storage'),
      '--disable-beacon',
      path.join(dataDir, 'db.sqlite3'),
    ],
    {},
  )
  return backend
}

async function pushConvexFunctions() {
  const adminKey = execFileSync(
    convexBackendBinaryPath(),
    [
      'keygen',
      'admin-key',
      '--instance-name',
      CONVEX_INSTANCE_NAME,
      '--instance-secret',
      CONVEX_INSTANCE_SECRET,
    ],
    { encoding: 'utf8' },
  ).trim()
  // The CLI refuses self-hosted variables alongside the CONVEX_DEPLOYMENT a developer keeps in
  // `.env.local`; an explicit env file overrides that.
  const envFile = path.join(workDir!, 'convex.env')
  writeFileSync(
    envFile,
    `CONVEX_SELF_HOSTED_URL=${CONVEX_URL}\nCONVEX_SELF_HOSTED_ADMIN_KEY=${adminKey}\n`,
  )
  const convex = (args: string[], timeoutMs?: number) =>
    run(bin('convex'), [...args, '--env-file', envFile], process.env, timeoutMs)

  await convex(['env', 'set', 'WORKOS_CLIENT_ID', WORKOS_CLIENT_ID])
  await convex(['env', 'set', 'WORKOS_API_URL', WORKOS_URL])
  // Keeps crons quiet during tests, per the Convex testing guide.
  await convex(['env', 'set', 'IS_TEST', 'true'])
  await convex(['deploy', '--yes'], 120_000)
  /* oxlint-disable no-await-in-loop -- seed mutations intentionally run in a stable order */
  for (const tenantId of E2E_TENANT_IDS) {
    await convex(['run', 'network:seed', JSON.stringify({ tenantId })])
  }
  /* oxlint-enable no-await-in-loop */
}

function appEnv() {
  return {
    ...process.env,
    // Selects the `env.e2e` block of wrangler.jsonc, whose vars point AuthKit at the emulator.
    CLOUDFLARE_ENV: 'e2e',
    VITE_CONVEX_URL: CONVEX_URL,
    WORKOS_CLIENT_ID,
    WORKOS_API_KEY,
    WORKOS_COOKIE_PASSWORD,
    WORKOS_REDIRECT_URI: `${APP_URL}/api/auth/callback`,
  }
}

async function buildApp() {
  await run(bin('vite'), ['build'], appEnv())
}

async function serveApp() {
  const url = new URL(APP_URL)
  launch(
    'vite-preview',
    bin('vite'),
    ['preview', '--host', url.hostname, '--port', url.port, '--strictPort'],
    appEnv(),
  )
  await waitForHttp(APP_URL, 'app preview server')
}

async function ensureConvexBackendBinary() {
  const binary = convexBackendBinaryPath()
  if (existsSync(binary)) return binary

  const target = convexBackendTarget()
  const asset = `convex-local-backend-${target}.zip`
  const url = `https://github.com/get-convex/convex-backend/releases/download/${CONVEX_BACKEND_RELEASE}/${asset}`
  const dir = path.dirname(binary)
  mkdirSync(dir, { recursive: true })

  console.log(`Downloading ${url}`)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download ${url}: ${response.status}`)
  const zipPath = path.join(dir, asset)
  await writeFile(zipPath, Buffer.from(await response.arrayBuffer()))
  execFileSync('unzip', ['-o', '-q', zipPath, '-d', dir])
  rmSync(zipPath)
  chmodSync(binary, 0o755)
  return binary
}

function convexBackendBinaryPath() {
  const cacheRoot = process.env.XDG_CACHE_HOME ?? path.join(homedir(), '.cache')
  return path.join(
    cacheRoot,
    'waverly',
    'convex-local-backend',
    CONVEX_BACKEND_RELEASE,
    'convex-local-backend',
  )
}

function convexBackendTarget() {
  const cpus: Partial<Record<string, string>> = { arm64: 'aarch64', x64: 'x86_64' }
  const oses: Partial<Record<string, string>> = {
    darwin: 'apple-darwin',
    linux: 'unknown-linux-gnu',
  }
  const cpu = cpus[arch()]
  const os = oses[platform()]
  if (!cpu || !os) throw new Error(`No Convex backend build for ${platform()}/${arch()}`)
  return `${cpu}-${os}`
}

/** Resolve a package bin from the app or, where bun hoisted it, the repo root. */
function bin(name: string) {
  for (const dir of [appDir, repoDir]) {
    const candidate = path.join(dir, 'node_modules', '.bin', name)
    if (existsSync(candidate)) return candidate
  }
  throw new Error(`Cannot find ${name} in node_modules/.bin; run bun install`)
}

function run(file: string, args: string[], env: NodeJS.ProcessEnv, timeoutMs = 600_000) {
  console.log(`$ ${path.basename(file)} ${args.join(' ')}`)
  const child = spawn(file, args, { cwd: appDir, env, stdio: 'inherit' })

  return new Promise<void>((resolve, reject) => {
    let timedOut = false
    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      setTimeout(() => child.kill('SIGKILL'), 5_000).unref()
    }, timeoutMs)

    child.once('error', (error) => {
      clearTimeout(timer)
      reject(error)
    })
    child.once('exit', (code, signal) => {
      clearTimeout(timer)
      if (timedOut) {
        reject(new Error(`${path.basename(file)} timed out after ${timeoutMs / 1_000}s`))
      } else if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${path.basename(file)} exited with ${signal ?? code}`))
      }
    })
  })
}

function launch(name: string, file: string, args: string[], env: NodeJS.ProcessEnv) {
  const logDir = process.env.CI
    ? path.join(appDir, 'test-results', 'e2e-stack')
    : path.join(workDir!, 'logs')
  mkdirSync(logDir, { recursive: true })
  const logPath = path.join(logDir, `${name}.log`)
  const log = createWriteStream(logPath)
  const child = spawn(file, args, {
    cwd: appDir,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout?.pipe(log)
  child.stderr?.pipe(log)
  child.on('exit', (code, signal) => {
    if (!stopping && code !== 0) {
      console.error(`${name} exited with ${signal ?? code}; see ${logPath}`)
    }
  })
  const stackProcess = { name, child, logPath }
  children.push(stackProcess)
  logs.push(stackProcess)
  return stackProcess
}

async function stopProcess(process: StackProcess) {
  const index = children.indexOf(process)
  if (index !== -1) children.splice(index, 1)
  await terminate(process.child)
}

function printStackLog(process: StackProcess) {
  if (!existsSync(process.logPath)) return
  const output = readFileSync(process.logPath, 'utf8').trim()
  if (!output) return
  const maxLength = 40_000
  const tail = output.length > maxLength ? output.slice(-maxLength) : output
  console.error(`\n--- ${process.name} (${process.logPath}) ---\n${tail}\n--- end ---`)
}

async function waitForHttp(url: string, label: string, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs
  let lastError: unknown
  // Polling is sequential by nature.
  /* oxlint-disable no-await-in-loop */
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url)
      if (response.ok) return
      lastError = new Error(`${response.status} ${response.statusText}`)
    } catch (error) {
      lastError = error
    }
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  /* oxlint-enable no-await-in-loop */
  throw new Error(`${label} did not become ready at ${url}: ${String(lastError)}`)
}
