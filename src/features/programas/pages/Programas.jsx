import { useEffect, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import Icon from '../../../components/ui/Icon'
import Modal from '../../../components/Modal'
import Spinner from '../../../components/Spinner'
import { useAuth } from '../../../contexts/AuthContext'
import { listarProgramas, crearPrograma, codigoSugerido } from '../api'

export default function Programas() {
  const { institucion } = useAuth()
  const [programas, setProgramas] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  async function cargar() {
    setProgramas(await listarProgramas())
  }

  useEffect(() => { cargar() }, [])

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Programas"
        subtitle="Cada programa es independiente: sus usuarios, sus diplomados, su dinero y sus colores no se mezclan con los de los demás."
        actions={
          <button className="btn-primary" onClick={() => setModalAbierto(true)}>
            <Icon name="plus" className="h-4 w-4" /> Nuevo programa
          </button>
        }
      />

      {programas === null ? (
        <Spinner />
      ) : (
        <ul className="flex flex-col gap-3">
          {programas.map((p) => (
            <li key={p.id} className="card flex flex-wrap items-center gap-3">
              <span
                className="h-8 w-8 shrink-0 rounded-md border border-slate-200"
                style={{ backgroundColor: p.color_primario }}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">
                  {p.nombre}
                  {p.id === institucion?.id && (
                    <span className="badge ml-2 bg-brand-50 text-brand">Estás aquí</span>
                  )}
                  {!p.activo && <span className="badge ml-2 bg-slate-100 text-ink-soft">Inactivo</span>}
                </p>
                <p className="text-sm text-ink-soft">
                  Código: <span className="font-mono font-medium text-ink">{p.slug}</span>
                </p>
              </div>
              <EnlaceAcceso slug={p.slug} />
            </li>
          ))}
        </ul>
      )}

      <NuevoProgramaModal
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        onCreado={cargar}
      />
    </div>
  )
}

function EnlaceAcceso({ slug }) {
  const [copiado, setCopiado] = useState(false)
  // Enlace de acceso directo: lleva el código precargado, así nadie tiene que escribirlo.
  const url = `${window.location.origin}${window.location.pathname}#/login/${slug}`

  async function copiar() {
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <button onClick={copiar} className="btn-secondary !px-3 !py-1.5 text-xs">
      {copiado ? 'Copiado' : 'Copiar enlace de acceso'}
    </button>
  )
}

const VACIO = { nombre: '', codigo: '', adminNombre: '', adminEmail: '', adminDocumento: '', colorPrimario: '#2952e3' }

function NuevoProgramaModal({ open, onClose, onCreado }) {
  const [form, setForm] = useState(VACIO)
  const [codigoTocado, setCodigoTocado] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [creado, setCreado] = useState(null)

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  function cambiarNombre(valor) {
    // Mientras nadie edite el código a mano, se mantiene sincronizado con el nombre.
    setForm((f) => ({ ...f, nombre: valor, codigo: codigoTocado ? f.codigo : codigoSugerido(valor) }))
  }

  function cerrar() {
    setForm(VACIO)
    setCodigoTocado(false)
    setError('')
    setCreado(null)
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.adminEmail && !form.adminDocumento) {
      setError('El primer administrador necesita un correo o un documento de identidad.')
      return
    }
    setBusy(true)
    try {
      setCreado(await crearPrograma(form))
      onCreado()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={cerrar} title={creado ? 'Programa creado' : 'Nuevo programa'}>
      {creado ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Icon name="check-circle" className="h-6 w-6 text-success-500" />
            <p className="font-medium text-ink">Ya puede entrar su administrador.</p>
          </div>

          <div className="rounded-md bg-slate-50 p-3 text-sm">
            <Dato etiqueta="Código del programa" valor={creado.codigo} />
            <Dato etiqueta="Usuario" valor={creado.usuario} />
            <Dato etiqueta="Contraseña temporal" valor={creado.password} />
          </div>

          <p className="text-xs text-ink-faint">
            Esta contraseña no se puede volver a consultar: la base solo guarda su versión cifrada.
            Cópiala ahora y entrégala por un canal seguro. Se le pedirá cambiarla al entrar, y desde
            ahí podrá crear los demás administradores y usuarios de su programa.
          </p>

          <button className="btn-primary justify-center" onClick={cerrar}>Listo</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="label">Nombre del programa</label>
            <input required className="input" value={form.nombre} onChange={(e) => cambiarNombre(e.target.value)} placeholder="ELID, Instituto Bíblico…" />
          </div>

          <div>
            <label className="label">Código</label>
            <input
              required
              className="input font-mono"
              value={form.codigo}
              onChange={(e) => { setCodigoTocado(true); set('codigo', e.target.value) }}
              placeholder="elid"
            />
            <p className="mt-1 text-xs text-ink-faint">
              Es lo que su gente escribe al entrar. Solo minúsculas, números y guiones. No se puede
              cambiar después sin reemplazar el usuario de todos.
            </p>
          </div>

          <div>
            <label className="label">Color del programa</label>
            <input type="color" className="h-10 w-20 cursor-pointer rounded-md border border-slate-300" value={form.colorPrimario} onChange={(e) => set('colorPrimario', e.target.value)} />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-sm font-semibold text-ink">Primer administrador</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="label">Nombre completo</label>
                <input required className="input" value={form.adminNombre} onChange={(e) => set('adminNombre', e.target.value)} />
              </div>
              <div>
                <label className="label">Correo (si tiene)</label>
                <input type="email" className="input" value={form.adminEmail} onChange={(e) => set('adminEmail', e.target.value)} />
              </div>
              <div>
                <label className="label">O documento de identidad</label>
                <input className="input" value={form.adminDocumento} onChange={(e) => set('adminDocumento', e.target.value)} />
                <p className="mt-1 text-xs text-ink-faint">
                  Con correo entra con su correo; sin correo, con su documento y el código del programa.
                </p>
              </div>
            </div>
          </div>

          {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>}

          <button disabled={busy} className="btn-primary justify-center">
            {busy ? 'Creando…' : 'Crear programa'}
          </button>
        </form>
      )}
    </Modal>
  )
}

function Dato({ etiqueta, valor }) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-xs text-ink-soft">{etiqueta}</p>
      <p className="select-all font-mono text-sm font-semibold text-ink">{valor}</p>
    </div>
  )
}
