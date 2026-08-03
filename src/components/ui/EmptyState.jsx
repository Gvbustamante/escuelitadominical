import Icon from './Icon'

export default function EmptyState({ icon = 'folder', title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-surface-raised px-6 py-12 text-center">
      <Icon name={icon} className="h-8 w-8 text-ink-faint" />
      <div>
        <p className="font-medium text-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {action}
    </div>
  )
}
