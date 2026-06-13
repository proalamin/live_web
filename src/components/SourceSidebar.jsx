import { formatKickoff } from '../utils/streamUtils'
import SourceItem from './SourceItem'

export default function SourceSidebar({
  matches,
  activeMatchId,
  activeSourceIndex,
  onSelectSource,
}) {
  // Split matches into live/upcoming and completed
  const now = new Date()
  const active   = matches.filter(m => !m.completed)
  const finished = matches.filter(m => m.completed)

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar header */}
      <div className="px-4 py-3 border-b border-pitch-700">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Matches</h2>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {active.length === 0 && (
          <p className="px-4 py-6 text-xs text-slate-500 text-center">
            No matches scheduled.<br/>Edit <code className="text-accent">streams.json</code> to add some.
          </p>
        )}

        {active.map(match => (
          <MatchSection
            key={match.id}
            match={match}
            isActiveMatch={match.id === activeMatchId}
            activeSourceIndex={activeMatchId === match.id ? activeSourceIndex : -1}
            onSelectSource={onSelectSource}
          />
        ))}

        {finished.length > 0 && (
          <>
            <div className="px-4 pt-4 pb-1">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Completed</span>
            </div>
            {finished.map(match => (
              <MatchSection
                key={match.id}
                match={match}
                isActiveMatch={false}
                activeSourceIndex={-1}
                onSelectSource={onSelectSource}
                dim
              />
            ))}
          </>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-pitch-700">
        <p className="text-xs text-slate-600 leading-relaxed">
          Edit <code className="text-slate-400">src/streams.json</code> to update links nightly.
        </p>
      </div>
    </div>
  )
}

function MatchSection({ match, isActiveMatch, activeSourceIndex, onSelectSource, dim = false }) {
  return (
    <div className={`mb-1 ${dim ? 'opacity-40' : ''}`}>
      {/* Match header */}
      <div className={`px-4 py-2 ${isActiveMatch ? 'bg-pitch-700' : ''}`}>
        <div className="flex items-center gap-1.5 mb-0.5">
          {isActiveMatch && (
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse flex-shrink-0" />
          )}
          <span className="text-sm font-semibold text-white truncate">
            {match.homeTeam} <span className="text-slate-400 font-normal">vs</span> {match.awayTeam}
          </span>
        </div>
        <div className="text-xs text-slate-500 truncate pl-3">
          {match.group && <span className="mr-2">{match.group}</span>}
          {formatKickoff(match.kickoff)}
        </div>
      </div>

      {/* Sources */}
      <div className="px-2 pb-1">
        {(match.sources ?? []).map((source, idx) => (
          <SourceItem
            key={source.id}
            source={source}
            isActive={isActiveMatch && activeSourceIndex === idx}
            onClick={() => onSelectSource(match.id, idx)}
          />
        ))}
      </div>
    </div>
  )
}
