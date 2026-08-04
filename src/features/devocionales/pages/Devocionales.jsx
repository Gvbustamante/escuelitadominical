import { useEffect, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Icon from '../../../components/ui/Icon'
import Spinner from '../../../components/Spinner'
import { useAuth } from '../../../contexts/AuthContext'
import { STAFF_ROLES } from '../../../lib/roles'
import { formatoFecha } from '../../../lib/fechas'
import { listarDevocionales, eliminarDevocional } from '../api'
import DevocionalModal from '../components/DevocionalModal'

export default function Devocionales() {
  const { profile } = useAuth()
  const esStaff = STAFF_ROLES.includes(profile.role)

  const [devocionales, setDevocionales] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [enEdicion, setEnEdicion] = useState(null)

  async function cargar() {
    setDevocionales(await listarDevocionales())
  }

  useEffect(() => { cargar() }, [])

  function abrirNuevo() {
    setEnEdicion(null)
    setModalAbierto(true)
  }

  async function borrar(devocional) {
    if (!window.confirm(`¿Eliminar el devocional "${devocional.titulo}"?`)) return
    await eliminarDevocional(devocional.id)
    cargar()
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Devocionales"
        subtitle="Reflexiones y palabra para la comunidad del instituto."
        actions={
          esStaff && (
            <button className="btn-primary" onClick={abrirNuevo}>
              <Icon name="plus" className="h-4 w-4" /> Nuevo devocional
            </button>
          )
        }
      />

      {devocionales === null ? (
        <Spinner />
      ) : devocionales.length === 0 ? (
        <EmptyState
          icon="book"
          title="Todavía no hay devocionales"
          description={esStaff ? 'Publica el primero con el botón de arriba.' : 'Aquí aparecerán las reflexiones que publique el equipo.'}
        />
      ) : (
        <ul className="flex flex-col gap-5">
          {devocionales.map((d) => (
            <TarjetaDevocional
              key={d.id}
              devocional={d}
              // Cada quien edita lo suyo; el administrador puede moderar todo (la RLS ya deja
              // escribir a todo el staff, así que aquí solo se evita mostrar botones inútiles).
              puedeEditar={esStaff && (d.creado_por === profile.id || profile.role === 'administrador')}
              onEditar={() => { setEnEdicion(d); setModalAbierto(true) }}
              onBorrar={() => borrar(d)}
            />
          ))}
        </ul>
      )}

      {esStaff && (
        <DevocionalModal
          open={modalAbierto}
          devocional={enEdicion}
          moduloId={enEdicion?.modulo_id ?? null}
          onClose={() => setModalAbierto(false)}
          onGuardado={cargar}
        />
      )}
    </div>
  )
}

function TarjetaDevocional({ devocional, puedeEditar, onEditar, onBorrar }) {
  return (
    <li className="card overflow-hidden !p-0">
      {devocional.imagen_url && (
        <img src={devocional.imagen_url} alt="" className="block max-h-72 w-full object-cover" />
      )}

      <div className="p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
          <span>{formatoFecha(devocional.fecha)}</span>
          {devocional.autor && <span>· {devocional.autor.nombre_completo}</span>}
          {devocional.modulo && <span className="badge bg-slate-100 text-ink-soft">{devocional.modulo.nombre}</span>}
        </div>

        <h3 className="text-lg font-semibold text-ink">{devocional.titulo}</h3>
        {devocional.referencia_biblica && (
          <p className="mt-0.5 text-sm font-medium text-brand">{devocional.referencia_biblica}</p>
        )}

        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{devocional.contenido}</p>

        {puedeEditar && (
          <div className="mt-4 flex gap-2">
            <button className="btn-ghost !px-2 !py-1 text-xs" onClick={onEditar}>
              <Icon name="pencil" className="h-3.5 w-3.5" /> Editar
            </button>
            <button className="btn-ghost !px-2 !py-1 text-xs text-danger-600" onClick={onBorrar}>
              <Icon name="trash" className="h-3.5 w-3.5" /> Eliminar
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
