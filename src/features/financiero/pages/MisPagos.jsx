import { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import PageHeader from '../../../components/ui/PageHeader'
import Badge from '../../../components/ui/Badge'
import Icon from '../../../components/ui/Icon'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import Modal from '../../../components/Modal'
import { listarMisPagos, listarConceptosActivos, registrarPago, verComprobante } from '../api'

const ESTADO_TONE = { pendiente: 'warning', aprobado: 'success', rechazado: 'danger' }
const ESTADO_LABEL = { pendiente: 'Pendiente de aprobación', aprobado: 'Aprobado', rechazado: 'Rechazado' }

export default function MisPagos() {
  const { profile } = useAuth()
  const [pagos, setPagos] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  async function cargar() {
    setPagos(await listarMisPagos(profile.id))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (pagos === null) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Mis pagos"
        subtitle="Estado de cuenta y comprobantes de pago."
        actions={
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Icon name="plus" className="h-4 w-4" /> Registrar pago
          </button>
        }
      />

      {pagos.length === 0 ? (
        <EmptyState icon="cash" title="Todavía no has registrado pagos" />
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="table-base">
            <thead><tr><th>Concepto</th><th>Monto</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium text-ink">{p.concepto?.nombre}</td>
                  <td>${Number(p.monto).toFixed(2)}</td>
                  <td>{p.fecha_pago}</td>
                  <td><Badge tone={ESTADO_TONE[p.estado]}>{ESTADO_LABEL[p.estado]}</Badge></td>
                  <td>
                    {p.comprobante_url && (
                      <button className="btn-ghost !px-2 !py-1 text-xs" onClick={async () => window.open(await verComprobante(p.comprobante_url), '_blank')}>
                        Ver comprobante
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && <RegistrarPagoModal onClose={() => { setModalOpen(false); cargar() }} />}
    </div>
  )
}

function RegistrarPagoModal({ onClose }) {
  const { profile } = useAuth()
  const [conceptos, setConceptos] = useState(null)
  const [conceptoId, setConceptoId] = useState('')
  const [monto, setMonto] = useState(0)
  const [metodoPago, setMetodoPago] = useState('')
  const [referencia, setReferencia] = useState('')
  const [comprobante, setComprobante] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    listarConceptosActivos().then((data) => {
      setConceptos(data)
      if (data[0]) { setConceptoId(data[0].id); setMonto(data[0].monto) }
    })
  }, [])

  function handleConcepto(id) {
    setConceptoId(id)
    const c = conceptos.find((x) => x.id === id)
    if (c) setMonto(c.monto)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await registrarPago({
        institucionId: profile.institucion_id, estudianteId: profile.id, conceptoId, monto,
        metodoPago, referencia, comprobante,
      })
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Registrar pago">
      {conceptos === null ? (
        <Spinner />
      ) : conceptos.length === 0 ? (
        <EmptyState icon="cash" title="No hay conceptos de pago disponibles" description="Contacta al administrador de tu instituto." />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="label">Concepto</label>
            <select className="input" value={conceptoId} onChange={(e) => handleConcepto(e.target.value)}>
              {conceptos.map((c) => <option key={c.id} value={c.id}>{c.nombre} — ${Number(c.monto).toFixed(2)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Monto pagado</label>
            <input type="number" min="0" step="0.01" required className="input" value={monto} onChange={(e) => setMonto(Number(e.target.value))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Método de pago</label>
              <input className="input" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} placeholder="Transferencia, efectivo…" />
            </div>
            <div>
              <label className="label">Referencia</label>
              <input className="input" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Comprobante</label>
            <input type="file" className="input" onChange={(e) => setComprobante(e.target.files?.[0] || null)} />
          </div>
          {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>}
          <button disabled={busy} className="btn-primary">{busy ? 'Enviando…' : 'Registrar pago'}</button>
        </form>
      )}
    </Modal>
  )
}
