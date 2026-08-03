import { useEffect, useState } from 'react'
import EmptyState from '../../../components/ui/EmptyState'
import Badge from '../../../components/ui/Badge'
import Icon from '../../../components/ui/Icon'
import Spinner from '../../../components/Spinner'
import { listarMatriculasPorDiplomado, buscarEstudiantes, matricular, actualizarEstadoMatricula } from '../api'

const ESTADO_TONE = { activa: 'success', retirada: 'danger', completada: 'brand' }
const ESTADO_LABEL = { activa: 'Activa', retirada: 'Retirada', completada: 'Completada' }

export default function MatriculaPanel({ diplomadoId, puedeGestionar }) {
  const [matriculas, setMatriculas] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])

  async function cargar() {
    setMatriculas(await listarMatriculasPorDiplomado(diplomadoId))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diplomadoId])

  async function handleBuscar(e) {
    const valor = e.target.value
    setTexto(valor)
    if (valor.trim().length < 2) return setResultados([])
    setResultados(await buscarEstudiantes(valor.trim()))
  }

  async function handleMatricular(estudianteId) {
    await matricular(diplomadoId, estudianteId)
    setTexto('')
    setResultados([])
    setBuscando(false)
    cargar()
  }

  async function handleEstado(id, estado) {
    await actualizarEstadoMatricula(id, estado)
    cargar()
  }

  if (matriculas === null) return <Spinner />

  return (
    <div>
      {puedeGestionar && (
        <div className="card mb-4 !p-4">
          {!buscando ? (
            <button className="btn-secondary" onClick={() => setBuscando(true)}>
              <Icon name="plus" className="h-4 w-4" /> Matricular estudiante
            </button>
          ) : (
            <div>
              <label className="label">Buscar estudiante por nombre</label>
              <input autoFocus className="input" value={texto} onChange={handleBuscar} placeholder="Escribe al menos 2 letras" />
              {resultados.length > 0 && (
                <ul className="mt-2 divide-y divide-slate-100 rounded-md border border-slate-200">
                  {resultados.map((r) => (
                    <li key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      {r.nombre_completo}
                      <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => handleMatricular(r.id)}>Matricular</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {matriculas.length === 0 ? (
        <EmptyState icon="users" title="Sin estudiantes matriculados" description={puedeGestionar ? 'Busca y matricula al primero arriba.' : undefined} />
      ) : (
        <div className="card overflow-x-auto !p-0">
          <table className="table-base">
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Documento</th>
                <th>Fecha de matrícula</th>
                <th>Estado</th>
                {puedeGestionar && <th></th>}
              </tr>
            </thead>
            <tbody>
              {matriculas.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium text-ink">{m.estudiante?.nombre_completo}</td>
                  <td>{m.estudiante?.documento_identidad || '—'}</td>
                  <td>{m.fecha_matricula}</td>
                  <td><Badge tone={ESTADO_TONE[m.estado]}>{ESTADO_LABEL[m.estado]}</Badge></td>
                  {puedeGestionar && (
                    <td>
                      {m.estado === 'activa' && (
                        <div className="flex gap-2">
                          <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => handleEstado(m.id, 'completada')}>Completar</button>
                          <button className="btn-ghost !px-2 !py-1 text-xs text-danger-600" onClick={() => handleEstado(m.id, 'retirada')}>Retirar</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
