import { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import PageHeader from '../../../components/ui/PageHeader'
import Icon from '../../../components/ui/Icon'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import Modal from '../../../components/Modal'
import { ROLES } from '../../../lib/roles'
import { listarCategorias, crearCategoria, listarRecursos, crearRecurso, eliminarRecurso, abrirRecurso } from '../api'

export default function Biblioteca() {
  const { profile } = useAuth()
  const esAdmin = profile.role === ROLES.ADMINISTRADOR
  const [categorias, setCategorias] = useState(null)
  const [categoriaActiva, setCategoriaActiva] = useState(null)
  const [recursos, setRecursos] = useState(null)
  const [modalCategoria, setModalCategoria] = useState(false)
  const [modalRecurso, setModalRecurso] = useState(false)

  async function cargarCategorias() {
    setCategorias(await listarCategorias())
  }

  async function cargarRecursos() {
    setRecursos(await listarRecursos(categoriaActiva))
  }

  useEffect(() => { cargarCategorias() }, [])
  useEffect(() => {
    cargarRecursos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoriaActiva])

  if (categorias === null || recursos === null) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Biblioteca institucional"
        subtitle="Plantillas, logos, manuales, reglamentos y formatos del instituto."
        actions={esAdmin && (
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setModalCategoria(true)}>
              <Icon name="plus" className="h-4 w-4" /> Categoría
            </button>
            <button className="btn-primary" onClick={() => setModalRecurso(true)}>
              <Icon name="plus" className="h-4 w-4" /> Recurso
            </button>
          </div>
        )}
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setCategoriaActiva(null)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${!categoriaActiva ? 'bg-brand text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'}`}
        >
          Todos
        </button>
        {categorias.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategoriaActiva(c.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${categoriaActiva === c.id ? 'bg-brand text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'}`}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {recursos.length === 0 ? (
        <EmptyState icon="folder" title="Sin recursos en esta categoría" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recursos.map((r) => (
            <div key={r.id} className="card flex items-center justify-between gap-3">
              <button className="flex flex-1 items-center gap-3 text-left" onClick={async () => window.open(await abrirRecurso(r), '_blank')}>
                <Icon name={r.tipo === 'enlace' ? 'chat' : 'download'} className="h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{r.titulo}</p>
                  {r.descripcion && <p className="truncate text-xs text-ink-faint">{r.descripcion}</p>}
                </div>
              </button>
              {esAdmin && (
                <button className="btn-ghost !px-2 !py-1 text-danger-600" onClick={() => eliminarRecurso(r).then(cargarRecursos)}>
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {modalCategoria && (
        <NuevaCategoriaModal
          institucionId={profile.institucion_id}
          orden={categorias.length}
          onClose={() => { setModalCategoria(false); cargarCategorias() }}
        />
      )}
      {modalRecurso && (
        <NuevoRecursoModal
          institucionId={profile.institucion_id}
          subidoPor={profile.id}
          categorias={categorias}
          onClose={() => { setModalRecurso(false); cargarRecursos() }}
        />
      )}
    </div>
  )
}

function NuevaCategoriaModal({ institucionId, orden, onClose }) {
  const [nombre, setNombre] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    await crearCategoria(institucionId, nombre, orden)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title="Nueva categoría">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="label">Nombre</label>
          <input required className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Plantillas PowerPoint, Manuales…" />
        </div>
        <button className="btn-primary">Crear</button>
      </form>
    </Modal>
  )
}

function NuevoRecursoModal({ institucionId, subidoPor, categorias, onClose }) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [urlExterna, setUrlExterna] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!archivo && !urlExterna) return setError('Sube un archivo o pega un enlace.')
    setBusy(true)
    try {
      await crearRecurso({ institucionId, categoriaId: categoriaId || null, titulo, descripcion, urlExterna, archivo, subidoPor })
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Nuevo recurso">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="label">Título</label>
          <input required className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>
        <div>
          <label className="label">Descripción</label>
          <input className="input" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </div>
        <div>
          <label className="label">Categoría</label>
          <select className="input" value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
            <option value="">Sin categoría</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Enlace (opcional)</label>
          <input className="input" value={urlExterna} onChange={(e) => setUrlExterna(e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="label">O sube un archivo</label>
          <input type="file" className="input" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
        </div>
        {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>}
        <button disabled={busy} className="btn-primary">{busy ? 'Subiendo…' : 'Guardar'}</button>
      </form>
    </Modal>
  )
}
