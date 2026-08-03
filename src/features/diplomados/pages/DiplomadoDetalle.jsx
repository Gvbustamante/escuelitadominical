import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../../components/ui/PageHeader'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Icon from '../../../components/ui/Icon'
import Spinner from '../../../components/Spinner'
import { useAuth } from '../../../contexts/AuthContext'
import { ROLES } from '../../../lib/roles'
import { obtenerDiplomado } from '../api'
import { listarModulosPorDiplomado } from '../../modulos/api'
import MatriculaPanel from '../../matriculas/components/MatriculaPanel'

const ESTADO_LABEL = {
  planificacion: 'En planificación',
  activo: 'Activo',
  finalizado: 'Finalizado',
  archivado: 'Archivado',
}

export default function DiplomadoDetalle() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [diplomado, setDiplomado] = useState(null)
  const [modulos, setModulos] = useState(null)
  const [tab, setTab] = useState('modulos')

  async function cargar() {
    const [d, m] = await Promise.all([obtenerDiplomado(id), listarModulosPorDiplomado(id)])
    setDiplomado(d)
    setModulos(m)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!diplomado) return <Spinner />

  const esAdmin = profile?.role === ROLES.ADMINISTRADOR
  const esLiderDeEste = profile?.role === ROLES.LIDER && diplomado.lider_id === profile.id
  const puedeGestionar = esAdmin || esLiderDeEste

  return (
    <div>
      <PageHeader
        title={diplomado.nombre}
        subtitle={`Líder: ${diplomado.lider?.nombre_completo || 'Sin asignar'}`}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="brand">{ESTADO_LABEL[diplomado.estado]}</Badge>
            {esAdmin && (
              <Link to={`/diplomados/${id}/editar`} className="btn-secondary">
                <Icon name="pencil" className="h-4 w-4" /> Editar
              </Link>
            )}
          </div>
        }
      />

      {diplomado.descripcion && <p className="mb-6 max-w-3xl text-sm text-ink-soft">{diplomado.descripcion}</p>}

      <div className="mb-4 flex gap-2 border-b border-slate-200">
        {[
          { key: 'modulos', label: 'Módulos' },
          ...(profile?.role !== ROLES.ESTUDIANTE ? [{ key: 'matricula', label: 'Estudiantes matriculados' }] : []),
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.key ? 'border-brand text-brand' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'modulos' && (
        <div>
          {puedeGestionar && (
            <div className="mb-4 flex justify-end">
              <Link to={`/diplomados/${id}/modulos/nuevo`} className="btn-primary">
                <Icon name="plus" className="h-4 w-4" /> Nuevo módulo
              </Link>
            </div>
          )}
          {modulos === null ? (
            <Spinner />
          ) : modulos.length === 0 ? (
            <EmptyState icon="folder" title="Este diplomado aún no tiene módulos" description={puedeGestionar ? 'Crea el primero para empezar.' : 'Vuelve pronto.'} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {modulos.map((m) => (
                <Link key={m.id} to={`/modulos/${m.id}`} className="card-link flex flex-col gap-2">
                  <h3 className="font-semibold text-ink">{m.nombre}</h3>
                  <p className="text-sm text-ink-soft">
                    {m.modulo_docentes?.length ? m.modulo_docentes.map((md) => md.docente?.nombre_completo).join(', ') : 'Sin docente asignado'}
                  </p>
                  {m.salon && <p className="text-xs text-ink-faint">Salón {m.salon}</p>}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'matricula' && <MatriculaPanel diplomadoId={id} puedeGestionar={puedeGestionar} />}
    </div>
  )
}
