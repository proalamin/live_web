import { useEffect, useRef, useCallback } from 'react'
import Hls from 'hls.js'
import { buildHlsConfig, detectStreamType } from '../utils/streamUtils'

/**
 * useHlsPlayer
 *
 * Manages a single HLS.js instance bound to a <video> element.
 *
 * @param {React.RefObject} videoRef   - ref to the <video> DOM element
 * @param {string|null}     src        - the stream URL to load
 * @param {object}          options
 *   @param {function}  options.onError     - called with (event, data) on HLS error
 *   @param {function}  options.onManifest  - called when manifest is parsed
 *   @param {function}  options.onPlaying   - called when playback starts
 *
 * @returns {{ hlsRef, isHlsSupported, loadSrc }}
 */
export function useHlsPlayer(videoRef, src, { onError, onManifest, onPlaying } = {}) {
  const hlsRef = useRef(null)
  const isHlsSupported = Hls.isSupported()

  const destroyHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
  }, [])

  const loadSrc = useCallback((url) => {
    const video = videoRef.current
    if (!video || !url) return

    destroyHls()

    const type = detectStreamType(url)

    // Safari / iOS: use native HLS if HLS.js not supported
    if (!Hls.isSupported()) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url
        video.play().catch(() => {})
      }
      return
    }

    const hls = new Hls(buildHlsConfig())
    hlsRef.current = hls

    hls.loadSource(url)
    hls.attachMedia(video)

    hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
      video.play().catch(() => {})
      onManifest?.(_event, data)
    })

    hls.on(Hls.Events.ERROR, (event, data) => {
      onError?.(event, data)
    })

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
      onPlaying?.()
    })
  }, [videoRef, destroyHls, onError, onManifest, onPlaying])

  // Load whenever src changes
  useEffect(() => {
    if (src) {
      loadSrc(src)
    } else {
      // Clear player when no source is selected
      destroyHls()
      if (videoRef.current) {
        videoRef.current.src = ''
      }
    }
    return () => {
      destroyHls()
    }
  }, [src, loadSrc, destroyHls, videoRef])

  return { hlsRef, isHlsSupported, loadSrc }
}
