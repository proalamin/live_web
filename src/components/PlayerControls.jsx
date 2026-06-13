/**
 * PlayerControls
 *
 * Thin control bar rendered below/over the video.
 * Provides:
 *  - Play / Pause
 *  - Volume slider + mute toggle
 *  - Source selector (dropdown of all sources for the current match)
 *  - Fullscreen
 *  - Current source label / quality badge
 */
import { useState, useCallback } from 'react'
import { QUALITY_COLORS } from '../utils/streamUtils'

export default function PlayerControls({
  videoRef,
  isPlaying,
  isMuted,
  volume,
  allSources,
  activeSourceIndex,
  onManualSwitch,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onFullscreen,
}) {
  const [showSources, setShowSources] = useState(false)
  const activeSource = allSources[activeSourceIndex] ?? null

  const handleVolumeClick = useCallback((e) => {
    // clicking volume slider should not bubble to play/pause
    e.stopPropagation()
  }, [])

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-10 flex flex-col"
      onClick={e => e.stopPropagation()}
    >
      {/* Gradient scrim */}
      <div className="h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Controls row */}
      <div className="bg-black/60 backdrop-blur-sm px-4 py-2 flex items-center gap-3">
        {/* Play/Pause */}
        <button
          onClick={onTogglePlay}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
            </svg>
          )}
        </button>

        {/* Volume */}
        <div className="flex items-center gap-1.5" onClick={handleVolumeClick}>
          <button
            onClick={onToggleMute}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <svg className="w-4 h-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd"/>
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={e => onVolumeChange(parseFloat(e.target.value))}
            className="w-20 h-1 accent-accent cursor-pointer"
          />
        </div>

        {/* LIVE badge */}
        <span className="flex items-center gap-1 text-xs text-red-400 font-semibold ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          LIVE
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Active source label */}
        {activeSource && (
          <span className="text-xs text-slate-400 hidden sm:block truncate max-w-[120px]">
            {activeSource.name}
          </span>
        )}

        {/* Quality badge */}
        {activeSource?.quality && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${QUALITY_COLORS[activeSource.quality] ?? 'bg-slate-600 text-white'}`}>
            {activeSource.quality}
          </span>
        )}

        {/* Source picker */}
        {allSources.length > 1 && (
          <div className="relative">
            <button
              onClick={() => setShowSources(v => !v)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-300 hover:bg-white/10 transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h4a1 1 0 110 2H4a1 1 0 01-1-1z"/>
              </svg>
              Sources
            </button>

            {showSources && (
              <div className="absolute bottom-full right-0 mb-1 w-52 bg-pitch-800 border border-pitch-600 rounded-lg shadow-xl overflow-hidden z-30">
                {allSources.map((src, idx) => (
                  <button
                    key={src.id}
                    onClick={() => { onManualSwitch(idx); setShowSources(false) }}
                    className={[
                      'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                      idx === activeSourceIndex
                        ? 'bg-accent/20 text-accent'
                        : 'text-slate-300 hover:bg-pitch-700',
                    ].join(' ')}
                  >
                    {idx === activeSourceIndex && (
                      <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M2 1l9 5-9 5V1z"/>
                      </svg>
                    )}
                    {idx !== activeSourceIndex && <span className="w-3 flex-shrink-0" />}
                    <span className="flex-1 truncate">{src.name}</span>
                    {src.quality && (
                      <span className={`text-[10px] font-bold px-1 py-0.5 rounded ${QUALITY_COLORS[src.quality] ?? 'bg-slate-600 text-white'}`}>
                        {src.quality}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fullscreen */}
        <button
          onClick={onFullscreen}
          className="p-1.5 rounded hover:bg-white/10 transition-colors"
          aria-label="Fullscreen"
        >
          <svg className="w-4 h-4 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 110-2h4a1 1 0 011 1v4a1 1 0 11-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 112 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 110 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 110-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
