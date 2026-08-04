import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/ui/PageHeader'
import Spinner from '../../../components/Spinner'
import { DIAS_SEMANA } from '../../../lib/fechas'
import {
  crearModulo, actualizarModulo, obtenerModulo, listarDocentesDisponibles, asignarDocentes,
} from '../api'

export default function ModuloForm() {
  const { id, diplomadoId } = useParams()
  const editando = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '', descripcion: '', salon: '', dia_semana: '', hora_inicio: '', hora_fin: '',
    fecha_inicio: '', fecha_fin: '', fecha_limite_tareas: '', fecha_limite_notas: '',
    foro_habilitado: false, devocionales_habilitado: false, peticiones_habilitado: false,
  })
  const [docentes, setDocentes] = useState([])
  const [docentesSeleccionados, setDocentesSeleccionados] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    async function cargar() {
      const disponibles = await listarDocentesDisponibles()
      setDocentes(disponibles)
      if (editando) {
        const m = await obtenerModulo(id)
        setForm({
          nombre: m.nombre, descripcion: m.descripcion || '', salon: m.salon || '',
          dia_semana: m.dia_semana ?? '', hora_inicio: m.hora_inicio || '', hora_fin: m.hora_fin || '',
          fecha_inicio: m.fecha_inicio || '', fecha_fin: m.fecha_fin || '',
          fecha_limite_tareas: m.fecha_limite_tareas || '', fecha_limite_notas: m.fecha_limite_notas || '',
          foro_habilitado: m.foro_habilitado, devocionales_habilitado: m.devocionales_habilitado,
          peticiones_habilitado: m.peticiones_habilitado,
        })
        setDocentesSeleccionados(m.modulo_docentes.map((md) => md.docente.id))
      }
      setCargando(false)
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleDocente(docId) {
    setDocentesSeleccionados((sel) => (sel.includes(docId) ? sel.filter((x) => x !== docId) : [...sel, docId]))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const payload = {
      diplomado_id: diplomadoId || undefined,
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      salon: form.salon || null,
      dia_semana: form.dia_semana === '' ? null : Number(form.dia_semana),
      hora_inicio: form.hora_inicio || null,
      hora_fin: form.hora_fin || null,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
      fecha_limite_tareas: form.fecha_limite_tareas || null,
      fecha_limite_notas: form.fecha_limite_notas || null,
      foro_habilitado: form.foro_habilitado,
      devocionales_habilitado: form.devocionales_habilitado,
      peticiones_habilitado: form.peticiones_habilitado,
    }
    try {
      const m = editando ? await actualizarModulo(id, payload) : await crearModulo(payload)
      await asignarDocentes(m.id, docentesSeleccionados)
      navigate(`/modulos/${m.id}`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (cargando) return <Spinner />

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={editando ? 'Editar módulo' : 'Nuevo módulo'} />

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
        <div>
          <label className="label">Nombre</label>
          <input required className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea className="input" rows={2} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
        </div>

        <div>
          <label className="label">Docentes</label>
          <div className="flex flex-wrap gap-2">
            {docentes.length === 0 && <p className="text-sm text-ink-faint">No hay docentes creados todavía.</p>}
            {docentes.map((d) => (
              <button
                type="button"
                key={d.id}
                onClick={() => toggleDocente(d.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  docentesSeleccionados.includes(d.id) ? 'bg-brand text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'
                }`}
              >
                {d.nombre_completo}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Salón</label>
            <input className="input" value={form.salon} onChange={(e) => set('salon', e.target.value)} />
          </div>
          <div>
            <label className="label">Día</label>
            <select className="input" value={form.dia_semana} onChange={(e) => set('dia_semana', e.target.value)}>
              <option value="">—</option>
              {DIAS_SEMANA.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="label">Hora inicio</label>
              <input type="time" className="input" value={form.hora_inicio} onChange={(e) => set('hora_inicio', e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="label">Hora fin</label>
              <input type="time" className="input" value={form.hora_fin} onChange={(e) => set('hora_fin', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Fecha de inicio</label>
            <input type="date" className="input" value={form.fecha_inicio} onChange={(e) => set('fecha_inicio', e.target.value)} />
          </div>
          <div>
            <label className="label">Fecha de fin</label>
            <input type="date" className="input" value={form.fecha_fin} onChange={(e) => set('fecha_fin', e.target.value)} />
          </div>
          <div>
            <label className="label">Fecha límite de tareas</label>
            <input type="date" className="input" value={form.fecha_limite_tareas} onChange={(e) => set('fecha_limite_tareas', e.target.value)} />
          </div>
          <div>
            <label className="label">Fecha límite de notas</label>
            <input type="date" className="input" value={form.fecha_limite_notas} onChange={(e) => set('fecha_limite_notas', e.target.value)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {[
            ['foro_habilitado', 'Foro'],
            ['devocionales_habilitado', 'Devocionales'],
            ['peticiones_habilitado', 'Peticiones de oración'],
          ].map(([field, label]) => (
            <label key={field} className="flex items-center gap-2 text-sm font-medium text-ink">
              <input type="checkbox" checked={form[field]} onChange={(e) => set(field, e.target.checked)} />
              {label}
            </label>
          ))}
        </div>

        {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>}
        <div className="flex gap-2">
          <button disabled={busy} className="btn-primary">{busy ? 'Guardando…' : 'Guardar'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
        </div>
      </form>
    </div>
  )
}
