import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useMisHijos } from '../../lib/useMisHijos'
import Spinner from '../../components/Spinner'

export default function PadreProgreso() {
  const hijos = useMisHijos()
  const [notasPorHijo, setNotasPorHijo] = useState(null)

  useEffect(() => {
    async function load() {
      if (!hijos) return
      const ids = hijos.map((h) => h.id)
      if (ids.length === 0) {
        setNotasPorHijo({})
        return
      }
      const { data } = await supabase.from('progreso_notas').select('*').in('nino_id', ids).order('fecha', { ascending: false })
      const grouped = {}
      ;(data || []).forEach((n) => {
        grouped[n.nino_id] = grouped[n.nino_id] || []
        grouped[n.nino_id].push(n)
      })
      setNotasPorHijo(grouped)
    }
    load()
  }, [hijos])

  if (!hijos || !notasPorHijo) return <Spinner />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Progreso 🌱</h1>
        <p className="text-ink/50">Cómo le fue a tu hijo/a en cada clase</p>
      </div>

      {hijos.map((h) => (
        <div key={h.id}>
          <h2 className="mb-2 text-xl font-bold">{h.nombre_completo}</h2>
          <div className="flex flex-col gap-3">
            {(notasPorHijo[h.id] || []).map((nota) => (
              <div key={nota.id} className="card">
                <p className="text-sm font-bold text-ink/40">{nota.fecha}</p>
                {nota.emocion && <p className="mt-1 text-lg">{nota.emocion}</p>}
                {nota.comportamiento && (
                  <p className="mt-1 text-sm font-bold text-sky-600">Comportamiento: {nota.comportamiento}</p>
                )}
                {nota.logros && <p className="mt-2 text-ink/70">🌟 {nota.logros}</p>}
              </div>
            ))}
            {(notasPorHijo[h.id] || []).length === 0 && (
              <p className="card text-ink/40">Aún no hay notas de progreso para {h.nombre_completo.split(' ')[0]}.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
