import { TOOLS } from '../tools.js'

export default function Sidebar({ activeTool, onSelect }) {
  return (
    <aside className="w-72 shrink-0 h-screen sticky top-0 flex flex-col border-r border-white/5 bg-gray-950/80 backdrop-blur-md">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-tight leading-tight">FlockAI</p>
            <p className="text-gray-500 text-xs">Workflow Runner</p>
          </div>
        </div>
      </div>

      {/* The API URL badge */}
      <div className="px-5 py-3 border-b border-white/5">
        <p className="text-xs text-gray-500 mb-1 font-medium">API Endpoint</p>
        <div className="flex items-center gap-1.5 bg-gray-900/60 border border-gray-800 rounded-lg px-2.5 py-1.5">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full pulse-dot" />
          <span className="text-xs text-green-400/80 font-mono truncate">fal-gen.flockshop.ai</span>
        </div>
      </div>

      {/* Tools list */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest px-3 pb-2">Tools</p>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            className={`sidebar-item w-full text-left ${activeTool === tool.id ? 'active' : ''}`}
            onClick={() => onSelect(tool.id)}
          >
            <span className={`w-7 h-7 flex items-center justify-center rounded-lg text-base shrink-0 ${tool.iconBg}`}>
              {tool.icon}
            </span>
            <span className="flex-1 truncate">{tool.name}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5">
        <p className="text-xs text-gray-600 text-center">FlockAI Internal Tools v1.0</p>
      </div>
    </aside>
  )
}
