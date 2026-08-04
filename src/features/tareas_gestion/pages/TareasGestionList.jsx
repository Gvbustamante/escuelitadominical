import { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import PageHeader from '../../../components/ui/PageHeader'
import Icon from '../../../components/ui/Icon'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import Modal from '../../../components/Modal'
import { ROLES } from '../../../lib/roles'
import {
  listarTareas, listarResponsablesDisponibles, crearTarea, actualizarEstado,
  listarComentarios, crearComentario, listarArchivos, subirArchivoTarea, verArchivoTarea, listarHistorial,
} from '../api'

const PRIORIDAD_TONE = { baja: 'neutral', media: 'brand', alta: 'warning', urgente: 'danger' }
const PRIORIDAD_LABEL = { baja: 'Baja', media: 'Media', alta: 'Alta', urgente: 'Urgente' }
const ESTADO_TONE = { pendiente: 'neutral', en_progreso: 'brand', completada: 'success', cancelada: 'danger' }
const ESTADO_LABEL = { pendiente: 'Pendiente', en_progreso: 'En progreso', completada: 'Completada', cancelada: 'Cancelada' }
const ESTADOS = ['pendiente', 'en_progreso', 'completada', 'cancelada']

export default function TareasGestionList() {
  const { profile } = useAuth()
  const [tareas, setTareas] = useState(null)
  const [form, setForm] = useState(false)
  const [tareaAbierta, setTareaAbierta] = useState(null)
  const puedeAsignar = profile.role === ROLES.ADMINISTRADOR || profile.role === ROLES.LIDER

  async function cargar() {
    setTareas(await listarTareas())
  }

  useEffect(() => { cargar() }, [])

  if (tareas === null) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Tareas administrativas"
        subtitle="Trabajo interno asignado por administración/liderazgo, distinto de las tareas académicas."
        actions={puedeAsignar && (
          <button className="btn-primary" onClick={() => setForm(true)}>
            <Icon name="plus" className="h-4 w-4" /> Asignar tarea
          </button>
        )}
      />

      {tareas.length === 0 ? (
        <EmptyState icon="check-square" title="Sin tareas asignadas" />
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="table-base">
            <thead><tr><th>Título</th><th>Responsable</th><th>Prioridad</th><th>Vence</th><th>Estado</th></tr></thead>
            <tbody>
              {tareas.map((t) => (
                <tr key={t.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setTareaAbierta(t)}>
                  <td className="font-medium text-ink">{t.titulo}</td>
                  <td>{t.responsable?.nombre_completo}</td>
                  <td><Badge tone={PRIORIDAD_TONE[t.prioridad]}>{PRIORIDAD_LABEL[t.prioridad]}</Badge></td>
                  <td>{t.fecha_limite || '—'}</td>
                  <td><Badge tone={ESTADO_TONE[t.estado]}>{ESTADO_LABEL[t.estado]}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && <NuevaTareaModal onClose={() => { setForm(false); cargar() }} />}
      {tareaAbierta && <TareaDetalleModal tarea={tareaAbierta} onClose={() => { setTareaAbierta(null); cargar() }} />}
    </div>
  )
}

function NuevaTareaModal({ onClose }) {
  const { profile } = useAuth()
  const [responsables, setResponsables] = useState(null)
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [responsableId, setResponsableId] = useState('')
  const [prioridad, setPrioridad] = useState('media')
  const [fechaLimite, setFechaLimite] = useState('')

  useEffect(() => {
    listarResponsablesDisponibles(profile.role, profile.id).then((data) => {
      setResponsables(data)
      if (data[0]) setResponsableId(data[0].id)
    })
  }, [profile.role, profile.id])

  async function handleSubmit(e) {
    e.preventDefault()
    await crearTarea({
      institucionId: profile.institucion_id, titulo, descripcion, responsableId,
      asignadoPor: profile.id, prioridad, fechaLimite,
    })
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Asignar tarea">
      {responsables === null ? (
        <Spinner />
      ) : responsables.length === 0 ? (
        // Le pasa a un líder que todavía no tiene docentes asignados a los módulos de su
        // diplomado: solo puede asignarles tareas a ellos, así que no hay a quién elegir.
        // Sin este aviso vería un desplegable vacío y el guardado fallaría contra la RLS.
        <div className="flex flex-col gap-3 py-2 text-center">
          <p className="text-sm text-ink-soft">
            Todavía no tienes a quién asignarle tareas. Asigna docentes a los módulos de tu
            diplomado y aparecerán aquí.
          </p>
          <button className="btn-secondary justify-center" onClick={onClose}>Entendido</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="label">Título</label>
            <input required className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea className="input" rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Responsable</label>
              <select className="input" value={responsableId} onChange={(e) => setResponsableId(e.target.value)}>
                {responsables.map((r) => <option key={r.id} value={r.id}>{r.nombre_completo}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Prioridad</label>
              <select className="input" value={prioridad} onChange={(e) => setPrioridad(e.target.value)}>
                {Object.entries(PRIORIDAD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Fecha límite</label>
            <input type="date" className="input" value={fechaLimite} onChange={(e) => setFechaLimite(e.target.value)} />
          </div>
          <button className="btn-primary">Asignar</button>
        </form>
      )}
    </Modal>
  )
}

function TareaDetalleModal({ tarea, onClose }) {
  const { profile } = useAuth()
  const [comentarios, setComentarios] = useState(null)
  const [archivos, setArchivos] = useState(null)
  const [historial, setHistorial] = useState(null)
  const [comentario, setComentario] = useState('')

  async function cargar() {
    const [c, a, h] = await Promise.all([listarComentarios(tarea.id), listarArchivos(tarea.id), listarHistorial(tarea.id)])
    setComentarios(c); setArchivos(a); setHistorial(h)
  }

  useEffect(() => { cargar() }, [tarea.id])

  async function handleEstado(nuevo) {
    await actualizarEstado(tarea, nuevo, profile.id)
    cargar()
  }

  async function handleComentar(e) {
    e.preventDefault()
    if (!comentario.trim()) return
    await crearComentario(tarea.id, profile.id, comentario)
    setComentario('')
    cargar()
  }

  async function handleArchivo(e) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    await subirArchivoTarea(tarea.id, profile.institucion_id, profile.id, archivo)
    cargar()
  }

  return (
    <Modal open onClose={onClose} title={tarea.titulo}>
      <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto">
        {tarea.descripcion && <p className="text-sm text-ink-soft">{tarea.descripcion}</p>}

        <div>
          <label className="label">Estado</label>
          <div className="flex flex-wrap gap-2">
            {ESTADOS.map((e) => (
              <button
                key={e}
                onClick={() => handleEstado(e)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  tarea.estado === e ? 'bg-brand text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'
                }`}
              >
                {ESTADO_LABEL[e]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Archivos</label>
          <input type="file" className="input mb-2" onChange={handleArchivo} />
          {archivos === null ? <Spinner /> : archivos.length === 0 ? (
            <p className="text-sm text-ink-faint">Sin archivos.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {archivos.map((a) => (
                <li key={a.id}>
                  <button className="text-sm font-medium text-brand hover:underline" onClick={async () => window.open(await verArchivoTarea(a.storage_path), '_blank')}>
                    📎 {a.nombre_archivo}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="label">Comentarios</label>
          {comentarios === null ? <Spinner /> : (
            <div className="flex flex-col gap-2">
              {comentarios.map((c) => (
                <div key={c.id} className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-medium text-ink">{c.autor?.nombre_completo}</p>
                  <p className="text-ink-soft">{c.comentario}</p>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={handleComentar} className="mt-2 flex gap-2">
            <input className="input flex-1" value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Escribe un comentario…" />
            <button className="btn-secondary !px-3">Enviar</button>
          </form>
        </div>

        {historial && historial.length > 0 && (
          <div>
            <label className="label">Historial</label>
            <ul className="text-xs text-ink-faint">
              {historial.map((h) => (
                <li key={h.id}>{h.cambiado_por_perfil?.nombre_completo} cambió {h.campo} de "{h.valor_anterior}" a "{h.valor_nuevo}"</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}
