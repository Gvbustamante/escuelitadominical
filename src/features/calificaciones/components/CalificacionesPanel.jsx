import { useEffect, useState } from 'react'
import EmptyState from '../../../components/ui/EmptyState'
import Badge from '../../../components/ui/Badge'
import Spinner from '../../../components/Spinner'
import { listarCalificaciones, guardarCalificacion, publicarCalificacion } from '../api'

export default function CalificacionesPanel({ moduloId, diplomadoId, puedeGestionar, puedePublicar }) {
  const [filas, setFilas] = useState(null)
  const [notas, setNotas] = useState({})

  async function cargar() {
    const data = await listarCalificaciones(moduloId, diplomadoId)
    setFilas(data)
    const iniciales = {}
    data.forEach((f) => { iniciales[f.estudiante.id] = f.calificacion?.nota_final ?? '' })
    setNotas(iniciales)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduloId, diplomadoId])

  async function handleGuardar(estudianteId) {
    const nota = Number(notas[estudianteId])
    await guardarCalificacion(moduloId, estudianteId, nota, nota >= 70)
    cargar()
  }

  async function handlePublicar(calificacionId, publicada) {
    await publicarCalificacion(calificacionId, publicada)
    cargar()
  }

  if (filas === null) return <Spinner />
  if (filas.length === 0) return <EmptyState icon="award" title="No hay estudiantes matriculados en este diplomado" />

  return (
    <div className="card overflow-x-auto !p-0">
      <table className="table-base">
        <thead>
          <tr><th>Estudiante</th><th>Nota final</th><th>Resultado</th><th>Visible al estudiante</th>{puedeGestionar && <th></th>}</tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.estudiante.id}>
              <td className="font-medium text-ink">{f.estudiante.nombre_completo}</td>
              <td>
                {puedeGestionar ? (
                  <input
                    type="number" min="0" max="100" className="input !w-24"
                    value={notas[f.estudiante.id]}
                    onChange={(e) => setNotas((n) => ({ ...n, [f.estudiante.id]: e.target.value }))}
                  />
                ) : (f.calificacion?.nota_final ?? '—')}
              </td>
              <td>
                {f.calificacion?.nota_final != null && (
                  <Badge tone={f.calificacion.aprobado ? 'success' : 'danger'}>{f.calificacion.aprobado ? 'Aprobado' : 'Reprobado'}</Badge>
                )}
              </td>
              <td>
                {f.calificacion && (
                  puedePublicar ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={f.calificacion.publicada} onChange={(e) => handlePublicar(f.calificacion.id, e.target.checked)} />
                      {f.calificacion.publicada ? 'Publicada' : 'Oculta'}
                    </label>
                  ) : (
                    <Badge tone={f.calificacion.publicada ? 'success' : 'neutral'}>{f.calificacion.publicada ? 'Publicada' : 'Oculta'}</Badge>
                  )
                )}
              </td>
              {puedeGestionar && (
                <td>
                  <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => handleGuardar(f.estudiante.id)}>Guardar</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
