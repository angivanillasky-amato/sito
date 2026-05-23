interface EuroInputProps {
  value: number
  onChange: (v: number) => void
  label?: string
  placeholder?: string
  className?: string
  readOnly?: boolean
}

export function EuroInput({ value, onChange, label, placeholder = '0,00', className = '', readOnly }: EuroInputProps) {
  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm select-none">€</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value || ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`
            w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2.5
            text-sm text-right text-white placeholder-slate-600
            focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30
            transition-colors
            ${readOnly ? 'opacity-60 cursor-default' : 'hover:border-slate-600'}
          `}
        />
      </div>
    </div>
  )
}
