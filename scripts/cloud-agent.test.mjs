import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const environment = JSON.parse(
  await readFile(new URL('../.cursor/environment.json', import.meta.url), 'utf8'),
)
const installScript = await readFile(new URL('./cloud-agent-install.sh', import.meta.url), 'utf8')
const runner = fileURLToPath(new URL('./cloud-agent-dev.sh', import.meta.url))

const terminal = (name) => environment.terminals.find((entry) => entry.name === name)

test('Cloud Agent install installs Doppler and keeps the credential-free affiliate setup', () => {
  assert.equal(environment.install, 'bash scripts/cloud-agent-install.sh')
  assert.match(installScript, /cli\.doppler\.com\/install\.sh/)
  assert.match(installScript, /DOPPLER_TOKEN_WEBSITE/)
  assert.match(installScript, /DOPPLER_TOKEN_DOCS/)
  assert.match(installScript, /DOPPLER_TOKEN_AFFILIATE/)
  assert.match(installScript, /configure set token --scope .* --silent/)
  assert.match(installScript, /bun run setup:agent/)
})

test('Cloud Agent website and docs terminals load Doppler without portless', () => {
  for (const app of ['website', 'docs']) {
    const { command } = terminal(app)
    assert.match(command, new RegExp(`cloud-agent-dev\\.sh ${app} --`))
    assert.match(command, /astro dev --host --port/)
    assert.doesNotMatch(command, /portless|bun run dev:agent/)
  }
})

test('Cloud Agent affiliate terminal stays on the isolated stack', () => {
  const { command } = terminal('affiliate')
  assert.match(command, /bun run dev:agent/)
  assert.doesNotMatch(command, /doppler|cloud-agent-dev/)
})

test('cloud-agent-dev injects the matching Doppler token and ignores a generic DOPPLER_TOKEN', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'waverly-cloud-agent-'))
  const record = join(directory, 'doppler.json')
  await writeFile(
    join(directory, 'doppler'),
    `#!/usr/bin/env python3
import json, os, sys
json.dump({"token": os.environ.get("DOPPLER_TOKEN"), "argv": sys.argv[1:]}, open(os.environ["WAVERLY_DOPPLER_RECORD"], "w"))
if sys.argv[1:3] == ["run", "--"]:
    os.execvp(sys.argv[3], sys.argv[3:])
raise SystemExit("unexpected doppler argv")
`,
  )
  await chmod(join(directory, 'doppler'), 0o755)

  const result = spawnSync(runner, ['docs', '--', 'python3', '-c', 'print("ok")'], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${directory}:${process.env.PATH}`,
      WAVERLY_DOPPLER_RECORD: record,
      DOPPLER_TOKEN: 'generic-should-not-win',
      DOPPLER_TOKEN_DOCS: 'docs-dev-token',
      DOPPLER_TOKEN_WEBSITE: 'website-dev-token',
    },
  })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), 'ok')
  const recorded = JSON.parse(await readFile(record, 'utf8'))
  assert.deepEqual(recorded.argv, ['run', '--', 'python3', '-c', 'print("ok")'])
  assert.equal(recorded.token, 'docs-dev-token')
})

test('cloud-agent-dev runs the command directly when no per-app token is set', () => {
  const result = spawnSync(runner, ['website', '--', 'python3', '-c', 'print("passthrough")'], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `/usr/bin:/bin:${process.env.HOME}/.bun/bin`,
      DOPPLER_TOKEN_WEBSITE: '',
    },
  })
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout.trim(), 'passthrough')
})
