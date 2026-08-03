import { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import Icon from '../../../components/ui/Icon'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import { urlFirmada } from '../../../lib/storage'
import { listarEvidencias, crearEvidencia, BUCKET_EVIDENCIAS } from '../api'

export default function EvidenciasPanel({ moduloId, puedeGestionar }) {
  const { profile } = useAuth()
  const [evidencias, setEvidencias] = useState(null)
  const [form, setForm] = useState(false)
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [estadoInicialTexto, setEstadoInicialTexto] = useState('')
  const [fotoInicial, setFotoInicial] = useState(null)
  const [estadoFinalTexto, setEstadoFinalTexto] = useState('')
  const [fotoFinal, setFotoFinal] = useState(null)
  const [observaciones, setObservaciones] = useState('')
  const [busy, setBusy] = useState(false)

  async function cargar() {
    setEvidencias(await listarEvidencias(moduloId))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduloId])

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    try {
      await crearEvidencia({
        moduloId, institucionId: profile.institucion_id, docenteId: profile.id, fecha,
        estadoInicialTexto, fotoInicial, estadoFinalTexto, fotoFinal, observaciones,
      })
      setForm(false)
      setEstadoInicialTexto(''); setFotoInicial(null); setEstadoFinalTexto(''); setFotoFinal(null); setObservaciones('')
      cargar()
    } finally {
      setBusy(false)
    }
  }

  async function verFoto(path) {
    window.open(await urlFirmada(BUCKET_EVIDENCIAS, path), '_blank')
  }

  if (evidencias === null) return <Spinner />

  return (
    <div>
      {puedeGestionar && (
        <div className="card mb-4 !p-4">
          {!form ? (
            <button className="btn-secondary" onClick={() => setForm(true)}>
              <Icon name="plus" className="h-4 w-4" /> Registrar evidencia de hoy
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="label">Fecha</label>
                <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Estado inicial del salón</label>
                  <textarea className="input" rows={2} value={estadoInicialTexto} onChange={(e) => setEstadoInicialTexto(e.target.value)} />
                  <input type="file" accept="image/*" className="input mt-2" onChange={(e) => setFotoInicial(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <label className="label">Estado final del salón</label>
                  <textarea className="input" rows={2} value={estadoFinalTexto} onChange={(e) => setEstadoFinalTexto(e.target.value)} />
                  <input type="file" accept="image/*" className="input mt-2" onChange={(e) => setFotoFinal(e.target.files?.[0] || null)} />
                </div>
              </div>
              <div>
                <label className="label">Observaciones</label>
                <textarea className="input" rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button disabled={busy} className="btn-primary">{busy ? 'Guardando…' : 'Guardar'}</button>
                <button type="button" className="btn-secondary" onClick={() => setForm(false)}>Cancelar</button>
              </div>
            </form>
          )}
        </div>
      )}

      {evidencias.length === 0 ? (
        <EmptyState icon="folder" title="Sin evidencias registradas" />
      ) : (
        <div className="flex flex-col gap-3">
          {evidencias.map((ev) => (
            <div key={ev.id} className="card">
              <p className="mb-2 font-medium text-ink">{ev.fecha}</p>
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-ink-soft">{ev.estado_inicial_texto || 'Sin descripción inicial'}</p>
                  {ev.foto_inicial_url && <button className="mt-1 font-medium text-brand hover:underline" onClick={() => verFoto(ev.foto_inicial_url)}>Ver foto inicial</button>}
                </div>
                <div>
                  <p className="text-ink-soft">{ev.estado_final_texto || 'Sin descripción final'}</p>
                  {ev.foto_final_url && <button className="mt-1 font-medium text-brand hover:underline" onClick={() => verFoto(ev.foto_final_url)}>Ver foto final</button>}
                </div>
              </div>
              {ev.observaciones && <p className="mt-2 text-sm text-ink-faint">{ev.observaciones}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
