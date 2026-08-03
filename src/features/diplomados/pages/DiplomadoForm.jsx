import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../../../components/ui/PageHeader'
import Spinner from '../../../components/Spinner'
import { crearDiplomado, actualizarDiplomado, obtenerDiplomado, listarLideresDisponibles } from '../api'

const ESTADOS = [
  { value: 'planificacion', label: 'En planificación' },
  { value: 'activo', label: 'Activo' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'archivado', label: 'Archivado' },
]

export default function DiplomadoForm() {
  const { id } = useParams()
  const editando = !!id
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '', descripcion: '', lider_id: '', estado: 'planificacion', fecha_inicio: '', fecha_fin: '',
  })
  const [lideres, setLideres] = useState([])
  const [cargando, setCargando] = useState(editando)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    async function cargar() {
      let liderActualId = null
      if (editando) {
        const d = await obtenerDiplomado(id)
        liderActualId = d.lider_id
        setForm({
          nombre: d.nombre, descripcion: d.descripcion || '', lider_id: d.lider_id || '',
          estado: d.estado, fecha_inicio: d.fecha_inicio || '', fecha_fin: d.fecha_fin || '',
        })
      }
      const disponibles = await listarLideresDisponibles(liderActualId)
      setLideres(disponibles)
      setCargando(false)
    }
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      lider_id: form.lider_id || null,
      estado: form.estado,
      fecha_inicio: form.fecha_inicio || null,
      fecha_fin: form.fecha_fin || null,
    }
    try {
      const d = editando ? await actualizarDiplomado(id, payload) : await crearDiplomado(payload)
      navigate(`/diplomados/${d.id}`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  if (cargando) return <Spinner />

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={editando ? 'Editar diplomado' : 'Nuevo diplomado'} />

      <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
        <div>
          <label className="label">Nombre</label>
          <input required className="input" value={form.nombre} onChange={(e) => set('nombre', e.target.value)} />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea className="input" rows={3} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Líder</label>
            <select className="input" value={form.lider_id} onChange={(e) => set('lider_id', e.target.value)}>
              <option value="">Sin asignar</option>
              {lideres.map((l) => (
                <option key={l.id} value={l.id}>{l.nombre_completo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={form.estado} onChange={(e) => set('estado', e.target.value)}>
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
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
