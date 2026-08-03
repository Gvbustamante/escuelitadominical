import { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import Icon from '../../../components/ui/Icon'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import { urlFirmada } from '../../../lib/storage'
import { listarRecursos, crearRecurso, eliminarRecurso, BUCKET_RECURSOS } from '../api'

const TIPOS = [
  { value: 'video', label: 'Video', icon: 'download' },
  { value: 'pdf', label: 'PDF', icon: 'download' },
  { value: 'presentacion', label: 'Presentación', icon: 'download' },
  { value: 'otro', label: 'Otro', icon: 'download' },
]

export default function RecursosPanel({ moduloId, puedeGestionar }) {
  const { profile } = useAuth()
  const [recursos, setRecursos] = useState(null)
  const [form, setForm] = useState(false)
  const [tipo, setTipo] = useState('pdf')
  const [titulo, setTitulo] = useState('')
  const [urlExterna, setUrlExterna] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function cargar() {
    setRecursos(await listarRecursos(moduloId))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduloId])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!archivo && !urlExterna) return setError('Sube un archivo o pega un enlace.')
    setBusy(true)
    try {
      await crearRecurso({ moduloId, institucionId: profile.institucion_id, tipo, titulo, urlExterna, archivo })
      setForm(false)
      setTitulo('')
      setUrlExterna('')
      setArchivo(null)
      cargar()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleAbrir(recurso) {
    if (recurso.url_externa) return window.open(recurso.url_externa, '_blank')
    const url = await urlFirmada(BUCKET_RECURSOS, recurso.storage_path)
    window.open(url, '_blank')
  }

  async function handleEliminar(recurso) {
    await eliminarRecurso(recurso)
    cargar()
  }

  if (recursos === null) return <Spinner />

  return (
    <div>
      {puedeGestionar && (
        <div className="card mb-4 !p-4">
          {!form ? (
            <button className="btn-secondary" onClick={() => setForm(true)}>
              <Icon name="plus" className="h-4 w-4" /> Agregar recurso
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Tipo</label>
                  <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                    {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Título</label>
                  <input required className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Enlace (opcional, ej. video de YouTube)</label>
                <input className="input" value={urlExterna} onChange={(e) => setUrlExterna(e.target.value)} placeholder="https://…" />
              </div>
              <div>
                <label className="label">O sube un archivo</label>
                <input type="file" className="input" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
              </div>
              {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>}
              <div className="flex gap-2">
                <button disabled={busy} className="btn-primary">{busy ? 'Subiendo…' : 'Guardar'}</button>
                <button type="button" className="btn-secondary" onClick={() => setForm(false)}>Cancelar</button>
              </div>
            </form>
          )}
        </div>
      )}

      {recursos.length === 0 ? (
        <EmptyState icon="folder" title="Sin recursos todavía" description={puedeGestionar ? 'Agrega el primero arriba.' : undefined} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {recursos.map((r) => (
            <div key={r.id} className="card flex items-center justify-between gap-3">
              <button className="flex flex-1 items-center gap-3 text-left" onClick={() => handleAbrir(r)}>
                <Icon name="download" className="h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{r.titulo}</p>
                  <p className="text-xs uppercase text-ink-faint">{r.tipo}</p>
                </div>
              </button>
              {puedeGestionar && (
                <button className="btn-ghost !px-2 !py-1 text-danger-600" onClick={() => handleEliminar(r)}>
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
