import { useAuth } from '../contexts/AuthContext'
import { ROLE_LABELS } from '../lib/roles'

// Dashboard por rol: esta pantalla se amplía en la fase de "Dashboards por rol" (ver
// docs/ROADMAP.md) una vez existan los módulos (diplomados, pagos, tareas, etc.) que
// alimentan sus indicadores. Por ahora es la pantalla de bienvenida real, sin datos inventados.
export default function Home() {
  const { profile, institucion } = useAuth()
  const primerNombre = profile?.nombre_completo?.split(' ')[0]

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold text-ink">Hola, {primerNombre}</h1>
      <p className="text-sm text-ink-soft">
        {ROLE_LABELS[profile?.role]} en {institucion?.nombre || 'tu instituto'}.
      </p>
    </div>
  )
}
