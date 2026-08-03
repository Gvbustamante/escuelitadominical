import { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import PageHeader from '../../../components/ui/PageHeader'
import Icon from '../../../components/ui/Icon'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import Modal from '../../../components/Modal'
import { ROLE_LABELS } from '../../../lib/roles'
import {
  listarContactosDisponibles, listarConversaciones, obtenerOCrearConversacion,
  listarMensajes, enviarMensaje, fijarMensaje, marcarLeido, verAdjunto,
} from '../api'

export default function Comunicacion() {
  const { profile } = useAuth()
  const [conversaciones, setConversaciones] = useState(null)
  const [activa, setActiva] = useState(null)
  const [contactosOpen, setContactosOpen] = useState(false)

  async function cargarConversaciones() {
    setConversaciones(await listarConversaciones(profile.id))
  }

  useEffect(() => {
    cargarConversaciones()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function abrirConversacionCon(contacto) {
    const id = await obtenerOCrearConversacion(profile.institucion_id, profile.id, contacto.id)
    setContactosOpen(false)
    await cargarConversaciones()
    setActiva(id)
  }

  if (conversaciones === null) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Comunicación institucional"
        actions={
          <button className="btn-primary" onClick={() => setContactosOpen(true)}>
            <Icon name="plus" className="h-4 w-4" /> Nueva conversación
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="card !p-0 lg:h-[65vh] lg:overflow-y-auto">
          {conversaciones.length === 0 ? (
            <EmptyState icon="chat" title="Sin conversaciones" description="Inicia la primera arriba." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {conversaciones.map((c) => {
                const ultimo = c.mensajes?.[c.mensajes.length - 1]
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setActiva(c.id)}
                      className={`w-full px-4 py-3 text-left ${activa === c.id ? 'bg-brand-50' : 'hover:bg-slate-50'}`}
                    >
                      <p className="truncate text-sm font-medium text-ink">{c.titulo || 'Conversación'}</p>
                      {ultimo && <p className="truncate text-xs text-ink-faint">{ultimo.contenido}</p>}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="card !p-0 lg:h-[65vh]">
          {activa ? (
            <ConversacionView conversacionId={activa} />
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <p className="text-sm text-ink-faint">Selecciona una conversación o inicia una nueva.</p>
            </div>
          )}
        </div>
      </div>

      {contactosOpen && (
        <ContactosModal
          role={profile.role}
          userId={profile.id}
          onSeleccionar={abrirConversacionCon}
          onClose={() => setContactosOpen(false)}
        />
      )}
    </div>
  )
}

function ContactosModal({ role, userId, onSeleccionar, onClose }) {
  const [contactos, setContactos] = useState(null)

  useEffect(() => {
    listarContactosDisponibles(role, userId).then(setContactos)
  }, [role, userId])

  return (
    <Modal open onClose={onClose} title="Iniciar conversación">
      {contactos === null ? (
        <Spinner />
      ) : contactos.length === 0 ? (
        <EmptyState icon="chat" title="No tienes contactos disponibles todavía" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {contactos.map((c) => (
            <li key={c.id}>
              <button className="flex w-full items-center justify-between px-2 py-2.5 text-left hover:bg-slate-50" onClick={() => onSeleccionar(c)}>
                <span className="font-medium text-ink">{c.nombre_completo}</span>
                <span className="text-xs text-ink-faint">{ROLE_LABELS[c.role]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

function ConversacionView({ conversacionId }) {
  const { profile } = useAuth()
  const [mensajes, setMensajes] = useState(null)
  const [texto, setTexto] = useState('')
  const [archivo, setArchivo] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function cargar() {
    const data = await listarMensajes(conversacionId)
    setMensajes(data)
    data.forEach((m) => { if (m.autor_id !== profile.id) marcarLeido(m.id, profile.id) })
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversacionId])

  async function handleEnviar(e) {
    e.preventDefault()
    if (!texto.trim() && !archivo) return
    setEnviando(true)
    await enviarMensaje({ conversacionId, autorId: profile.id, institucionId: profile.institucion_id, contenido: texto || '(archivo adjunto)', archivo })
    setTexto('')
    setArchivo(null)
    setEnviando(false)
    cargar()
  }

  async function handleFijar(m) {
    await fijarMensaje(m.id, !m.fijado)
    cargar()
  }

  if (mensajes === null) return <Spinner />

  const fijados = mensajes.filter((m) => m.fijado)

  return (
    <div className="flex h-full flex-col">
      {fijados.length > 0 && (
        <div className="border-b border-slate-100 bg-warning-50 px-4 py-2 text-xs text-warning-700">
          📌 {fijados[fijados.length - 1].contenido}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {mensajes.map((m) => (
            <div key={m.id} className={`max-w-[75%] rounded-md px-3 py-2 text-sm ${m.autor_id === profile.id ? 'ml-auto bg-brand text-white' : 'bg-slate-100 text-ink'}`}>
              {m.autor_id !== profile.id && <p className="text-xs font-semibold opacity-70">{m.autor?.nombre_completo}</p>}
              <p>{m.contenido}</p>
              {m.mensaje_adjuntos?.map((a) => (
                <button key={a.id} className="mt-1 block text-xs underline opacity-90" onClick={async () => window.open(await verAdjunto(a.storage_path), '_blank')}>
                  📎 {a.nombre_archivo}
                </button>
              ))}
              {profile.role === 'administrador' && (
                <button className="mt-1 block text-xs opacity-60 hover:opacity-100" onClick={() => handleFijar(m)}>
                  {m.fijado ? 'Quitar fijado' : 'Fijar'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={handleEnviar} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input className="input flex-1" placeholder="Escribe un mensaje…" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <input type="file" className="!w-32 text-xs" onChange={(e) => setArchivo(e.target.files?.[0] || null)} />
        <button disabled={enviando} className="btn-primary !px-3">Enviar</button>
      </form>
    </div>
  )
}
