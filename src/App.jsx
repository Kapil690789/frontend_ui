import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ToolForm from './components/ToolForm.jsx'
import { TOOLS } from './tools.js'

export default function App() {
  const [activeTool, setActiveTool] = useState(TOOLS[0].id)

  const currentTool = TOOLS.find((t) => t.id === activeTool) || TOOLS[0]

  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Radial gradient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-indigo-900/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-blue-900/10 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar activeTool={activeTool} onSelect={setActiveTool} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 px-8 py-4 border-b border-white/5 bg-gray-950/70 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentTool.icon}</span>
            <h1 className="text-sm font-semibold text-white">{currentTool.name}</h1>
          </div>
          <a
            href="https://cloud.temporal.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-violet-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Temporal Dashboard
          </a>
        </div>

        {/* Content area */}
        <div className="max-w-2xl mx-auto px-8 py-8">
          <ToolForm key={activeTool} tool={currentTool} />
        </div>
      </main>
    </div>
  )
}
