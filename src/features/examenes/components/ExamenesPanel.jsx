import { useEffect, useState } from 'react'
import Icon from '../../../components/ui/Icon'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import { listarExamenes, crearExamen, eliminarExamen } from '../api'
import PreguntasModal from './PreguntasModal'
import ResultadosModal from './ResultadosModal'
import PresentarExamenModal from './PresentarExamenModal'

function estadoDisponibilidad(ex) {
  const ahora = new Date()
  if (ex.fecha_disponible_desde && ahora < new Date(ex.fecha_disponible_desde)) return 'proximo'
  if (ex.fecha_disponible_hasta && ahora > new Date(ex.fecha_disponible_hasta)) return 'cerrado'
  return 'disponible'
}

export default function ExamenesPanel({ moduloId, puedeGestionar, esEstudiante }) {
  const [examenes, setExamenes] = useState(null)
  const [form, setForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [duracion, setDuracion] = useState(60)
  const [puntosMax, setPuntosMax] = useState(100)
  const [preguntasDe, setPreguntasDe] = useState(null)
  const [resultadosDe, setResultadosDe] = useState(null)
  const [presentarDe, setPresentarDe] = useState(null)

  async function cargar() {
    setExamenes(await listarExamenes(moduloId))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduloId])

  async function handleSubmit(e) {
    e.preventDefault()
    await crearExamen({
      modulo_id: moduloId, titulo, descripcion: descripcion || null,
      fecha_disponible_desde: desde ? new Date(desde).toISOString() : null,
      fecha_disponible_hasta: hasta ? new Date(hasta).toISOString() : null,
      duracion_minutos: duracion || null, puntos_max: puntosMax,
    })
    setForm(false)
    setTitulo(''); setDescripcion(''); setDesde(''); setHasta(''); setDuracion(60); setPuntosMax(100)
    cargar()
  }

  async function handleEliminar(id) {
    await eliminarExamen(id)
    cargar()
  }

  if (examenes === null) return <Spinner />

  return (
    <div>
      {puedeGestionar && (
        <div className="card mb-4 !p-4">
          {!form ? (
            <button className="btn-secondary" onClick={() => setForm(true)}>
              <Icon name="plus" className="h-4 w-4" /> Nuevo examen
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="label">Título</label>
                <input required className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div>
                <label className="label">Descripción</label>
                <textarea className="input" rows={2} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Disponible desde</label>
                  <input type="datetime-local" className="input" value={desde} onChange={(e) => setDesde(e.target.value)} />
                </div>
                <div>
                  <label className="label">Disponible hasta</label>
                  <input type="datetime-local" className="input" value={hasta} onChange={(e) => setHasta(e.target.value)} />
                </div>
                <div>
                  <label className="label">Duración (minutos)</label>
                  <input type="number" min="1" className="input" value={duracion} onChange={(e) => setDuracion(Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">Puntos máximos</label>
                  <input type="number" min="1" className="input" value={puntosMax} onChange={(e) => setPuntosMax(Number(e.target.value))} />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary">Crear examen</button>
                <button type="button" className="btn-secondary" onClick={() => setForm(false)}>Cancelar</button>
              </div>
            </form>
          )}
        </div>
      )}

      {examenes.length === 0 ? (
        <EmptyState icon="award" title="Sin exámenes todavía" description={puedeGestionar ? 'Crea el primero arriba.' : undefined} />
      ) : (
        <div className="flex flex-col gap-3">
          {examenes.map((ex) => (
            <div key={ex.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink">{ex.titulo}</p>
                <p className="text-xs text-ink-faint">
                  {ex.fecha_disponible_desde ? new Date(ex.fecha_disponible_desde).toLocaleString() : 'Sin apertura definida'}
                  {ex.duracion_minutos ? ` · ${ex.duracion_minutos} min` : ''} · {ex.puntos_max} pts
                </p>
              </div>
              {puedeGestionar && (
                <div className="flex items-center gap-2">
                  <button className="btn-secondary !px-3 !py-1.5 text-sm" onClick={() => setPreguntasDe(ex)}>Preguntas</button>
                  <button className="btn-secondary !px-3 !py-1.5 text-sm" onClick={() => setResultadosDe(ex)}>
                    Resultados ({ex.examen_intentos?.length || 0})
                  </button>
                  <button className="btn-ghost !px-2 !py-1 text-danger-600" onClick={() => handleEliminar(ex.id)}>
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              )}
              {esEstudiante && <EstudianteAccion examen={ex} onPresentar={() => setPresentarDe(ex)} />}
            </div>
          ))}
        </div>
      )}

      {preguntasDe && <PreguntasModal examen={preguntasDe} onClose={() => { setPreguntasDe(null); cargar() }} />}
      {resultadosDe && <ResultadosModal examen={resultadosDe} onClose={() => { setResultadosDe(null); cargar() }} />}
      {presentarDe && <PresentarExamenModal examen={presentarDe} onClose={() => { setPresentarDe(null); cargar() }} />}
    </div>
  )
}

function EstudianteAccion({ examen, onPresentar }) {
  const disponibilidad = estadoDisponibilidad(examen)
  const miIntento = examen.examen_intentos?.[0]

  if (miIntento?.estado === 'calificado') {
    return <Badge tone="success">{miIntento.calificacion}/{examen.puntos_max}</Badge>
  }
  if (miIntento?.estado === 'entregado') {
    return <Badge tone="warning">En revisión</Badge>
  }
  if (disponibilidad === 'proximo') return <Badge tone="neutral">Aún no abre</Badge>
  if (disponibilidad === 'cerrado') return <Badge tone="neutral">Cerrado</Badge>
  return (
    <button className="btn-primary !px-3 !py-1.5 text-sm" onClick={onPresentar}>
      {miIntento?.estado === 'en_progreso' ? 'Continuar' : 'Presentar'}
    </button>
  )
}
