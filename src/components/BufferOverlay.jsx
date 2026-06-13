/**
 * BufferOverlay
 *
 * Shown on top of the video when:
 *   - isBuffering: video is waiting for data (spinner)
 *   - isSwitching: we are about to/have switched source (toast)
 *
 * Keeps the user informed without panic. The spinner appears after a
 * 600ms delay to avoid flickering on fast connections.
 */
import { useState, useEffect } from 'react'

export default function BufferOverlay({ isBuffering, isSwitching, switchReason }) {
  // Delayed show: don't flash spinner for sub-600ms stalls
  const [showSpinner, setShowSpinner] = useState(false)

  useEffect(() => {
    if (isBuffering || isSwitching) {
      const t = setTimeout(() => setShowSpinner(true), 600)
      return () => clearTimeout(t)
    } else {
      setShowSpinner(false)
    }
  }, [isBuffering, isSwitching])

  if (!showSpinner) return null

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 pointer-events-none">
      {isSwitching ? (
        <div className="flex flex-col items-center gap-3">
          <svg className="w-10 h-10 text-accent animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          <p className="text-sm text-white font-medium">Switching to next source…</p>
          {switchReason && (
            <p className="text-xs text-slate-400">{humanReason(switchReason)}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <svg className="w-10 h-10 text-slate-300 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
          <p className="text-sm text-slate-300">Buffering…</p>
        </div>
      )}
    </div>
  )
}

function humanReason(reason) {
  if (reason?.startsWith('hls-fatal')) return 'Stream error detected'
  if (reason === 'stall')             return 'Stream stalled'
  if (reason === 'waiting-timeout')   return 'Buffer timeout'
  if (reason === 'video-error')       return 'Playback error'
  return ''
}
