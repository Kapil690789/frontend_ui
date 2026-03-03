import { useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import ToolForm from './components/ToolForm.jsx'
import { TOOLS } from './tools.js'

export default function App() {
  const [activeTool, setActiveTool] = useState(TOOLS[0].id)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const currentTool = TOOLS.find((t) => t.id === activeTool) || TOOLS[0]

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <Sidebar
        activeTool={activeTool}
        onSelect={setActiveTool}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((v) => !v)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
            <span className="text-sm font-medium text-gray-300">{currentTool.name}</span>
            <span className="text-xs text-gray-600 bg-gray-800/60 px-2 py-0.5 rounded-md">{currentTool.category}</span>
          </div>
          <a
            href="https://cloud.temporal.io"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Temporal Dashboard
          </a>
        </header>

        {/* Form area */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-xl mx-auto">
            <ToolForm key={activeTool} tool={currentTool} />
          </div>
        </main>
      </div>
    </div>
  )
}
