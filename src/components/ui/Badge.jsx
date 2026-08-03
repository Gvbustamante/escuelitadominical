const TONES = {
  neutral: 'bg-slate-100 text-ink-soft',
  brand: 'bg-brand-50 text-brand',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  danger: 'bg-danger-50 text-danger-700',
}

export default function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge ${TONES[tone] || TONES.neutral}`}>{children}</span>
}
