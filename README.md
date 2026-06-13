# FIFA 2026 Live Stream Viewer

A clean, fast React app for watching FIFA World Cup 2026 matches via HLS/IPTV streams.

## Tech stack

- Vite + React 18
- Tailwind CSS (dark pitch theme)
- HLS.js for adaptive stream playback
- Vercel for deployment

---

## Quick start

```bash
npm install
npm run dev       # http://localhost:3000
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Framework: **Vite**  |  Build command: `npm run build`  |  Output: `dist`
4. Deploy — done. Share the URL.

---

## Nightly stream update workflow

Every night before a match, edit **`src/streams.json`** only:

1. Open `src/streams.json`
2. Find the matching match object (or add a new one)
3. Replace / add sources under that match's `"sources": []` array
4. Set `"completed": true` for finished matches (they move to the bottom)
5. Commit and push → Vercel auto-deploys in ~30 seconds

### Minimum source entry

```json
{
  "id": "src-unique-id",
  "label": "T Sports HD",
  "quality": "720p",
  "url": "https://your-stream.example.com/stream/index.m3u8",
  "type": "hls"
}
```

`type` can be `"hls"` (for `.m3u8`) or `"ts"` (for direct `.ts` segments).  
Quality values with styled badges: `"1080p"`, `"720p"`, `"SD"`, `"480p"`.

---

## CORS & Mixed Content

### The problem

Some stream URLs are HTTP while Vercel serves your site on HTTPS.
Browsers block HTTP resources loaded from HTTPS pages ("mixed content").

### Solutions (pick one)

#### Option A — Self-hosted nginx CORS proxy (recommended for reliability)

Run a tiny nginx reverse proxy on any cheap VPS (e.g. $4/mo DigitalOcean droplet):

```nginx
server {
  listen 443 ssl;
  server_name proxy.yourdomain.com;
  # ... your SSL cert ...

  location /proxy/ {
    # Strip /proxy/ prefix, forward to real stream host
    rewrite ^/proxy/(.*)$ /$1 break;
    proxy_pass http://STREAM_HOST;
    proxy_set_header Host STREAM_HOST;
    add_header 'Access-Control-Allow-Origin' '*';
    add_header 'Access-Control-Allow-Methods' 'GET, OPTIONS';
  }
}
```

Then replace stream URLs in `streams.json` with `https://proxy.yourdomain.com/proxy/...`.

#### Option B — Use only HTTPS stream URLs

Many providers offer HTTPS versions. Prefer `https://` URLs when available.

#### Option C — Local-only access

Run `npm run dev` locally and access via `http://localhost:3000`.
No mixed-content issues since the page itself is HTTP.

---

## Auto-switch behaviour

The player automatically switches to the next source when:

| Trigger | Threshold |
|---|---|
| Stream stalls (time frozen) | 4 seconds |
| HLS fatal error | 1 second grace then switch |
| Native video error | Immediate |

Sources cycle round-robin. You can also manually switch from the **Sources** button in the player controls or by clicking a source in the sidebar.

---

## Project structure

```
src/
  streams.json          ← edit this nightly
  utils/
    streamUtils.js      ← type detection, HLS config, formatters
  hooks/
    useHlsPlayer.js     ← HLS.js lifecycle hook
    useAutoSwitch.js    ← stall/error detection & switch trigger
  components/
    Layout.jsx          ← sidebar + header grid
    SourceSidebar.jsx   ← match list + source list
    SourceItem.jsx      ← individual source button
    VideoPlayer.jsx     ← main player, orchestrates hooks + overlays
    PlayerControls.jsx  ← play/mute/volume/source/fullscreen bar
    BufferOverlay.jsx   ← spinner & switching toast
  App.jsx               ← root state: selected match + source index
  main.jsx
  index.css
```
