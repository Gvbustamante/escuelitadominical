import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Spinner from '../../../components/Spinner'
import Icon from '../../../components/ui/Icon'
import { obtenerCertificado } from '../api'
import CertificadoView from '../components/CertificadoView'

export default function CertificadoDetalle() {
  const { id } = useParams()
  const [certificado, setCertificado] = useState(null)

  useEffect(() => {
    obtenerCertificado(id).then(setCertificado)
  }, [id])

  if (!certificado) return <Spinner />

  return (
    <div>
      <div className="mb-4 flex justify-end print:hidden">
        <button className="btn-primary" onClick={() => window.print()}>
          <Icon name="download" className="h-4 w-4" /> Descargar / imprimir
        </button>
      </div>
      <CertificadoView certificado={certificado} />
    </div>
  )
}
