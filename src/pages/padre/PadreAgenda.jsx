import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useMisHijos } from '../../lib/useMisHijos'
import Spinner from '../../components/Spinner'
import HijoSelector from '../../components/HijoSelector'

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function PadreAgenda() {
  const hijos = useMisHijos()
  const [eventos, setEventos] = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const load = useCallback(async () => {
    if (!hijos) return
    const hijosActivos = selectedId ? hijos.filter((h) => h.id === selectedId) : hijos
    const nivelIds = [...new Set(hijosActivos.map((h) => h.nivel_id).filter(Boolean))]
    const query = supabase.from('agenda').select('*, nivel:niveles(nombre)').order('fecha')
    const { data } = nivelIds.length
      ? await query.or(`nivel_id.is.null,nivel_id.in.(${nivelIds.join(',')})`)
      : await query.is('nivel_id', null)
    setEventos(data || [])
  }, [hijos, selectedId])

  useEffect(() => {
    load()
  }, [load])

  if (!hijos || !eventos) return <Spinner />

  const hoy = hoyISO()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Agenda 📅</h1>
        <p className="text-ink/50">Próximos eventos de la escuelita</p>
      </div>

      <HijoSelector hijos={hijos} selectedId={selectedId} onChange={setSelectedId} />

      <div className="flex flex-col gap-3">
        {eventos.map((ev) => (
          <div key={ev.id} className={`card flex items-center gap-4 ${ev.fecha < hoy ? 'opacity-50' : ''}`}>
            <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-sunshine-100 text-sunshine-700">
              <span className="text-xs font-bold">{new Date(ev.fecha + 'T00:00').toLocaleDateString('es', { month: 'short' })}</span>
              <span className="text-lg font-bold leading-none">{new Date(ev.fecha + 'T00:00').getDate()}</span>
            </div>
            <div>
              <p className="font-bold">{ev.titulo}</p>
              {ev.nivel?.nombre && <p className="text-xs font-bold uppercase text-sky-500">{ev.nivel.nombre}</p>}
              {ev.descripcion && <p className="text-sm text-ink/50">{ev.descripcion}</p>}
            </div>
          </div>
        ))}
        {eventos.length === 0 && <p className="card text-ink/50">No hay eventos programados.</p>}
      </div>
    </div>
  )
}
