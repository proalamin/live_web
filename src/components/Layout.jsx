/**
 * Layout
 * Two-column CSS Grid: fixed 280px sidebar | fluid player area.
 * On narrow screens (< 768px) the sidebar collapses to a top strip.
 */
import { useState } from 'react'

export default function Layout({ sidebar, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen overflow-hidden bg-pitch-900">
      {/* ── Sidebar ── */}
      <aside
        className={[
          'flex-shrink-0 flex flex-col bg-pitch-800 border-r border-pitch-700 transition-all duration-200',
          sidebarOpen ? 'w-72' : 'w-0 overflow-hidden',
        ].join(' ')}
      >
        {sidebar}
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 h-12 border-b border-pitch-700 bg-pitch-800 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 rounded hover:bg-pitch-700 transition-colors"
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <svg className="w-5 h-5 text-slate-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
          </button>
          <span className="flex items-center gap-2 font-bold text-white tracking-wide">
            <span className="text-lg">⚽</span>
            <span>FIFA 2026 <span className="text-accent font-normal text-sm ml-1">LIVE</span></span>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-red-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
          </div>
        </header>

        {/* Player area fills remaining height */}
        <main className="flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
