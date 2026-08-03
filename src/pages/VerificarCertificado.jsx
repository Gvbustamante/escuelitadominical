import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import Icon from '../components/ui/Icon'

export default function VerificarCertificado() {
  const { codigo } = useParams()
  const [estado, setEstado] = useState('cargando')
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    supabase
      .rpc('verificar_certificado', { p_codigo: codigo })
      .then(({ data, error }) => {
        const fila = Array.isArray(data) ? data[0] : data
        if (error || !fila?.valido) {
          setEstado('invalido')
        } else {
          setResultado(fila)
          setEstado('valido')
        }
      })
  }, [codigo])

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="card w-full max-w-md text-center">
        {estado === 'cargando' && <p className="text-ink-soft">Verificando…</p>}

        {estado === 'invalido' && (
          <>
            <Icon name="alert-triangle" className="mx-auto mb-3 h-10 w-10 text-danger-500" />
            <h1 className="text-xl font-semibold text-ink">Certificado no encontrado</h1>
            <p className="mt-1 text-sm text-ink-soft">El código verificado no corresponde a ningún certificado emitido.</p>
          </>
        )}

        {estado === 'valido' && resultado && (
          <>
            <Icon name="check-circle" className="mx-auto mb-3 h-10 w-10 text-success-500" />
            <h1 className="text-xl font-semibold text-ink">Certificado válido</h1>
            <dl className="mt-4 space-y-2 text-left text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <dt className="text-ink-soft">Estudiante</dt>
                <dd className="font-medium text-ink">{resultado.nombre_estudiante}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <dt className="text-ink-soft">Diplomado</dt>
                <dd className="font-medium text-ink">{resultado.nombre_diplomado}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <dt className="text-ink-soft">Instituto</dt>
                <dd className="font-medium text-ink">{resultado.nombre_institucion}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Fecha de emisión</dt>
                <dd className="font-medium text-ink">{resultado.fecha_emision}</dd>
              </div>
            </dl>
          </>
        )}
      </div>
    </div>
  )
}
