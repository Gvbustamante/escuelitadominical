import { useEffect, useState } from 'react'
import Icon from '../../../components/ui/Icon'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import Modal from '../../../components/Modal'
import { useAuth } from '../../../contexts/AuthContext'
import { listarTareas, crearTarea, eliminarTarea, listarEntregas, calificarEntrega, abrirEntrega, entregarTarea } from '../api'

const ESTADO_ENTREGA_TONE = { pendiente: 'neutral', entregada: 'brand', calificada: 'success', tarde: 'warning' }
const ESTADO_ENTREGA_LABEL = { pendiente: 'Pendiente', entregada: 'Entregada', calificada: 'Calificada', tarde: 'Entregada tarde' }

export default function TareasPanel({ moduloId, puedeGestionar, esEstudiante }) {
  const [tareas, setTareas] = useState(null)
  const [form, setForm] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fechaLimite, setFechaLimite] = useState('')
  const [puntosMax, setPuntosMax] = useState(100)
  const [tareaAbierta, setTareaAbierta] = useState(null)
  const [tareaEntregar, setTareaEntregar] = useState(null)

  async function cargar() {
    setTareas(await listarTareas(moduloId))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduloId])

  async function handleSubmit(e) {
    e.preventDefault()
    await crearTarea({
      modulo_id: moduloId, titulo, descripcion: descripcion || null,
      fecha_limite: fechaLimite ? new Date(fechaLimite).toISOString() : null,
      puntos_max: puntosMax,
    })
    setForm(false)
    setTitulo(''); setDescripcion(''); setFechaLimite(''); setPuntosMax(100)
    cargar()
  }

  async function handleEliminar(id) {
    await eliminarTarea(id)
    cargar()
  }

  if (tareas === null) return <Spinner />

  return (
    <div>
      {puedeGestionar && (
        <div className="card mb-4 !p-4">
          {!form ? (
            <button className="btn-secondary" onClick={() => setForm(true)}>
              <Icon name="plus" className="h-4 w-4" /> Nueva tarea
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="label">Título</label>
                <input required className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div>
                <label className="label">Instrucciones</label>
                <textarea className="input" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Fecha límite</label>
                  <input type="datetime-local" className="input" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
                </div>
                <div>
                  <label className="label">Puntos máximos</label>
                  <input type="number" min="1" className="input" value={puntosMax} onChange={(e) => setPuntosMax(Number(e.target.value))} />
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary">Crear tarea</button>
                <button type="button" className="btn-secondary" onClick={() => setForm(false)}>Cancelar</button>
              </div>
            </form>
          )}
        </div>
      )}

      {tareas.length === 0 ? (
        <EmptyState icon="check-square" title="Sin tareas todavía" description={puedeGestionar ? 'Crea la primera arriba.' : undefined} />
      ) : (
        <div className="flex flex-col gap-3">
          {tareas.map((t) => {
            const entregadas = t.tareas_academicas_entregas?.filter((e) => e.estado !== 'pendiente').length || 0
            const calificadas = t.tareas_academicas_entregas?.filter((e) => e.estado === 'calificada').length || 0
            const miEntrega = esEstudiante ? t.tareas_academicas_entregas?.[0] : null
            return (
              <div key={t.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-ink">{t.titulo}</p>
                  <p className="text-xs text-ink-faint">
                    {t.fecha_limite ? `Vence ${new Date(t.fecha_limite).toLocaleString()}` : 'Sin fecha límite'} · {t.puntos_max} pts
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {puedeGestionar && <Badge tone="brand">{entregadas} entregadas · {calificadas} calificadas</Badge>}
                  {puedeGestionar && (
                    <button className="btn-secondary !px-3 !py-1.5 text-sm" onClick={() => setTareaAbierta(t)}>Revisar</button>
                  )}
                  {puedeGestionar && (
                    <button className="btn-ghost !px-2 !py-1 text-danger-600" onClick={() => handleEliminar(t.id)}>
                      <Icon name="trash" className="h-4 w-4" />
                    </button>
                  )}
                  {esEstudiante && (
                    <>
                      <Badge tone={ESTADO_ENTREGA_TONE[miEntrega?.estado || 'pendiente']}>
                        {miEntrega?.calificacion != null ? `${miEntrega.calificacion}/${t.puntos_max}` : ESTADO_ENTREGA_LABEL[miEntrega?.estado || 'pendiente']}
                      </Badge>
                      {miEntrega?.estado !== 'calificada' && (
                        <button className="btn-secondary !px-3 !py-1.5 text-sm" onClick={() => setTareaEntregar(t)}>
                          {miEntrega ? 'Editar entrega' : 'Entregar'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tareaAbierta && <RevisarEntregasModal tarea={tareaAbierta} onClose={() => { setTareaAbierta(null); cargar() }} />}
      {tareaEntregar && <EntregarTareaModal tarea={tareaEntregar} onClose={() => { setTareaEntregar(null); cargar() }} />}
    </div>
  )
}

function EntregarTareaModal({ tarea, onClose }) {
  const { profile } = useAuth()
  const [comentario, setComentario] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!comentario && !archivo) return setError('Escribe un comentario o adjunta un archivo.')
    setBusy(true)
    try {
      await entregarTarea({ tareaId: tarea.id, estudianteId: profile.id, institucionId: profile.institucion_id, comentario, archivo })
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={`Entregar — ${tarea.titulo}`}>
      {tarea.descripcion && <p className="mb-4 text-sm text-ink-soft">{tarea.descripcion}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="label">Comentario</label>
          <textarea className="input" rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} />
        </div>
        <div>
          <label className="label">Archivo (opcional)</label>
          <input type="file" className="input" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
        </div>
        {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>}
        <button disabled={busy} className="btn-primary">{busy ? 'Enviando…' : 'Entregar tarea'}</button>
      </form>
    </Modal>
  )
}

function RevisarEntregasModal({ tarea, onClose }) {
  const [entregas, setEntregas] = useState(null)
  const [notas, setNotas] = useState({})

  useEffect(() => {
    listarEntregas(tarea.id).then((data) => {
      setEntregas(data)
      const iniciales = {}
      data.forEach((e) => { iniciales[e.id] = { calificacion: e.calificacion ?? '', retroalimentacion: e.retroalimentacion || '' } })
      setNotas(iniciales)
    })
  }, [tarea.id])

  async function handleGuardar(entregaId) {
    const n = notas[entregaId]
    await calificarEntrega(entregaId, Number(n.calificacion), n.retroalimentacion)
    const data = await listarEntregas(tarea.id)
    setEntregas(data)
  }

  return (
    <Modal open onClose={onClose} title={`Entregas — ${tarea.titulo}`}>
      {entregas === null ? (
        <Spinner />
      ) : entregas.length === 0 ? (
        <EmptyState icon="check-square" title="Nadie ha entregado todavía" />
      ) : (
        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
          {entregas.map((e) => (
            <div key={e.id} className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-ink">{e.estudiante?.nombre_completo}</p>
                {e.storage_path && (
                  <button className="text-sm font-medium text-brand hover:underline" onClick={async () => window.open(await abrirEntrega(e.storage_path), '_blank')}>
                    Ver archivo
                  </button>
                )}
              </div>
              {e.comentario && <p className="mb-2 text-sm text-ink-soft">{e.comentario}</p>}
              <div className="flex gap-2">
                <input
                  type="number"
                  className="input !w-24"
                  placeholder={`/${tarea.puntos_max}`}
                  value={notas[e.id]?.calificacion ?? ''}
                  onChange={(ev) => setNotas((n) => ({ ...n, [e.id]: { ...n[e.id], calificacion: ev.target.value } }))}
                />
                <input
                  className="input flex-1"
                  placeholder="Retroalimentación (opcional)"
                  value={notas[e.id]?.retroalimentacion ?? ''}
                  onChange={(ev) => setNotas((n) => ({ ...n, [e.id]: { ...n[e.id], retroalimentacion: ev.target.value } }))}
                />
                <button className="btn-primary !px-3" onClick={() => handleGuardar(e.id)}>Guardar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
