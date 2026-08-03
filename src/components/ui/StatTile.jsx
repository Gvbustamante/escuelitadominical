import Icon from './Icon'

const TONES = {
  brand: 'bg-brand-50 text-brand',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
  neutral: 'bg-slate-100 text-ink-soft',
}

export default function StatTile({ icon, label, value, tone = 'brand' }) {
  return (
    <div className="card flex items-center gap-3">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${TONES[tone]}`}>
        <Icon name={icon} className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-none text-ink">{value}</p>
        <p className="mt-1 truncate text-xs font-medium text-ink-soft">{label}</p>
      </div>
    </div>
  )
}
