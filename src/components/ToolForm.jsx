import { useState } from 'react'
import { TOOLS, API_URL } from '../tools.js'

function FieldInput({ field, value, onChange }) {
  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            className="sr-only"
            checked={value === true || value === 'true'}
            onChange={(e) => onChange(e.target.checked)}
          />
          <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
            value === true || value === 'true' ? 'bg-violet-600' : 'bg-gray-700'
          }`} />
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            value === true || value === 'true' ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </div>
        <span className="text-sm text-gray-300">{value === true || value === 'true' ? 'Yes' : 'No'}</span>
      </label>
    )
  }

  if (field.type === 'select') {
    return (
      <select
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {field.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        className="input-field"
        value={value}
        min={1}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    )
  }

  return (
    <input
      type={field.type === 'url' ? 'url' : 'text'}
      className="input-field"
      placeholder={field.placeholder || ''}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export default function ToolForm({ tool }) {
  const initialState = {}
  tool.fields.forEach((f) => {
    initialState[f.key] = f.defaultValue !== undefined ? f.defaultValue : ''
  })

  const [fields, setFields] = useState(initialState)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showPayload, setShowPayload] = useState(false)

  const setField = (key, val) => setFields((prev) => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    const payload = tool.buildPayload(fields)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.detail || data?.message || `HTTP ${response.status}`)
      }

      setResult(data)
    } catch (err) {
      setError(err.message || 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const payload = tool.buildPayload(fields)

  return (
    <form onSubmit={handleSubmit} className="space-y-6 fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className={`text-2xl w-10 h-10 flex items-center justify-center rounded-xl ${tool.iconBg}`}>
            {tool.icon}
          </span>
          <div>
            <h2 className="text-xl font-bold text-white">{tool.name}</h2>
            <p className="text-sm text-gray-400">{tool.description}</p>
          </div>
        </div>
      </div>

      {/* Fields */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Configuration</h3>
        {tool.fields.map((field) => (
          <div key={field.key}>
            <label className="label">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <FieldInput field={field} value={fields[field.key]} onChange={(v) => setField(field.key, v)} />
            {field.help && (
              <p className="text-xs text-gray-500 mt-1.5">{field.help}</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <svg className="w-4 h-4 spin-slow" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Running...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Run Workflow
            </>
          )}
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowPayload((p) => !p)}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          {showPayload ? 'Hide' : 'Preview'} JSON
        </button>
      </div>

      {/* JSON Preview */}
      {showPayload && (
        <div className="glass-card p-4 fade-in">
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-semibold">Request Payload Preview</p>
          <pre className="text-xs text-green-400/80 overflow-auto max-h-60 leading-relaxed">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="glass-card border-green-500/30 p-5 fade-in">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-400 rounded-full pulse-dot" />
            <p className="text-sm font-semibold text-green-400">Workflow Submitted Successfully!</p>
          </div>
          <div className="space-y-2">
            {result.job_id && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Job ID:</span>
                <span className="text-xs font-mono text-blue-300 bg-blue-950/40 px-2 py-0.5 rounded">{result.job_id}</span>
              </div>
            )}
            {result.workflow_id && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Workflow ID:</span>
                <span className="text-xs font-mono text-violet-300 bg-violet-950/40 px-2 py-0.5 rounded truncate max-w-xs">{result.workflow_id}</span>
              </div>
            )}
            {result.status && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Status:</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  result.status === 'PENDING' ? 'bg-yellow-900/40 text-yellow-300' :
                  result.status === 'COMPLETED' ? 'bg-green-900/40 text-green-300' :
                  'bg-blue-900/40 text-blue-300'
                }`}>{result.status}</span>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5">
            <p className="text-xs text-gray-500">
              Track progress at{' '}
              <a href="https://cloud.temporal.io" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">
                Temporal Dashboard
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass-card border-red-500/30 p-5 fade-in">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-red-400">Error</p>
          </div>
          <p className="text-xs text-red-300/80">{error}</p>
        </div>
      )}
    </form>
  )
}
