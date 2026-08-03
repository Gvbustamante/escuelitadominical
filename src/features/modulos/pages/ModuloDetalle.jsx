import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../../components/ui/PageHeader'
import Icon from '../../../components/ui/Icon'
import Spinner from '../../../components/Spinner'
import { useAuth } from '../../../contexts/AuthContext'
import { ROLES } from '../../../lib/roles'
import { obtenerModulo } from '../api'
import { obtenerDiplomado } from '../../diplomados/api'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function ModuloDetalle() {
  const { id } = useParams()
  const { profile } = useAuth()
  const [modulo, setModulo] = useState(null)
  const [diplomado, setDiplomado] = useState(null)

  useEffect(() => {
    obtenerModulo(id).then(async (m) => {
      setModulo(m)
      setDiplomado(await obtenerDiplomado(m.diplomado_id))
    })
  }, [id])

  if (!modulo || !diplomado) return <Spinner />

  const puedeGestionar = profile?.role === ROLES.ADMINISTRADOR || (profile?.role === ROLES.LIDER && diplomado.lider_id === profile.id)

  return (
    <div>
      <p className="mb-1 text-sm text-ink-faint">
        <Link to={`/diplomados/${diplomado.id}`} className="hover:text-brand hover:underline">{diplomado.nombre}</Link>
      </p>
      <PageHeader
        title={modulo.nombre}
        actions={
          puedeGestionar && (
            <Link to={`/modulos/${id}/editar`} className="btn-secondary">
              <Icon name="pencil" className="h-4 w-4" /> Editar
            </Link>
          )
        }
      />

      {modulo.descripcion && <p className="mb-6 max-w-3xl text-sm text-ink-soft">{modulo.descripcion}</p>}

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
      </div>
    </div>
  )
}
