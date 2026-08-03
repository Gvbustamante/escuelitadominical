import { useEffect, useState } from 'react'
import Modal from '../../../components/Modal'
import Spinner from '../../../components/Spinner'
import { useAuth } from '../../../contexts/AuthContext'
import { iniciarIntento, listarPreguntasParaPresentar, listarMisRespuestas, guardarRespuesta, entregarIntento } from '../api'

export default function PresentarExamenModal({ examen, onClose }) {
  const { profile } = useAuth()
  const [intento, setIntento] = useState(null)
  const [preguntas, setPreguntas] = useState(null)
  const [respuestas, setRespuestas] = useState({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    async function iniciar() {
      const i = await iniciarIntento(examen.id, profile.id)
      const [p, previas] = await Promise.all([listarPreguntasParaPresentar(examen.id), listarMisRespuestas(i.id)])
      const iniciales = {}
      previas.forEach((r) => { iniciales[r.pregunta_id] = { opcionId: r.opcion_id, texto: r.respuesta_texto } })
      setRespuestas(iniciales)
      setIntento(i)
      setPreguntas(p)
    }
    iniciar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examen.id])

  async function responderOpcion(pregunta, opcionId) {
    setRespuestas((r) => ({ ...r, [pregunta.id]: { opcionId } }))
    await guardarRespuesta({ intentoId: intento.id, preguntaId: pregunta.id, opcionId })
  }

  async function responderTexto(pregunta, texto) {
    setRespuestas((r) => ({ ...r, [pregunta.id]: { texto } }))
  }

  async function guardarTexto(pregunta) {
    const texto = respuestas[pregunta.id]?.texto
    if (texto === undefined) return
    await guardarRespuesta({ intentoId: intento.id, preguntaId: pregunta.id, respuestaTexto: texto })
  }

  async function handleEntregar() {
    setEnviando(true)
    await entregarIntento(intento.id)
    onClose()
  }

  return (
    <Modal open onClose={onClose} title={examen.titulo}>
      {!preguntas ? (
        <Spinner />
      ) : (
        <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto">
          {examen.duracion_minutos && (
            <p className="rounded-md bg-warning-50 px-3 py-2 text-sm font-medium text-warning-700">
              Tienes {examen.duracion_minutos} minutos una vez que empiezas.
            </p>
          )}
          {preguntas.map((p, i) => (
            <div key={p.id} className="rounded-md border border-slate-200 p-3">
              <p className="mb-2 font-medium text-ink">{i + 1}. {p.enunciado} <span className="text-xs text-ink-faint">({p.puntos} pts)</span></p>
              {p.tipo === 'abierta' ? (
                <textarea
                  className="input"
                  rows={3}
                  defaultValue={respuestas[p.id]?.texto || ''}
                  onChange={(e) => responderTexto(p, e.target.value)}
                  onBlur={() => guardarTexto(p)}
                />
              ) : (
                <div className="flex flex-col gap-1">
                  {p.examen_opciones.map((o) => (
                    <label key={o.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`pregunta-${p.id}`}
                        checked={respuestas[p.id]?.opcionId === o.id}
                        onChange={() => responderOpcion(p, o.id)}
                      />
                      {o.texto}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
          <button disabled={enviando} className="btn-primary" onClick={handleEntregar}>
            {enviando ? 'Enviando…' : 'Entregar examen'}
          </button>
        </div>
      )}
    </Modal>
  )
}
