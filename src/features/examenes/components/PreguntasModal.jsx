import { useEffect, useState } from 'react'
import Modal from '../../../components/Modal'
import Icon from '../../../components/ui/Icon'
import Spinner from '../../../components/Spinner'
import EmptyState from '../../../components/ui/EmptyState'
import { listarPreguntas, crearPregunta, eliminarPregunta } from '../api'

const TIPOS = [
  { value: 'opcion_multiple', label: 'Opción múltiple' },
  { value: 'verdadero_falso', label: 'Verdadero / falso' },
  { value: 'abierta', label: 'Respuesta abierta' },
]

export default function PreguntasModal({ examen, onClose }) {
  const [preguntas, setPreguntas] = useState(null)
  const [form, setForm] = useState(false)
  const [enunciado, setEnunciado] = useState('')
  const [tipo, setTipo] = useState('opcion_multiple')
  const [puntos, setPuntos] = useState(1)
  const [opciones, setOpciones] = useState([{ texto: '', es_correcta: true }, { texto: '', es_correcta: false }])

  async function cargar() {
    setPreguntas(await listarPreguntas(examen.id))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examen.id])

  function resetForm() {
    setEnunciado(''); setTipo('opcion_multiple'); setPuntos(1)
    setOpciones([{ texto: '', es_correcta: true }, { texto: '', es_correcta: false }])
    setForm(false)
  }

  function setOpcionTexto(i, texto) {
    setOpciones((o) => o.map((op, idx) => (idx === i ? { ...op, texto } : op)))
  }

  function setOpcionCorrecta(i) {
    if (tipo === 'verdadero_falso' || tipo === 'opcion_multiple') {
      setOpciones((o) => o.map((op, idx) => ({ ...op, es_correcta: idx === i })))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const opcionesFinal = tipo === 'verdadero_falso'
      ? [{ texto: 'Verdadero', es_correcta: opciones[0]?.es_correcta ?? true }, { texto: 'Falso', es_correcta: !(opciones[0]?.es_correcta ?? true) }]
      : tipo === 'opcion_multiple' ? opciones.filter((o) => o.texto.trim()) : []
    await crearPregunta({ examenId: examen.id, orden: (preguntas?.length || 0), enunciado, tipo, puntos, opciones: opcionesFinal })
    resetForm()
    cargar()
  }

  async function handleEliminar(id) {
    await eliminarPregunta(id)
    cargar()
  }

  return (
    <Modal open onClose={onClose} title={`Preguntas — ${examen.titulo}`}>
      <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto">
        {preguntas === null ? (
          <Spinner />
        ) : preguntas.length === 0 ? (
          <EmptyState icon="award" title="Sin preguntas todavía" />
        ) : (
          preguntas.map((p, i) => (
            <div key={p.id} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium text-ink">{i + 1}. {p.enunciado} <span className="text-xs text-ink-faint">({p.puntos} pts)</span></p>
                <button className="btn-ghost !px-2 !py-1 text-danger-600" onClick={() => handleEliminar(p.id)}>
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
              {p.tipo !== 'abierta' && (
                <ul className="mt-2 space-y-1 text-sm">
                  {p.examen_opciones.map((o) => (
                    <li key={o.id} className={o.es_correcta ? 'font-medium text-success-700' : 'text-ink-soft'}>
                      {o.es_correcta && '✓ '}{o.texto}
                    </li>
                  ))}
                </ul>
              )}
              {p.tipo === 'abierta' && <p className="mt-1 text-xs text-ink-faint">Respuesta abierta — se califica manualmente.</p>}
            </div>
          ))
        )}

        {!form ? (
          <button className="btn-secondary" onClick={() => setForm(true)}>
            <Icon name="plus" className="h-4 w-4" /> Agregar pregunta
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-md border border-slate-200 p-3">
            <div>
              <label className="label">Enunciado</label>
              <textarea required className="input" rows={2} value={enunciado} onChange={(e) => setEnunciado(e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Puntos</label>
                <input type="number" min="1" className="input" value={puntos} onChange={(e) => setPuntos(Number(e.target.value))} />
              </div>
            </div>

            {tipo === 'opcion_multiple' && (
              <div className="flex flex-col gap-2">
                <label className="label !mb-0">Opciones (marca la correcta)</label>
                {opciones.map((o, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="radio" name="correcta" checked={o.es_correcta} onChange={() => setOpcionCorrecta(i)} />
                    <input className="input" value={o.texto} onChange={(e) => setOpcionTexto(i, e.target.value)} placeholder={`Opción ${i + 1}`} />
                  </div>
                ))}
                <button type="button" className="text-sm font-medium text-brand hover:underline" onClick={() => setOpciones((o) => [...o, { texto: '', es_correcta: false }])}>
                  + Agregar opción
                </button>
              </div>
            )}

            {tipo === 'verdadero_falso' && (
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="vf" checked={opciones[0]?.es_correcta} onChange={() => setOpcionCorrecta(0)} /> Verdadero</label>
                <label className="flex items-center gap-2 text-sm"><input type="radio" name="vf" checked={!opciones[0]?.es_correcta} onChange={() => setOpcionCorrecta(1)} /> Falso</label>
              </div>
            )}

            <div className="flex gap-2">
              <button className="btn-primary">Guardar pregunta</button>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
