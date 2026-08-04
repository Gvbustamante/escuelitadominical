import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../../../components/ui/Icon'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import { DIAS_SEMANA, horaLegible, minutosDeHora } from '../../../lib/fechas'
import { modulosConHorario, ocupacionExternaDeDocentes } from '../api'
import { detectarChoques } from '../choques'

// Lunes primero, y el domingo al final: es como se lee un horario aquí.
const DIAS_ORDENADOS = [1, 2, 3, 4, 5, 6, 0]

const TONO_GRAVEDAD = {
  alta: 'border-danger-500 bg-danger-50 text-danger-700',
  media: 'border-warning-500 bg-warning-50 text-warning-700',
  baja: 'border-slate-300 bg-slate-50 text-ink-soft',
}

export default function HorarioPanel({ diplomadoId, puedeGestionar }) {
  const [modulos, setModulos] = useState(null)
  const [ocupacion, setOcupacion] = useState([])

  useEffect(() => {
    let activo = true
    modulosConHorario(diplomadoId).then((data) => { if (activo) setModulos(data) })
    // Si falla, el horario se sigue viendo: solo se pierden los avisos de choque con otros
    // diplomados, que son un extra sobre lo que el líder ya podía comprobar a ojo.
    ocupacionExternaDeDocentes(diplomadoId)
      .then((data) => { if (activo) setOcupacion(data) })
      .catch((err) => console.error('No se pudo revisar la ocupación en otros diplomados:', err))
    return () => { activo = false }
  }, [diplomadoId])

  const problemas = useMemo(
    () => (modulos ? detectarChoques(modulos, ocupacion) : []),
    [modulos, ocupacion],
  )

  const porDia = useMemo(() => {
    const mapa = new Map(DIAS_ORDENADOS.map((d) => [d, []]))
    for (const m of modulos || []) {
      if (m.dia_semana == null) continue
      mapa.get(m.dia_semana)?.push(m)
    }
    for (const lista of mapa.values()) {
      lista.sort((a, b) => (minutosDeHora(a.hora_inicio) ?? 0) - (minutosDeHora(b.hora_inicio) ?? 0))
    }
    return mapa
  }, [modulos])

  if (modulos === null) return <Spinner />

  if (modulos.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title="Este diplomado aún no tiene módulos"
        description={puedeGestionar ? 'Crea los módulos y asígnales día, hora y salón para armar el horario.' : undefined}
      />
    )
  }

  const sinHorario = modulos.filter((m) => m.dia_semana == null)

  return (
    <div className="flex flex-col gap-5">
      {problemas.length > 0 ? (
        <div className="flex flex-col gap-2">
          {problemas.map((p, i) => (
            <div key={i} className={`flex gap-2.5 rounded-md border-l-4 px-3 py-2 ${TONO_GRAVEDAD[p.gravedad]}`}>
              <Icon name={p.gravedad === 'alta' ? 'alert-triangle' : 'clock'} className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">{p.titulo}</p>
                <p className="text-xs">{p.detalle}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-md border-l-4 border-success-500 bg-success-50 px-3 py-2 text-success-700">
          <Icon name="check-circle" className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">El horario no tiene choques de salón ni de docente.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {DIAS_ORDENADOS.map((dia) => {
          const clases = porDia.get(dia) || []
          return (
            <div key={dia} className="card !p-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {DIAS_SEMANA[dia]}
              </h3>
              {clases.length === 0 ? (
                <p className="text-xs text-ink-faint">—</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {clases.map((m) => (
                    <li key={m.id}>
                      <Link to={`/modulos/${m.id}`} className="block rounded-md border-l-4 border-sky-500 bg-slate-50 px-2 py-1.5 hover:bg-slate-100">
                        <span className="block text-xs font-semibold text-ink">
                          {horaLegible(m.hora_inicio)}
                          {m.hora_fin ? `–${horaLegible(m.hora_fin)}` : ''}
                        </span>
                        <span className="block truncate text-xs text-ink">{m.nombre}</span>
                        <span className="block truncate text-[11px] text-ink-soft">
                          {(m.modulo_docentes || []).map((md) => md.docente?.nombre_completo).filter(Boolean).join(', ') || 'Sin docente'}
                        </span>
                        {m.salon && <span className="block text-[11px] text-ink-faint">Salón {m.salon}</span>}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {sinHorario.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-ink">Módulos sin horario asignado</h3>
          <ul className="flex flex-wrap gap-2">
            {sinHorario.map((m) => (
              <li key={m.id}>
                <Link to={`/modulos/${m.id}/editar`} className="btn-secondary !px-3 !py-1.5 text-xs">
                  {m.nombre}
                  {puedeGestionar && <Icon name="pencil" className="h-3.5 w-3.5" />}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
