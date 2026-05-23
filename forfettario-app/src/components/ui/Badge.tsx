type BadgeVariant = 'green' | 'red' | 'blue' | 'yellow' | 'slate'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'xs'
}

const VARIANTS: Record<BadgeVariant, string> = {
  green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  red: 'bg-red-500/15 text-red-400 border-red-500/20',
  blue: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  yellow: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  slate: 'bg-slate-700/50 text-slate-400 border-slate-700',
}

export function Badge({ children, variant = 'slate', size = 'sm' }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center border rounded-md font-medium
      ${size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2 py-1'}
      ${VARIANTS[variant]}
    `}>
      {children}
    </span>
  )
}
