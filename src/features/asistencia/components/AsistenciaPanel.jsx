import { useEffect, useState } from 'react'
import Icon from '../../../components/ui/Icon'
import Badge from '../../../components/ui/Badge'
import EmptyState from '../../../components/ui/EmptyState'
import Spinner from '../../../components/Spinner'
import { listarSesiones, listarEstudiantesDelModulo, crearSesion, guardarRegistros } from '../api'

const ESTADOS = [
  { value: 'presente', label: 'Presente', className: 'bg-success-50 text-success-700' },
  { value: 'tarde', label: 'Tarde', className: 'bg-warning-50 text-warning-700' },
  { value: 'ausente', label: 'Ausente', className: 'bg-danger-50 text-danger-700' },
  { value: 'justificado', label: 'Justificado', className: 'bg-slate-100 text-ink-soft' },
]

const ESTADO_TONE = { presente: 'success', tarde: 'warning', ausente: 'danger', justificado: 'neutral' }
const ESTADO_LABEL = { presente: 'Presente', tarde: 'Tarde', ausente: 'Ausente', justificado: 'Justificado' }

export default function AsistenciaPanel({ moduloId, diplomadoId, puedeGestionar, esEstudiante }) {
  const [sesiones, setSesiones] = useState(null)
  const [estudiantes, setEstudiantes] = useState([])
  const [sesionActiva, setSesionActiva] = useState(null)
  const [estados, setEstados] = useState({})
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))
  const [busy, setBusy] = useState(false)

  async function cargar() {
    const [s, e] = await Promise.all([
      listarSesiones(moduloId),
      esEstudiante ? Promise.resolve([]) : listarEstudiantesDelModulo(diplomadoId),
    ])
    setSesiones(s)
    setEstudiantes(e)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduloId, diplomadoId])

  function abrirSesion(sesion) {
    setSesionActiva(sesion)
    const inicial = {}
    estudiantes.forEach((e) => {
      const reg = sesion.asistencia_registros?.find((r) => r.estudiante_id === e.id)
      inicial[e.id] = reg?.estado || 'presente'
    })
    setEstados(inicial)
  }

  async function handleNuevaSesion() {
    const existente = sesiones.find((s) => s.fecha === fecha)
    if (existente) return abrirSesion(existente)
    const nueva = await crearSesion(moduloId, fecha)
    await cargar()
    abrirSesion({ ...nueva, asistencia_registros: [] })
  }

  async function handleGuardar() {
    setBusy(true)
    const registros = estudiantes.map((e) => ({ estudiante_id: e.id, estado: estados[e.id] }))
    await guardarRegistros(sesionActiva.id, registros)
    setBusy(false)
    setSesionActiva(null)
    cargar()
  }

  if (sesiones === null) return <Spinner />

  if (esEstudiante) {
    return sesiones.length === 0 ? (
      <EmptyState icon="check-square" title="Sin registros de asistencia todavía" />
    ) : (
      <div className="card overflow-x-auto !p-0">
        <table className="table-base">
          <thead><tr><th>Fecha</th><th>Estado</th></tr></thead>
          <tbody>
            {sesiones.map((s) => {
              const mi = s.asistencia_registros?.[0]
              return (
                <tr key={s.id}>
                  <td className="font-medium text-ink">{s.fecha}</td>
                  <td>{mi ? <Badge tone={ESTADO_TONE[mi.estado]}>{ESTADO_LABEL[mi.estado]}</Badge> : <span className="text-ink-faint">—</span>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  if (sesionActiva) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-ink">Asistencia del {sesionActiva.fecha}</h3>
          <button className="btn-ghost" onClick={() => setSesionActiva(null)}>Cancelar</button>
        </div>
        {estudiantes.length === 0 ? (
          <EmptyState icon="users" title="No hay estudiantes matriculados en este diplomado" />
        ) : (
          <div className="card divide-y divide-slate-100 !p-0">
            {estudiantes.map((e) => (
              <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <span className="font-medium text-ink">{e.nombre_completo}</span>
                <div className="flex gap-1">
                  {ESTADOS.map((op) => (
                    <button
                      key={op.value}
                      onClick={() => setEstados((s) => ({ ...s, [e.id]: op.value }))}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        estados[e.id] === op.value ? op.className : 'bg-slate-50 text-ink-faint hover:bg-slate-100'
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <button disabled={busy} className="btn-primary mt-4" onClick={handleGuardar}>{busy ? 'Guardando…' : 'Guardar asistencia'}</button>
      </div>
    )
  }

  return (
    <div>
      {puedeGestionar && (
        <div className="card mb-4 flex flex-wrap items-end gap-3 !p-4">
          <div>
            <label className="label">Fecha</label>
            <input type="date" className="input" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={handleNuevaSesion}>
            <Icon name="check-square" className="h-4 w-4" /> Tomar asistencia
          </button>
        </div>
      )}

      {sesiones.length === 0 ? (
        <EmptyState icon="check-square" title="Sin registros de asistencia" />
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="table-base">
            <thead>
              <tr><th>Fecha</th><th>Presentes</th><th>Ausentes</th><th>Tarde</th><th>Justificados</th><th></th></tr>
            </thead>
            <tbody>
              {sesiones.map((s) => {
                const contar = (estado) => s.asistencia_registros?.filter((r) => r.estado === estado).length || 0
                return (
                  <tr key={s.id}>
                    <td className="font-medium text-ink">{s.fecha}</td>
                    <td>{contar('presente')}</td>
                    <td>{contar('ausente')}</td>
                    <td>{contar('tarde')}</td>
                    <td>{contar('justificado')}</td>
                    <td>{puedeGestionar && <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => abrirSesion(s)}>Editar</button>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
