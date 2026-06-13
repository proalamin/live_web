/**
 * Detects the stream type from a URL.
 * Returns 'hls' for .m3u8 streams (including PHP-served ones),
 * 'ts'  for raw .ts segment URLs,
 * 'hls' as default fallback (HLS.js handles both gracefully).
 */
export function detectStreamType(url) {
  if (!url) return 'hls'
  const lower = url.toLowerCase().split('?')[0] // strip query params
  if (lower.endsWith('.m3u8')) return 'hls'
  if (lower.endsWith('.ts'))   return 'ts'
  // PHP-served m3u8 (e.g. /index.php/ChannelName/video.m3u8)
  if (lower.includes('video.m3u8') || lower.includes('.m3u8')) return 'hls'
  return 'hls' // default — HLS.js will attempt and error-switch if wrong
}

/**
 * Returns true if HLS.js can play this URL natively in the current browser.
 * Falls back to native <video> only when HLS.js itself won't work (rare).
 */
export function canUseNativeHls() {
  const video = document.createElement('video')
  return video.canPlayType('application/vnd.apple.mpegurl') !== ''
}

/**
 * Returns a tuned HLS.js config object.
 * Key settings for low-latency live stream reliability:
 *  - maxBufferLength / maxMaxBufferLength: keep it lean so stalls surface fast
 *  - levelLoadingTimeOut / fragLoadingTimeOut: fail fast, don't wait 20s
 *  - enableWorker: off to avoid SharedArrayBuffer CORS requirements
 */
export function buildHlsConfig(overrides = {}) {
  return {
    enableWorker: false,          // avoids COOP/COEP header requirements
    lowLatencyMode: false,        // standard live, not LL-HLS
    backBufferLength: 30,
    maxBufferLength: 20,          // seconds of forward buffer
    maxMaxBufferLength: 60,
    startLevel: -1,               // auto quality selection
    autoStartLoad: true,
    // Fail fragments quickly so we switch sources sooner
    fragLoadingTimeOut: 8000,     // 8s per fragment
    manifestLoadingTimeOut: 8000,
    levelLoadingTimeOut: 8000,
    fragLoadingMaxRetry: 2,
    manifestLoadingMaxRetry: 2,
    levelLoadingMaxRetry: 2,
    // Stall detection: HLS.js declares a stall after nudgeCount * nudgeOffset seconds
    nudgeMaxRetry: 3,
    ...overrides,
  }
}

/**
 * Formats a UTC ISO date string into a human-readable local time.
 * e.g. "2026-06-15T18:00:00Z" → "Jun 15 · 18:00 UTC"
 */
export function formatKickoff(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day:   'numeric',
    hour:  '2-digit',
    minute:'2-digit',
    timeZoneName: 'short',
  })
}

/**
 * Quality label → short badge string
 */
// In dev, Vite serves a CORS proxy at /proxy/<encoded-url>.
// In production, set VITE_PROXY_BASE to your Cloudflare Worker URL.
const PROXY_BASE = import.meta.env.VITE_PROXY_BASE
  ?? (import.meta.env.DEV ? '/proxy' : '')

export function toProxiedUrl(url) {
  if (!url || url.startsWith('https://') || !PROXY_BASE) return url
  return `${PROXY_BASE}/${encodeURIComponent(url)}`
}

export const QUALITY_COLORS = {
  '4K':    'bg-yellow-500 text-black',
  '1080p': 'bg-yellow-500 text-black',
  '720p':  'bg-blue-500 text-white',
  'SD':    'bg-slate-500 text-white',
  '480p':  'bg-slate-500 text-white',
}
