import { useEffect, useState } from 'react'
import PageHeader from '../../../components/ui/PageHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Icon from '../../../components/ui/Icon'
import Spinner from '../../../components/Spinner'
import { useAuth } from '../../../contexts/AuthContext'
import { ROLES } from '../../../lib/roles'
import { formatoFecha, formatoHora, esHoy } from '../../../lib/fechas'
import { tipoEvento } from '../tipos'
import { listarProximosEventos, listarEventosPasados, eliminarEvento } from '../api'
import EventoModal from '../components/EventoModal'

const PESTANAS = [
  { key: 'proximos', label: 'Próximos' },
  { key: 'pasados', label: 'Pasados' },
]

export default function Agenda() {
  const { profile } = useAuth()
  const puedeGestionar = profile.role === ROLES.ADMINISTRADOR || profile.role === ROLES.LIDER

  const [pestana, setPestana] = useState('proximos')
  const [eventos, setEventos] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [enEdicion, setEnEdicion] = useState(null)

  async function cargar() {
    const data = pestana === 'proximos' ? await listarProximosEventos() : await listarEventosPasados()
    setEventos(data)
  }

  useEffect(() => {
    setEventos(null)
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pestana])

  function abrirNuevo() {
    setEnEdicion(null)
    setModalAbierto(true)
  }

  function abrirEdicion(evento) {
    setEnEdicion(evento)
    setModalAbierto(true)
  }

  async function borrar(evento) {
    if (!window.confirm(`¿Eliminar el evento "${evento.titulo}"?`)) return
    await eliminarEvento(evento.id)
    cargar()
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Agenda"
        subtitle="Conferencias, graduaciones, campañas y reuniones del instituto."
        actions={
          puedeGestionar && (
            <button className="btn-primary" onClick={abrirNuevo}>
              <Icon name="plus" className="h-4 w-4" /> Nuevo evento
            </button>
          )
        }
      />

      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {PESTANAS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPestana(p.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              pestana === p.key ? 'border-brand text-brand' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {eventos === null ? (
        <Spinner />
      ) : eventos.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={pestana === 'proximos' ? 'No hay eventos programados' : 'No hay eventos pasados'}
          description={
            puedeGestionar && pestana === 'proximos'
              ? 'Crea el primero con el botón de arriba.'
              : 'Aquí aparecerán los eventos del instituto.'
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {eventos.map((evento) => (
            <TarjetaEvento
              key={evento.id}
              evento={evento}
              puedeGestionar={puedeGestionar}
              onEditar={() => abrirEdicion(evento)}
              onBorrar={() => borrar(evento)}
            />
          ))}
        </ul>
      )}

      {puedeGestionar && (
        <EventoModal
          open={modalAbierto}
          evento={enEdicion}
          onClose={() => setModalAbierto(false)}
          onGuardado={cargar}
        />
      )}
    </div>
  )
}

function TarjetaEvento({ evento, puedeGestionar, onEditar, onBorrar }) {
  const tipo = tipoEvento(evento.tipo)

  return (
    <li className="card overflow-hidden !p-0">
      {evento.imagen_url && (
        <img src={evento.imagen_url} alt="" className="block max-h-64 w-full object-cover" />
      )}

      <div className="p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`badge ${tipo.chip}`}>{tipo.label}</span>
          {esHoy(evento.fecha_inicio) && <span className="badge bg-success-50 text-success-700">Hoy</span>}
          {evento.destacado && <span className="badge bg-brand-50 text-brand">Destacado</span>}
          {evento.visible_para === 'staff' && (
            <span className="badge bg-slate-100 text-ink-soft">Solo el equipo</span>
          )}
        </div>

        <h3 className="text-base font-semibold text-ink">{evento.titulo}</h3>

        <p className="mt-1 text-sm text-ink-soft">
          {formatoFecha(evento.fecha_inicio)}
          {!evento.todo_el_dia && ` · ${formatoHora(evento.fecha_inicio)}`}
          {evento.fecha_fin && !evento.todo_el_dia && ` – ${formatoHora(evento.fecha_fin)}`}
          {evento.todo_el_dia && ' · Todo el día'}
          {evento.lugar && ` · ${evento.lugar}`}
        </p>

        {evento.descripcion && (
          <p className="mt-2 whitespace-pre-line text-sm text-ink-soft">{evento.descripcion}</p>
        )}

        {puedeGestionar && (
          <div className="mt-3 flex gap-2">
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
