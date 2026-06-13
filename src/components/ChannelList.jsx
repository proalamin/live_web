import { QUALITY_COLORS } from '../utils/streamUtils'

export default function ChannelList({ channels, activeIndex, onSelect }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-pitch-700">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Channels</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {channels.length === 0 && (
          <p className="px-4 py-6 text-xs text-slate-500 text-center">
            No channels.<br />Edit <code className="text-accent">streams.json</code> to add some.
          </p>
        )}
        {channels.map((ch, idx) => (
          <ChannelItem
            key={ch.id}
            channel={ch}
            isActive={idx === activeIndex}
            onClick={() => onSelect(idx)}
          />
        ))}
      </div>

    </div>
  )
}

function ChannelItem({ channel, isActive, onClick }) {
  const qColor = QUALITY_COLORS[channel.quality] ?? 'bg-slate-600 text-white'
  return (
    <button
      onClick={onClick}
      className={[
        'w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors',
        isActive
          ? 'bg-accent/20 text-accent font-medium'
          : 'text-slate-300 hover:bg-pitch-700 hover:text-white',
      ].join(' ')}
    >
      <span className="w-3 flex-shrink-0">
        {isActive && (
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2 1l9 5-9 5V1z" />
          </svg>
        )}
      </span>
      <span className="flex-1 truncate">{channel.name}</span>
      {channel.quality && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${qColor} flex-shrink-0`}>
          {channel.quality}
        </span>
      )}
    </button>
  )
}
