import { handleDocsRequest, type DocsAuthEnv } from './lib/docs-auth'

export interface Env extends DocsAuthEnv {
  ASSETS: { fetch: typeof fetch }
}

export default {
  fetch(request: Request, env: Env) {
    return handleDocsRequest(request, env, () => env.ASSETS.fetch(request))
  },
}
