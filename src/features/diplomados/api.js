import { supabase } from '../../lib/supabaseClient'

const SELECT = '*, lider:lider_id(id, nombre_completo)'

export async function listarDiplomados() {
  const { data, error } = await supabase.from('diplomados').select(SELECT).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function obtenerDiplomado(id) {
  const { data, error } = await supabase.from('diplomados').select(SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function crearDiplomado(payload) {
  const { data, error } = await supabase.from('diplomados').insert(payload).select(SELECT).single()
  if (error) throw error
  return data
}

export async function actualizarDiplomado(id, payload) {
  const { data, error } = await supabase.from('diplomados').update(payload).eq('id', id).select(SELECT).single()
  if (error) throw error
  return data
}

export async function listarLideresDisponibles(liderActualId) {
  const [{ data: lideres, error: e1 }, { data: diplomados, error: e2 }] = await Promise.all([
    supabase.from('profiles').select('id, nombre_completo').eq('role', 'lider').order('nombre_completo'),
    supabase.from('diplomados').select('lider_id').not('lider_id', 'is', null),
  ])
  if (e1) throw e1
  if (e2) throw e2
  const ocupados = new Set(diplomados.map((d) => d.lider_id))
  return lideres.filter((l) => !ocupados.has(l.id) || l.id === liderActualId)
}
