export default function Spinner({ label = 'Cargando…' }) {
  return (
    <div className="flex h-full min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-soft">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}
