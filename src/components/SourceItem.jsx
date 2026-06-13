import { QUALITY_COLORS } from '../utils/streamUtils'

export default function SourceItem({ source, isActive, onClick }) {
  const qColor = QUALITY_COLORS[source.quality] ?? 'bg-slate-600 text-white'

  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors',
        isActive
          ? 'bg-accent/20 text-accent font-medium'
          : 'text-slate-300 hover:bg-pitch-700 hover:text-white',
      ].join(' ')}
    >
      {/* Play icon or active dot */}
      {isActive ? (
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-accent" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 1l9 5-9 5V1z"/>
          </svg>
        </span>
      ) : (
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-slate-600" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 1l9 5-9 5V1z"/>
          </svg>
        </span>
      )}

      {/* Label */}
      <span className="flex-1 truncate">{source.label}</span>

      {/* Quality badge */}
      {source.quality && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${qColor} flex-shrink-0`}>
          {source.quality}
        </span>
      )}

      {/* Type badge for .ts streams */}
      {source.type === 'ts' && (
        <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">.ts</span>
      )}
    </button>
  )
}
