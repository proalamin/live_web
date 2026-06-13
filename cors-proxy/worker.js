// Cloudflare Worker — FIFA 2026 CORS Proxy
// Deploy: cd cors-proxy && npx wrangler deploy
// Then set VITE_PROXY_BASE=https://your-worker.workers.dev in Vercel/Amplify env vars

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        },
      })
    }

    const url = new URL(request.url)
    const targetUrl = decodeURIComponent(url.pathname.slice(1))

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      return new Response('Missing or invalid target URL', { status: 400 })
    }

    try {
      const upstream = await fetch(targetUrl, {
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })

      const ct = upstream.headers.get('content-type') ?? ''
      const isM3u8 = ct.includes('mpegurl') || targetUrl.includes('.m3u8')

      if (isM3u8) {
        const text = await upstream.text()
        const workerBase = `${url.protocol}//${url.host}`
        const rewritten = text.split('\n').map(line => {
          const t = line.trim()
          if (!t || t.startsWith('#')) return line
          try {
            const abs = new URL(t, targetUrl).href
            return `${workerBase}/${encodeURIComponent(abs)}`
          } catch {
            return line
          }
        }).join('\n')

        return new Response(rewritten, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.apple.mpegurl',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
          },
        })
      }

      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          'Content-Type': ct || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      })
    } catch (e) {
      return new Response(`Proxy error: ${e.message}`, { status: 502 })
    }
  },
}
