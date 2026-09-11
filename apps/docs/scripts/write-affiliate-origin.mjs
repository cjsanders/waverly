import { previewAlias } from '../../../scripts/cloudflare.mjs'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

if (!process.env.WORKERS_CI && !process.env.WORKERS_CI_BRANCH) process.exit(0)

const workersDev = 'waverly-d46.workers.dev'

function affiliateOrigin() {
  const branch = process.env.WORKERS_CI_BRANCH
  if (branch && branch !== 'main') {
    return `https://${previewAlias(branch, 'waverly-affiliate')}-waverly-affiliate.${workersDev}`
  }
  return `https://waverly-affiliate.${workersDev}`
}

const origin = affiliateOrigin()
const out = join(
  dirname(fileURLToPath(import.meta.url)),
  '../src/lib/affiliate-origin.generated.ts',
)
writeFileSync(out, `export const BUILD_AFFILIATE_ORIGIN = ${JSON.stringify(origin)}\n`)
