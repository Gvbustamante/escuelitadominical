import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-ink-faint">Error 404</p>
      <h1 className="text-2xl font-semibold text-ink">Esta página no existe</h1>
      <Link to="/" className="btn-primary mt-2">Volver al inicio</Link>
    </div>
  )
}
