import { useEffect, useState } from 'react'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import { listarPagos, verComprobante, aprobarPago } from '../api'

const ESTADO_TONE = { pendiente: 'warning', aprobado: 'success', rechazado: 'danger' }
const ESTADO_LABEL = { pendiente: 'Pendiente', aprobado: 'Aprobado', rechazado: 'Rechazado' }

const FILTROS = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: '', label: 'Todos' },
  { value: 'aprobado', label: 'Aprobados' },
  { value: 'rechazado', label: 'Rechazados' },
]

export default function PagosTab() {
  const [filtro, setFiltro] = useState('pendiente')
  const [pagos, setPagos] = useState(null)

  async function cargar() {
    setPagos(await listarPagos(filtro ? { estado: filtro } : {}))
  }

  useEffect(() => {
    setPagos(null)
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro])

  async function handleAprobar(id, aprobar) {
    await aprobarPago(id, aprobar)
    cargar()
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filtro === f.value ? 'bg-brand text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {pagos === null ? (
        <Spinner />
      ) : pagos.length === 0 ? (
        <EmptyState icon="cash" title="No hay pagos en esta categoría" />
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="table-base">
            <thead><tr><th>Estudiante</th><th>Concepto</th><th>Monto</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium text-ink">{p.estudiante?.nombre_completo}</td>
                  <td>{p.concepto?.nombre}</td>
                  <td>${Number(p.monto).toFixed(2)}</td>
                  <td>{p.fecha_pago}</td>
                  <td><Badge tone={ESTADO_TONE[p.estado]}>{ESTADO_LABEL[p.estado]}</Badge></td>
                  <td>
                    <div className="flex gap-2">
                      {p.comprobante_url && (
                        <button className="btn-ghost !px-2 !py-1 text-xs" onClick={async () => window.open(await verComprobante(p.comprobante_url), '_blank')}>
                          Ver comprobante
                        </button>
                      )}
                      {p.estado === 'pendiente' && (
                        <>
                          <button className="btn-ghost !px-2 !py-1 text-xs text-success-700" onClick={() => handleAprobar(p.id, true)}>Aprobar</button>
                          <button className="btn-ghost !px-2 !py-1 text-xs text-danger-600" onClick={() => handleAprobar(p.id, false)}>Rechazar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
