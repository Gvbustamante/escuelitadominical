import { useEffect, useState } from 'react'
import { useAuth } from '../../../contexts/AuthContext'
import Icon from '../../../components/ui/Icon'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import { listarOfrendas, crearOfrenda, buscarPerfiles } from '../api'

export default function OfrendasTab() {
  const { profile } = useAuth()
  const [ofrendas, setOfrendas] = useState(null)
  const [form, setForm] = useState(false)
  const [monto, setMonto] = useState(0)
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [anonimo, setAnonimo] = useState(true)
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])
  const [donante, setDonante] = useState(null)

  async function cargar() {
    setOfrendas(await listarOfrendas())
  }

  useEffect(() => { cargar() }, [])

  async function handleBuscar(valor) {
    setTexto(valor)
    setDonante(null)
    if (valor.trim().length < 2) return setResultados([])
    setResultados(await buscarPerfiles(valor.trim()))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await crearOfrenda({
      institucion_id: profile.institucion_id, monto, fecha, anonimo,
      donante_id: anonimo ? null : donante?.id || null, registrado_por: profile.id,
    })
    setForm(false)
    setMonto(0); setAnonimo(true); setTexto(''); setResultados([]); setDonante(null)
    cargar()
  }

  if (ofrendas === null) return <Spinner />

  return (
    <div>
      <div className="card mb-4 !p-4">
        {!form ? (
          <button className="btn-secondary" onClick={() => setForm(true)}>
            <Icon name="plus" className="h-4 w-4" /> Registrar ofrenda
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Monto</label>
                <input type="number" min="0" step="0.01" required className="input" value={monto} onChange={(e) => setMonto(Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Fecha</label>
                <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input type="checkbox" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} /> Anónima
            </label>
            {!anonimo && (
              <div>
                <label className="label">Donante</label>
                <input className="input" value={texto} onChange={(e) => handleBuscar(e.target.value)} placeholder="Buscar por nombre" />
                {resultados.length > 0 && !donante && (
                  <ul className="mt-1 divide-y divide-slate-100 rounded-md border border-slate-200">
                    {resultados.map((r) => (
                      <li key={r.id} className="cursor-pointer px-3 py-2 text-sm hover:bg-slate-50" onClick={() => { setDonante(r); setTexto(r.nombre_completo); setResultados([]) }}>
                        {r.nombre_completo}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <button className="btn-primary">Guardar</button>
              <button type="button" className="btn-secondary" onClick={() => setForm(false)}>Cancelar</button>
            </div>
          </form>
        )}
      </div>

      {ofrendas.length === 0 ? (
        <EmptyState icon="cash" title="Sin ofrendas registradas" />
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="table-base">
            <thead><tr><th>Fecha</th><th>Monto</th><th>Donante</th></tr></thead>
            <tbody>
              {ofrendas.map((o) => (
                <tr key={o.id}>
                  <td className="font-medium text-ink">{o.fecha}</td>
                  <td>${Number(o.monto).toFixed(2)}</td>
                  <td>{o.anonimo ? 'Anónimo' : o.donante?.nombre_completo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
