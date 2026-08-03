import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../../components/ui/PageHeader'
import Icon from '../../../components/ui/Icon'
import Spinner from '../../../components/Spinner'
import { useAuth } from '../../../contexts/AuthContext'
import { ROLES } from '../../../lib/roles'
import { obtenerModulo } from '../api'
import { obtenerDiplomado } from '../../diplomados/api'
import RecursosPanel from '../../recursos/components/RecursosPanel'
import TareasPanel from '../../tareas/components/TareasPanel'
import ExamenesPanel from '../../examenes/components/ExamenesPanel'
import AsistenciaPanel from '../../asistencia/components/AsistenciaPanel'
import CalificacionesPanel from '../../calificaciones/components/CalificacionesPanel'
import EvidenciasPanel from '../../evidencias/components/EvidenciasPanel'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const TABS_BASE = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'recursos', label: 'Recursos' },
  { key: 'tareas', label: 'Tareas' },
  { key: 'examenes', label: 'Exámenes' },
  { key: 'asistencia', label: 'Asistencia' },
  { key: 'calificaciones', label: 'Calificaciones' },
]
const TAB_EVIDENCIAS = { key: 'evidencias', label: 'Evidencias' }

export default function ModuloDetalle() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [modulo, setModulo] = useState(null)
  const [diplomado, setDiplomado] = useState(null)
  const [tab, setTab] = useState('resumen')

  useEffect(() => {
    obtenerModulo(id).then(async (m) => {
      setModulo(m)
      setDiplomado(await obtenerDiplomado(m.diplomado_id))
    })
  }, [id])

  if (!modulo || !diplomado) return <Spinner />

  const esAdmin = profile?.role === ROLES.ADMINISTRADOR
  const esLiderDeEste = profile?.role === ROLES.LIDER && diplomado.lider_id === profile.id
  const esDocenteDeEste = modulo.modulo_docentes?.some((md) => md.docente?.id === profile?.id)
  const esEstudiante = profile?.role === ROLES.ESTUDIANTE
  const puedeGestionarLogistica = esAdmin || esLiderDeEste
  const puedeGestionarContenido = esAdmin || esLiderDeEste || esDocenteDeEste
  const TABS = esEstudiante ? TABS_BASE : [...TABS_BASE, TAB_EVIDENCIAS]

  return (
    <div>
      <p className="mb-1 text-sm text-ink-faint">
        <Link to={`/diplomados/${diplomado.id}`} className="hover:text-brand hover:underline">{diplomado.nombre}</Link>
      </p>
      <PageHeader
        title={modulo.nombre}
        actions={
          puedeGestionarLogistica && (
            <Link to={`/modulos/${id}/editar`} className="btn-secondary">
              <Icon name="pencil" className="h-4 w-4" /> Editar
            </Link>
          )
        }
      />

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.key ? 'border-brand text-brand' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'resumen' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card">
            <p className="label !mb-1">Docentes</p>
            <p className="text-sm text-ink">
              {modulo.modulo_docentes?.length ? modulo.modulo_docentes.map((md) => md.docente?.nombre_completo).join(', ') : 'Sin asignar'}
            </p>
          </div>
          <div className="card">
            <p className="label !mb-1">Horario</p>
            <p className="text-sm text-ink">
              {modulo.dia_semana != null ? DIAS[modulo.dia_semana] : '—'}
              {modulo.hora_inicio ? ` · ${modulo.hora_inicio.slice(0, 5)}–${modulo.hora_fin?.slice(0, 5) || ''}` : ''}
            </p>
          </div>
          <div className="card">
            <p className="label !mb-1">Salón</p>
            <p className="text-sm text-ink">{modulo.salon || '—'}</p>
          </div>
          <div className="card">
            <p className="label !mb-1">Vigencia</p>
            <p className="text-sm text-ink">{modulo.fecha_inicio || '—'} al {modulo.fecha_fin || '—'}</p>
          </div>
          {modulo.descripcion && <p className="sm:col-span-2 lg:col-span-4 text-sm text-ink-soft">{modulo.descripcion}</p>}
        </div>
      )}

      {tab === 'recursos' && <RecursosPanel moduloId={id} puedeGestionar={puedeGestionarContenido} />}
      {tab === 'tareas' && <TareasPanel moduloId={id} puedeGestionar={puedeGestionarContenido} esEstudiante={esEstudiante} />}
      {tab === 'examenes' && <ExamenesPanel moduloId={id} puedeGestionar={puedeGestionarContenido} esEstudiante={esEstudiante} />}
      {tab === 'asistencia' && <AsistenciaPanel moduloId={id} diplomadoId={diplomado.id} puedeGestionar={puedeGestionarContenido} esEstudiante={esEstudiante} />}
      {tab === 'calificaciones' && (
        <CalificacionesPanel
          moduloId={id}
          diplomadoId={diplomado.id}
          puedeGestionar={puedeGestionarContenido}
          puedePublicar={esAdmin || esLiderDeEste}
          esEstudiante={esEstudiante}
        />
      )}
      {!esEstudiante && tab === 'evidencias' && <EvidenciasPanel moduloId={id} puedeGestionar={puedeGestionarContenido} />}
    </div>
  )
}
