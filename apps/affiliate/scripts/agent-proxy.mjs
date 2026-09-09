import http from 'node:http'

import httpProxy from 'http-proxy'

const host = '0.0.0.0'
const port = Number(process.env.PORT ?? 5173)
const appTarget = `http://127.0.0.1:${process.env.AGENT_APP_PORT ?? '5174'}`
const convexTarget = process.env.VITE_CONVEX_URL ?? 'http://127.0.0.1:3210'

const appProxy = httpProxy.createProxyServer({ target: appTarget, ws: true, xfwd: true })
const convexProxy = httpProxy.createProxyServer({
  target: convexTarget,
  ws: true,
  xfwd: true,
  changeOrigin: true,
})

function proxyFor(url) {
  const pathname = new URL(url ?? '/', 'http://localhost').pathname
  return pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') ? convexProxy : appProxy
}

function handleProxyError(error, _req, res) {
  console.error(`[agent-proxy] ${error.message}`)
  if (res instanceof http.ServerResponse && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' })
    res.end('Local backend unavailable')
  }
}

appProxy.on('error', handleProxyError)
convexProxy.on('error', handleProxyError)

const server = http.createServer((req, res) => proxyFor(req.url).web(req, res))
server.on('upgrade', (req, socket, head) => proxyFor(req.url).ws(req, socket, head))
server.listen(port, host, () => {
  console.log(`[agent-proxy] Listening on http://${host}:${port}`)
})
