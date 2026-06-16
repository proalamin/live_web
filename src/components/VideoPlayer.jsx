/**
 * VideoPlayer
 *
 * The central component. Owns the <video> element and coordinates:
 *   - useHlsPlayer  : HLS.js lifecycle (attach, detach, re-attach on source change)
 *   - useAutoSwitch : stall/error detection → calls onAutoSwitch
 *   - PlayerControls: play, mute, volume, source picker, fullscreen
 *   - BufferOverlay : spinner + switching toast
 *
 * CORS note: we cannot proxy streams server-side in this MVP.
 * Most IPTV stream providers add appropriate CORS headers or are
 * accessed directly (same HTTP context). Mixed-content (HTTP stream
 * on HTTPS page) requires either:
 *   a) Deploy to HTTP (not practical on Vercel)
 *   b) Use a CORS/SSL proxy (see README for the nginx option)
 *   c) Access the site over HTTP locally
 * For now we surface a clear error message when blocked.
 */
import { useRef, useState, useCallback, useEffect } from 'react'
import { useHlsPlayer } from '../hooks/useHlsPlayer'
import { useAutoSwitch } from '../hooks/useAutoSwitch'
import PlayerControls from './PlayerControls'
import BufferOverlay from './BufferOverlay'

export default function VideoPlayer({
  source,
  allSources,
  activeSourceIndex,
  onAutoSwitch,
  onManualSwitch,
}) {
  const videoRef    = useRef(null)
  const wrapperRef  = useRef(null)

  const [isPlaying,   setIsPlaying]   = useState(false)
  const [isMuted,     setIsMuted]     = useState(false)
  const [volume,      setVolume]      = useState(1)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
  const [switchReason,setSwitchReason]= useState(null)
  const [showControls,setShowControls]= useState(true)
  const [errorMsg,    setErrorMsg]    = useState(null)
  const [corsWarning, setCorsWarning] = useState(false)
  const controlsTimerRef = useRef(null)

  // ── HLS playback hook ──────────────────────────────────────────────
  const handleHlsError = useCallback((_event, data) => {
    if (!data.fatal) return
    // Detect CORS / network errors
    if (data.type === 'networkError') {
      const isCors = !source?.url?.startsWith('https')
      setCorsWarning(isCors)
      setErrorMsg(isCors
        ? 'Stream blocked (HTTP/CORS). See console for details.'
        : 'Network error loading stream.')
    }
  }, [source])

  const handleManifestParsed = useCallback(() => {
    setErrorMsg(null)
    setCorsWarning(false)
    setIsSwitching(false)
    setSwitchReason(null)
  }, [])

  const { hlsRef } = useHlsPlayer(
    videoRef,
    source?.url ?? null,
    {
      onError:    handleHlsError,
      onManifest: handleManifestParsed,
    }
  )

  // ── Auto-switch hook ───────────────────────────────────────────────
  const handleAutoSwitch = useCallback((reason) => {
    setIsSwitching(true)
    setSwitchReason(reason)
    onAutoSwitch(reason)
    // Clear switching state after 3s regardless (avoid stuck state)
    setTimeout(() => setIsSwitching(false), 3000)
  }, [onAutoSwitch])

  useAutoSwitch(videoRef, hlsRef, source?.url, handleAutoSwitch, {
    stallThreshold: 5000,
    fatalDelay:     1000,
    enabled:        isPlaying,
  })

  // ── Video element event listeners ──────────────────────────────────
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay    = () => setIsPlaying(true)
    const onPause   = () => setIsPlaying(false)
    const onWaiting = () => setIsBuffering(true)
    const onPlaying = () => { setIsBuffering(false); setIsPlaying(true) }
    const onCanPlay = () => setIsBuffering(false)

    video.addEventListener('play',    onPlay)
    video.addEventListener('pause',   onPause)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('canplay', onCanPlay)

    return () => {
      video.removeEventListener('play',    onPlay)
      video.removeEventListener('pause',   onPause)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('canplay', onCanPlay)
    }
  }, [])

  // ── Auto-hide controls ─────────────────────────────────────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true)
    clearTimeout(controlsTimerRef.current)
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000)
    }
  }, [isPlaying])

  useEffect(() => {
    if (!isPlaying) setShowControls(true)
    else resetControlsTimer()
    return () => clearTimeout(controlsTimerRef.current)
  }, [isPlaying, resetControlsTimer])

  // ── Controls ───────────────────────────────────────────────────────
  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.paused ? video.play().catch(() => {}) : video.pause()
  }, [])

  const handleToggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  const handleVolumeChange = useCallback((val) => {
    const video = videoRef.current
    if (!video) return
    video.volume = val
    video.muted  = val === 0
    setVolume(val)
    setIsMuted(val === 0)
  }, [])

  const handleFullscreen = useCallback(() => {
    const el = wrapperRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      el.requestFullscreen().catch(() => {})
    }
  }, [])

  // ── Render ─────────────────────────────────────────────────────────
  if (!source) {
    return (
      <div className="flex items-center justify-center h-full bg-pitch-900">
        <div className="text-center">
          <div className="text-5xl mb-4">⚽</div>
          <p className="text-slate-400 text-lg font-medium">Select a match from the sidebar</p>
          <p className="text-slate-600 text-sm mt-1">Choose a stream source to start watching</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full bg-black group"
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onClick={() => {
        // Click anywhere on video toggles play (but not on controls)
        resetControlsTimer()
      }}
    >
      {/* The video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        crossOrigin="anonymous"
        onClick={handleTogglePlay}
      />

      {/* Buffer/switching overlay */}
      <BufferOverlay
        isBuffering={isBuffering}
        isSwitching={isSwitching}
        switchReason={switchReason}
      />

      {/* CORS / Error banner */}
      {errorMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-sm w-full px-4">
          <div className={`rounded-lg px-4 py-3 text-sm ${corsWarning ? 'bg-orange-900/90 text-orange-200' : 'bg-red-900/90 text-red-200'}`}>
            <p className="font-semibold mb-0.5">{corsWarning ? '⚠ Mixed Content / CORS' : '✕ Stream Error'}</p>
            <p className="text-xs opacity-80">{errorMsg}</p>
            {corsWarning && (
              <p className="text-xs opacity-60 mt-1">
                HTTP streams are blocked on HTTPS pages. Use a proxy or run locally over HTTP.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Big play button when paused & no overlay */}
      {!isPlaying && !isBuffering && !isSwitching && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
          onClick={handleTogglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-black/50 border-2 border-white/30 flex items-center justify-center hover:bg-black/70 transition-colors">
            <svg className="w-10 h-10 text-white ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
            </svg>
          </div>
        </div>
      )}

      {/* Controls bar — auto-hide */}
      <div
        className={`transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <PlayerControls
          videoRef={videoRef}
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          allSources={allSources}
          activeSourceIndex={activeSourceIndex}
          onManualSwitch={onManualSwitch}
          onTogglePlay={handleTogglePlay}
          onToggleMute={handleToggleMute}
          onVolumeChange={handleVolumeChange}
          onFullscreen={handleFullscreen}
        />
      </div>
    </div>
  )
}
