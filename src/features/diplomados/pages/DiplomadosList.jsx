import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../../../components/ui/PageHeader'
import EmptyState from '../../../components/ui/EmptyState'
import Badge from '../../../components/ui/Badge'
import Icon from '../../../components/ui/Icon'
import Spinner from '../../../components/Spinner'
import { useAuth } from '../../../contexts/AuthContext'
import { ROLES } from '../../../lib/roles'
import { listarDiplomados } from '../api'

const ESTADO_TONE = {
  planificacion: 'neutral',
  activo: 'success',
  finalizado: 'brand',
  archivado: 'neutral',
}

const ESTADO_LABEL = {
  planificacion: 'En planificación',
  activo: 'Activo',
  finalizado: 'Finalizado',
  archivado: 'Archivado',
}

export default function DiplomadosList() {
  const { profile } = useAuth()
  const [diplomados, setDiplomados] = useState(null)

  useEffect(() => {
    listarDiplomados().then(setDiplomados)
  }, [])

  if (diplomados === null) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Diplomados"
        subtitle="Programas académicos del instituto."
        actions={
          profile?.role === ROLES.ADMINISTRADOR && (
            <Link to="/diplomados/nuevo" className="btn-primary">
              <Icon name="plus" className="h-4 w-4" /> Nuevo diplomado
            </Link>
          )
        }
      />

      {diplomados.length === 0 ? (
        <EmptyState
          icon="book"
          title="Todavía no hay diplomados"
          description={profile?.role === ROLES.ADMINISTRADOR ? 'Crea el primero para empezar a organizar los módulos.' : 'Cuando se te asigne uno, aparecerá aquí.'}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {diplomados.map((d) => (
            <Link key={d.id} to={`/diplomados/${d.id}`} className="card-link flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-ink">{d.nombre}</h3>
                <Badge tone={ESTADO_TONE[d.estado]}>{ESTADO_LABEL[d.estado]}</Badge>
              </div>
              {d.descripcion && <p className="line-clamp-2 text-sm text-ink-soft">{d.descripcion}</p>}
              <p className="text-sm text-ink-faint">Líder: {d.lider?.nombre_completo || 'Sin asignar'}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
