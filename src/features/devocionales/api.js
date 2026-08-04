import { supabase } from '../../lib/supabaseClient'

const CAMPOS = `
  id, titulo, referencia_biblica, contenido, imagen_url, fecha, modulo_id, creado_por,
  autor:profiles!devocionales_creado_por_fkey (id, nombre_completo),
  modulo:modulos (id, nombre)
`

export async function listarDevocionales({ moduloId } = {}) {
  let query = supabase.from('devocionales').select(CAMPOS).order('fecha', { ascending: false })
  // moduloId undefined = todos los que el usuario pueda ver; null = solo los institucionales.
  if (moduloId === null) query = query.is('modulo_id', null)
  else if (moduloId) query = query.eq('modulo_id', moduloId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function crearDevocional(payload) {
  const { data, error } = await supabase.from('devocionales').insert(payload).select('id').single()
  if (error) throw error
  return data
}

export async function actualizarDevocional(id, payload) {
  const { data, error } = await supabase.from('devocionales').update(payload).eq('id', id).select('id').single()
  if (error) throw error
  return data
}

export async function eliminarDevocional(id) {
  const { error } = await supabase.from('devocionales').delete().eq('id', id)
  if (error) throw error
}
