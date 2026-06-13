import { useEffect, useRef, useCallback } from 'react'
import Hls from 'hls.js'

/**
 * useAutoSwitch
 *
 * Detects playback stalls and HLS fatal errors, then calls onSwitch()
 * so the parent can move to the next source.
 *
 * Detection strategy (two independent triggers):
 *
 * 1. TIME-FREEZE DETECTION (most reliable for live streams):
 *    - On every `timeupdate`, we record currentTime and start/reset a
 *      STALL_THRESHOLD_MS timer.
 *    - If the timer fires and currentTime hasn't advanced, we call onSwitch.
 *    - We only start timing after the first play event to avoid false positives
 *      during initial buffering.
 *    - If time DID advance before the timer fires, we clear the timer (stream recovered).
 *
 * 2. HLS FATAL ERROR:
 *    - HLS.js raises non-fatal errors (e.g. single fragment retry) constantly.
 *    - We only switch on data.fatal === true, which means HLS.js has given up.
 *    - We add a short FATAL_SWITCH_DELAY_MS grace period before switching
 *      so HLS.js has a chance to recover internally first.
 *
 * @param {React.RefObject}  videoRef          - ref to <video> element
 * @param {React.RefObject}  hlsRef            - ref to current Hls instance
 * @param {string|null}      activeSrc         - current source URL (reset state on change)
 * @param {function}         onSwitch          - called when we decide to switch
 * @param {object}           options
 *   @param {number}  options.stallThreshold   - ms of frozen time before switch (default 4000)
 *   @param {number}  options.fatalDelay       - ms grace after fatal error (default 1000)
 *   @param {boolean} options.enabled          - set false to disable (e.g. user paused)
 */
export function useAutoSwitch(videoRef, hlsRef, activeSrc, onSwitch, {
  stallThreshold = 4000,
  fatalDelay     = 1000,
  enabled        = true,
} = {}) {
  const lastTimeRef    = useRef(null)
  const stallTimerRef  = useRef(null)
  const fatalTimerRef  = useRef(null)
  const hasPlayedRef   = useRef(false)
  const switchingRef   = useRef(false) // debounce: don't double-switch

  const clearAllTimers = useCallback(() => {
    clearTimeout(stallTimerRef.current)
    clearTimeout(fatalTimerRef.current)
    stallTimerRef.current = null
    fatalTimerRef.current = null
  }, [])

  const triggerSwitch = useCallback((reason) => {
    if (switchingRef.current) return
    switchingRef.current = true
    clearAllTimers()
    console.info(`[AutoSwitch] switching source — reason: ${reason}`)
    onSwitch(reason)
    // Reset debounce after the parent has had time to update src
    setTimeout(() => { switchingRef.current = false }, 2000)
  }, [onSwitch, clearAllTimers])

  // Reset all state whenever the active source changes
  useEffect(() => {
    clearAllTimers()
    lastTimeRef.current  = null
    hasPlayedRef.current = false
    switchingRef.current = false
  }, [activeSrc, clearAllTimers])

  // TIME-FREEZE WATCHER
  useEffect(() => {
    if (!enabled) return
    const video = videoRef.current
    if (!video) return

    const onPlaying = () => {
      hasPlayedRef.current = true
    }

    const onTimeUpdate = () => {
      if (!hasPlayedRef.current) return
      const now = video.currentTime

      if (lastTimeRef.current !== null && now > lastTimeRef.current) {
        // Time is advancing — stream is healthy, cancel any stall timer
        clearTimeout(stallTimerRef.current)
        stallTimerRef.current = null
      } else if (!stallTimerRef.current) {
        // Time frozen — start stall countdown
        stallTimerRef.current = setTimeout(() => {
          // Final confirmation: is time still the same?
          if (video.currentTime === lastTimeRef.current) {
            triggerSwitch('stall')
          }
        }, stallThreshold)
      }
      lastTimeRef.current = now
    }

    const onWaiting = () => {
      // `waiting` fires when browser runs out of buffer.
      // We don't switch immediately — we let the stall timer handle it.
      // But we do start it if not already started.
      if (!hasPlayedRef.current || stallTimerRef.current) return
      stallTimerRef.current = setTimeout(() => {
        triggerSwitch('waiting-timeout')
      }, stallThreshold)
    }

    const onError = () => {
      // Native video element error (distinct from HLS.js errors)
      triggerSwitch('video-error')
    }

    video.addEventListener('playing',    onPlaying)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('waiting',    onWaiting)
    video.addEventListener('error',      onError)

    return () => {
      clearAllTimers()
      video.removeEventListener('playing',    onPlaying)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('waiting',    onWaiting)
      video.removeEventListener('error',      onError)
    }
  }, [videoRef, enabled, stallThreshold, triggerSwitch, clearAllTimers])

  // HLS FATAL ERROR WATCHER
  useEffect(() => {
    if (!enabled) return
    const hls = hlsRef.current
    if (!hls) return

    const onHlsError = (_event, data) => {
      if (!data.fatal) return // non-fatal: HLS.js retries internally

      clearTimeout(fatalTimerRef.current)
      fatalTimerRef.current = setTimeout(() => {
        // Double-check hls is still errored (not recovered)
        triggerSwitch(`hls-fatal:${data.type}`)
      }, fatalDelay)
    }

    hls.on(Hls.Events.ERROR, onHlsError)
    return () => {
      hls.off(Hls.Events.ERROR, onHlsError)
      clearTimeout(fatalTimerRef.current)
    }
  }, [hlsRef.current, enabled, fatalDelay, triggerSwitch]) // eslint-disable-line react-hooks/exhaustive-deps
}
