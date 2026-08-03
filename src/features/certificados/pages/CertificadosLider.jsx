import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import PageHeader from '../../../components/ui/PageHeader'
import Icon from '../../../components/ui/Icon'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import { supabase } from '../../../lib/supabaseClient'
import { listarCertificados } from '../api'

// El líder solo puede "solicitar" la emisión (la emite el administrador); aquí ve de solo
// lectura los certificados ya emitidos de su propio diplomado.
export default function CertificadosLider() {
  const { profile } = useAuth()
  const [certificados, setCertificados] = useState(null)

  useEffect(() => {
    async function cargar() {
      const { data: miDiplomado } = await supabase.from('diplomados').select('id').eq('lider_id', profile.id).maybeSingle()
      const todos = await listarCertificados()
      setCertificados(miDiplomado ? todos.filter((c) => c.diplomado_id === miDiplomado.id) : [])
    }
    cargar()
  }, [profile.id])

  if (certificados === null) return <Spinner />

  return (
    <div>
      <PageHeader title="Certificados de mi diplomado" subtitle="La emisión la realiza el administrador; aquí puedes ver los ya emitidos." />
      {certificados.length === 0 ? (
        <EmptyState icon="award" title="Todavía no se han emitido certificados en tu diplomado" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {certificados.map((c) => (
            <Link key={c.id} to={`/certificados/${c.id}`} className="card-link flex items-center gap-3">
              <Icon name="award" className="h-8 w-8 text-brand" />
              <div>
                <p className="font-medium text-ink">{c.estudiante?.nombre_completo}</p>
                <p className="text-xs text-ink-faint">Emitido el {c.fecha_emision}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
