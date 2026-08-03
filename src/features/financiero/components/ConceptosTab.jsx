import { useEffect, useState } from 'react'
import Icon from '../../../components/ui/Icon'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import { listarConceptos, crearConcepto, actualizarConcepto } from '../api'

const TIPOS = [
  { value: 'matricula', label: 'Matrícula' },
  { value: 'modulo', label: 'Módulo' },
  { value: 'recurso', label: 'Recurso' },
  { value: 'ofrenda', label: 'Ofrenda' },
  { value: 'otro', label: 'Otro' },
]

export default function ConceptosTab() {
  const [conceptos, setConceptos] = useState(null)
  const [form, setForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [tipo, setTipo] = useState('matricula')
  const [monto, setMonto] = useState(0)

  async function cargar() {
    setConceptos(await listarConceptos())
  }

  useEffect(() => { cargar() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    await crearConcepto({ nombre, tipo, monto })
    setForm(false)
    setNombre(''); setTipo('matricula'); setMonto(0)
    cargar()
  }

  async function toggleActivo(c) {
    await actualizarConcepto(c.id, { activo: !c.activo })
    cargar()
  }

  if (conceptos === null) return <Spinner />

  return (
    <div>
      <div className="card mb-4 !p-4">
        {!form ? (
          <button className="btn-secondary" onClick={() => setForm(true)}>
            <Icon name="plus" className="h-4 w-4" /> Nuevo concepto
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[160px]">
              <label className="label">Nombre</label>
              <input required className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Monto</label>
              <input type="number" min="0" step="0.01" className="input !w-32" value={monto} onChange={(e) => setMonto(Number(e.target.value))} />
            </div>
            <button className="btn-primary">Crear</button>
            <button type="button" className="btn-secondary" onClick={() => setForm(false)}>Cancelar</button>
          </form>
        )}
      </div>

      {conceptos.length === 0 ? (
        <EmptyState icon="cash" title="Sin conceptos de pago todavía" />
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="table-base">
            <thead><tr><th>Nombre</th><th>Tipo</th><th>Monto</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {conceptos.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium text-ink">{c.nombre}</td>
                  <td>{TIPOS.find((t) => t.value === c.tipo)?.label}</td>
                  <td>${Number(c.monto).toFixed(2)}</td>
                  <td><Badge tone={c.activo ? 'success' : 'neutral'}>{c.activo ? 'Activo' : 'Inactivo'}</Badge></td>
                  <td><button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => toggleActivo(c)}>{c.activo ? 'Desactivar' : 'Activar'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
