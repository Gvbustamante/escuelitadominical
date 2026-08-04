import { useEffect, useState } from 'react'
import Modal from '../../../components/Modal'
import ImagenUpload from '../../../components/ui/ImagenUpload'
import { useAuth } from '../../../contexts/AuthContext'
import { paraInputDateTime } from '../../../lib/fechas'
import { TIPOS_EVENTO, VISIBILIDADES } from '../tipos'
import { crearEvento, actualizarEvento } from '../api'

const VACIO = {
  titulo: '', descripcion: '', tipo: 'general', fecha_inicio: '', fecha_fin: '',
  todo_el_dia: false, lugar: '', imagen_url: null, destacado: false, visible_para: 'todos',
}

export default function EventoModal({ open, evento, onClose, onGuardado }) {
  const { profile } = useAuth()
  const [form, setForm] = useState(VACIO)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    setForm(
      evento
        ? {
            titulo: evento.titulo,
            descripcion: evento.descripcion || '',
            tipo: evento.tipo,
            fecha_inicio: paraInputDateTime(evento.fecha_inicio),
            fecha_fin: paraInputDateTime(evento.fecha_fin),
            todo_el_dia: evento.todo_el_dia,
            lugar: evento.lugar || '',
            imagen_url: evento.imagen_url,
            destacado: evento.destacado,
            visible_para: evento.visible_para,
          }
        : VACIO,
    )
  }, [open, evento])

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const payload = {
        institucion_id: profile.institucion_id,
        titulo: form.titulo,
        descripcion: form.descripcion || null,
        tipo: form.tipo,
        // El <input datetime-local> entrega hora local sin zona; new Date() la interpreta como
        // local y toISOString la normaliza a UTC, que es lo que espera la columna timestamptz.
        fecha_inicio: new Date(form.fecha_inicio).toISOString(),
        fecha_fin: form.fecha_fin ? new Date(form.fecha_fin).toISOString() : null,
        todo_el_dia: form.todo_el_dia,
        lugar: form.lugar || null,
        imagen_url: form.imagen_url,
        destacado: form.destacado,
        visible_para: form.visible_para,
        creado_por: profile.id,
      }
      if (evento) await actualizarEvento(evento.id, payload)
      else await crearEvento(payload)
      onGuardado()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={evento ? 'Editar evento' : 'Nuevo evento'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="label">Título</label>
          <input required className="input" value={form.titulo} onChange={(e) => set('titulo', e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Tipo</label>
            <select className="input" value={form.tipo} onChange={(e) => set('tipo', e.target.value)}>
              {TIPOS_EVENTO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Lugar</label>
            <input className="input" value={form.lugar} onChange={(e) => set('lugar', e.target.value)} placeholder="Auditorio, salón 3…" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Inicio</label>
            <input
              required
              type="datetime-local"
              className="input"
              value={form.fecha_inicio}
              onChange={(e) => set('fecha_inicio', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Fin (opcional)</label>
            <input
              type="datetime-local"
              className="input"
              value={form.fecha_fin}
              min={form.fecha_inicio || undefined}
              onChange={(e) => set('fecha_fin', e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label">Descripción</label>
          <textarea className="input" rows={3} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)} />
        </div>

        <ImagenUpload
          bucket="eventos"
          institucionId={profile.institucion_id}
          valor={form.imagen_url}
          onChange={(url) => set('imagen_url', url)}
          etiqueta="Imagen del evento"
        />

        <div>
          <label className="label">Quién lo ve</label>
          <select className="input" value={form.visible_para} onChange={(e) => set('visible_para', e.target.value)}>
            {VISIBILIDADES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" checked={form.todo_el_dia} onChange={(e) => set('todo_el_dia', e.target.checked)} />
            Todo el día
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input type="checkbox" checked={form.destacado} onChange={(e) => set('destacado', e.target.checked)} />
            Destacar en el inicio
          </label>
          {form.destacado && (
            <p className="text-xs text-ink-faint">
              Su imagen se muestra como banner en la pantalla de inicio de todos. Solo puede haber un
              evento destacado: si ya hay otro, este lo reemplaza.
            </p>
          )}
        </div>

        {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>}

        <button disabled={busy} className="btn-primary justify-center">
          {busy ? 'Guardando…' : evento ? 'Guardar cambios' : 'Crear evento'}
        </button>
      </form>
    </Modal>
  )
}
