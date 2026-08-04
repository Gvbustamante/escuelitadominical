import { useEffect, useState } from 'react'
import Modal from '../../../components/Modal'
import ImagenUpload from '../../../components/ui/ImagenUpload'
import { useAuth } from '../../../contexts/AuthContext'
import { claveDia } from '../../../lib/fechas'
import { crearDevocional, actualizarDevocional } from '../api'

function vacio() {
  return { titulo: '', referencia_biblica: '', contenido: '', imagen_url: null, fecha: claveDia(new Date()) }
}

export default function DevocionalModal({ open, devocional, moduloId = null, onClose, onGuardado }) {
  const { profile } = useAuth()
  const [form, setForm] = useState(vacio)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    setForm(
      devocional
        ? {
            titulo: devocional.titulo,
            referencia_biblica: devocional.referencia_biblica || '',
            contenido: devocional.contenido,
            imagen_url: devocional.imagen_url,
            fecha: devocional.fecha,
          }
        : vacio(),
    )
  }, [open, devocional])

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
        modulo_id: moduloId,
        titulo: form.titulo,
        referencia_biblica: form.referencia_biblica || null,
        contenido: form.contenido,
        imagen_url: form.imagen_url,
        fecha: form.fecha,
        creado_por: profile.id,
      }
      if (devocional) await actualizarDevocional(devocional.id, payload)
      else await crearDevocional(payload)
      onGuardado()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={devocional ? 'Editar devocional' : 'Nuevo devocional'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="label">Título</label>
          <input required className="input" value={form.titulo} onChange={(e) => set('titulo', e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Referencia bíblica</label>
            <input
              className="input"
              value={form.referencia_biblica}
              onChange={(e) => set('referencia_biblica', e.target.value)}
              placeholder="Juan 3:16"
            />
          </div>
          <div>
            <label className="label">Fecha</label>
            <input required type="date" className="input" value={form.fecha} onChange={(e) => set('fecha', e.target.value)} />
          </div>
        </div>

        <div>
          <label className="label">Contenido</label>
          <textarea
            required
            className="input"
            rows={8}
            value={form.contenido}
            onChange={(e) => set('contenido', e.target.value)}
            placeholder="Escribe aquí la reflexión…"
          />
        </div>

        <ImagenUpload
          bucket="devocionales"
          institucionId={profile.institucion_id}
          valor={form.imagen_url}
          onChange={(url) => set('imagen_url', url)}
          etiqueta="Imagen (opcional)"
        />

        {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>}

        <button disabled={busy} className="btn-primary justify-center">
          {busy ? 'Guardando…' : devocional ? 'Guardar cambios' : 'Publicar devocional'}
        </button>
      </form>
    </Modal>
  )
}
