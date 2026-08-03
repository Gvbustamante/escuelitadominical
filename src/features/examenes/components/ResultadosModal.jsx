import { useEffect, useState } from 'react'
import Modal from '../../../components/Modal'
import Badge from '../../../components/ui/Badge'
import Spinner from '../../../components/Spinner'
import EmptyState from '../../../components/ui/EmptyState'
import { listarIntentos, listarRespuestas, calificarRespuestaAbierta } from '../api'

const ESTADO_TONE = { en_progreso: 'neutral', entregado: 'warning', calificado: 'success' }
const ESTADO_LABEL = { en_progreso: 'En progreso', entregado: 'Por calificar', calificado: 'Calificado' }

export default function ResultadosModal({ examen, onClose }) {
  const [intentos, setIntentos] = useState(null)
  const [intentoAbierto, setIntentoAbierto] = useState(null)

  async function cargar() {
    setIntentos(await listarIntentos(examen.id))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examen.id])

  if (intentoAbierto) {
    return (
      <RespuestasDelIntento
        intento={intentoAbierto}
        puntosMax={examen.puntos_max}
        onBack={() => { setIntentoAbierto(null); cargar() }}
      />
    )
  }

  return (
    <Modal open onClose={onClose} title={`Resultados — ${examen.titulo}`}>
      {intentos === null ? (
        <Spinner />
      ) : intentos.length === 0 ? (
        <EmptyState icon="award" title="Nadie ha presentado este examen" />
      ) : (
        <div className="flex flex-col divide-y divide-slate-100">
          {intentos.map((i) => (
            <button key={i.id} className="flex items-center justify-between gap-2 py-3 text-left" onClick={() => setIntentoAbierto(i)}>
              <span className="font-medium text-ink">{i.estudiante?.nombre_completo}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink-soft">{i.calificacion ?? '—'} / {examen.puntos_max}</span>
                <Badge tone={ESTADO_TONE[i.estado]}>{ESTADO_LABEL[i.estado]}</Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  )
}

function RespuestasDelIntento({ intento, puntosMax, onBack }) {
  const [respuestas, setRespuestas] = useState(null)
  const [notas, setNotas] = useState({})

  useEffect(() => {
    listarRespuestas(intento.id).then((data) => {
      setRespuestas(data)
      const iniciales = {}
      data.forEach((r) => { iniciales[r.id] = r.puntos_obtenidos ?? '' })
      setNotas(iniciales)
    })
  }, [intento.id])

  async function handleGuardar(respuestaId) {
    await calificarRespuestaAbierta(respuestaId, Number(notas[respuestaId]))
    setRespuestas(await listarRespuestas(intento.id))
  }

  return (
    <Modal open onClose={onBack} title={`${intento.estudiante?.nombre_completo} — ${intento.calificacion ?? '—'} / ${puntosMax}`}>
      {respuestas === null ? (
        <Spinner />
      ) : (
        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
          {respuestas.map((r) => (
            <div key={r.id} className="rounded-md border border-slate-200 p-3">
              <p className="font-medium text-ink">{r.pregunta.enunciado} <span className="text-xs text-ink-faint">({r.pregunta.puntos} pts)</span></p>
              {r.pregunta.tipo === 'abierta' ? (
                <div className="mt-2 flex flex-col gap-2">
                  <p className="text-sm text-ink-soft">{r.respuesta_texto || 'Sin respuesta'}</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="input !w-24"
                      value={notas[r.id]}
                      onChange={(e) => setNotas((n) => ({ ...n, [r.id]: e.target.value }))}
                    />
                    <button className="btn-secondary !px-3" onClick={() => handleGuardar(r.id)}>Guardar</button>
                  </div>
                </div>
              ) : (
                <p className={`mt-1 text-sm ${r.opcion?.es_correcta ? 'text-success-700' : 'text-danger-600'}`}>
                  Respondió: {r.opcion?.texto || '—'} ({r.puntos_obtenidos ?? 0} pts)
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
