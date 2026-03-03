import { useState } from 'react'
import { TOOLS, API_URL, BRAND_PRESETS } from '../tools.js'

// ── Field components ─────────────────────────────────────────────────────────

function Toggle({ value, onChange }) {
  const on = value === true || value === 'true'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
        on ? 'bg-indigo-600' : 'bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function FieldInput({ field, value, onChange }) {
  if (field.type === 'boolean') {
    return (
      <div className="flex items-center gap-3 pt-0.5">
        <Toggle value={value} onChange={onChange} />
        <span className="text-sm text-gray-400">{value === true || value === 'true' ? 'Enabled' : 'Disabled'}</span>
      </div>
    )
  }

  if (field.type === 'select') {
    const opts = field.options || []
    return (
      <select className="input-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map((opt) => {
          const val = typeof opt === 'string' ? opt : opt.value
          const label = typeof opt === 'string' ? opt : opt.label
          return <option key={val} value={val}>{label}</option>
        })}
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

function BrandPresetField({ onChange }) {
  const [selected, setSelected] = useState('')

  const handleChange = (e) => {
    const key = e.target.value
    setSelected(key)
    if (key && BRAND_PRESETS[key]) {
      onChange(BRAND_PRESETS[key])
    }
  }

  return (
    <select className="input-field" value={selected} onChange={handleChange}>
      <option value="">— Choose a brand preset (optional) —</option>
      {Object.entries(BRAND_PRESETS).map(([key, p]) => (
        <option key={key} value={key}>{p.label}</option>
      ))}
    </select>
  )
}

// ── Main ToolForm ─────────────────────────────────────────────────────────────
export default function ToolForm({ tool }) {
  // Build initial field state
  const initial = {}
  tool.fields
    .filter((f) => f.key !== '_brand_preset')
    .forEach((f) => {
      initial[f.key] = f.defaultValue !== undefined ? f.defaultValue : ''
    })

  const [fields, setFields] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [showPayload, setShowPayload] = useState(false)

  const setField = (key, val) => setFields((prev) => ({ ...prev, [key]: val }))

  // Brand preset: bulk-update multiple fields at once
  const applyBrandPreset = (preset) => {
    setFields((prev) => ({
      ...prev,
      base_url_template: preset.base_url_template ?? prev.base_url_template,
      code_transform: preset.code_transform ?? prev.code_transform,
      column_name: preset.column_name ?? prev.column_name,
      status_column: preset.status_column ?? prev.status_column,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    const payload = tool.buildPayload(fields)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || data?.message || `HTTP ${res.status}`)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const payload = tool.buildPayload(fields)

  const hasBrandPreset = tool.fields.some((f) => f.key === '_brand_preset')

  return (
    <form onSubmit={handleSubmit} className="space-y-6 fade-in">

      {/* Title */}
      <div className="pb-2 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white tracking-tight">{tool.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{tool.description}</p>
      </div>

      {/* Brand Preset (if applicable) */}
      {hasBrandPreset && (
        <div className="p-4 bg-indigo-950/30 border border-indigo-800/40 rounded-xl space-y-1">
          <label className="label text-indigo-400">Brand Preset</label>
          <BrandPresetField onChange={applyBrandPreset} />
          <p className="text-xs text-gray-500 mt-1">
            Selecting a brand auto-fills the URL template, column, and transform settings below.
          </p>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-5">
        {tool.fields
          .filter((f) => f.key !== '_brand_preset')
          .map((field) => (
            <div key={field.key}>
              <label className="label">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <FieldInput
                field={field}
                value={fields[field.key]}
                onChange={(v) => setField(field.key, v)}
              />
              {field.help && (
                <p className="text-xs text-gray-500 mt-1.5">{field.help}</p>
              )}
            </div>
          ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          {showPayload ? 'Hide' : 'Preview'} JSON
        </button>
      </div>

      {/* JSON Preview */}
      {showPayload && (
        <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4 fade-in">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Request Payload</p>
          <pre className="text-xs text-emerald-400/80 overflow-auto max-h-64 leading-relaxed">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      )}

      {/* Success result */}
      {result && (
        <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/30 p-5 fade-in space-y-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-emerald-400">Workflow submitted successfully</p>
          </div>

          <div className="space-y-2 text-xs">
            {result.job_id && (
              <Row label="Job ID" value={result.job_id} mono />
            )}
            {result.workflow_id && (
              <Row label="Workflow ID" value={result.workflow_id} mono truncate />
            )}
            {result.status && (
              <Row label="Status" value={result.status} badge />
            )}
          </div>

          <p className="text-xs text-gray-500 pt-1 border-t border-gray-800">
            Track on{' '}
            <a href="https://cloud.temporal.io" target="_blank" rel="noopener noreferrer"
              className="text-indigo-400 hover:underline">
              Temporal Cloud Dashboard
            </a>
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/30 p-5 fade-in">
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-semibold text-red-400">Error</p>
          </div>
          <p className="text-xs text-red-300/80 font-mono break-all">{error}</p>
        </div>
      )}
    </form>
  )
}

function Row({ label, value, mono, badge, truncate }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-gray-500 shrink-0 w-24">{label}:</span>
      {badge ? (
        <span className="bg-indigo-900/40 text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded-full">{value}</span>
      ) : (
        <span className={`text-gray-200 ${mono ? 'font-mono' : ''} ${truncate ? 'truncate max-w-xs' : ''}`}>
          {value}
        </span>
      )}
    </div>
  )
}
