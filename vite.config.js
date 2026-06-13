import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react(), corsProxyPlugin()],
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'hls':   ['hls.js'],
          'react': ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 800,
  },
})

// Dev-only CORS proxy at /proxy/<encoded-url>
// Fetches the target, rewrites m3u8 segment URLs to also go through proxy,
// and adds Access-Control-Allow-Origin: * so HLS.js can load the stream.
function corsProxyPlugin() {
  return {
    name: 'cors-proxy',
    configureServer(server) {
      server.middlewares.use('/proxy', async (req, res) => {
        const targetUrl = decodeURIComponent(req.url.slice(1))

        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
          res.writeHead(400)
          res.end('Bad target URL')
          return
        }

        try {
          const upstream = await fetch(targetUrl, {
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0' },
          })

          const ct = upstream.headers.get('content-type') ?? ''
          const isM3u8 = ct.includes('mpegurl') || targetUrl.includes('.m3u8')

          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Cache-Control', 'no-cache')

          if (isM3u8) {
            const text = await upstream.text()
            // Rewrite every non-comment line (segment/chunklist URL) to go through this proxy
            const rewritten = text.split('\n').map(line => {
              const t = line.trim()
              if (!t || t.startsWith('#')) return line
              try {
                const abs = new URL(t, targetUrl).href
                return `/proxy/${encodeURIComponent(abs)}`
              } catch {
                return line
              }
            }).join('\n')

            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl')
            res.writeHead(200)
            res.end(rewritten)
          } else {
            res.setHeader('Content-Type', ct || 'application/octet-stream')
            res.writeHead(upstream.status)
            const buf = await upstream.arrayBuffer()
            res.end(Buffer.from(buf))
          }
        } catch (e) {
          res.writeHead(502)
          res.end(`Proxy error: ${e.message}`)
        }
      })
    },
  }
}
