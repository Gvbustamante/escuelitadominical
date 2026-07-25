import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function diaDelAnio() {
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), 0, 0)
  const diff = hoy - inicio
  return Math.floor(diff / 86400000)
}

export default function CitaDelDia() {
  const [cita, setCita] = useState(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('citas_biblicas').select('*').eq('activo', true).order('created_at')
      if (data && data.length > 0) {
        setCita(data[diaDelAnio() % data.length])
      }
    }
    load()
  }, [])

  if (!cita) return null

  return (
    <div className="card bg-sunshine-100">
      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-sunshine-700">📖 Versículo del día</p>
      <p className="text-lg font-bold italic text-ink">"{cita.texto}"</p>
      <p className="mt-1 text-sm font-bold text-ink/50">— {cita.referencia}</p>
    </div>
  )
}
