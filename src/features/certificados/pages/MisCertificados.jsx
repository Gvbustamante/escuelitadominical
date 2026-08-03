import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import PageHeader from '../../../components/ui/PageHeader'
import Icon from '../../../components/ui/Icon'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import { listarMisCertificados } from '../api'

export default function MisCertificados() {
  const { profile } = useAuth()
  const [certificados, setCertificados] = useState(null)

  useEffect(() => {
    listarMisCertificados(profile.id).then(setCertificados)
  }, [profile.id])

  if (certificados === null) return <Spinner />

  return (
    <div>
      <PageHeader title="Mis certificados" />
      {certificados.length === 0 ? (
        <EmptyState icon="award" title="Todavía no tienes certificados emitidos" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {certificados.map((c) => (
            <Link key={c.id} to={`/certificados/${c.id}`} className="card-link flex items-center gap-3">
              <Icon name="award" className="h-8 w-8 text-brand" />
              <div>
                <p className="font-medium text-ink">{c.diplomado?.nombre}</p>
                <p className="text-xs text-ink-faint">Emitido el {c.fecha_emision}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
