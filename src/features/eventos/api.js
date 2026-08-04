import { supabase } from '../../lib/supabaseClient'

const CAMPOS = 'id, titulo, descripcion, tipo, fecha_inicio, fecha_fin, todo_el_dia, lugar, imagen_url, destacado, visible_para, creado_por'

export async function listarEventos({ desde, hasta } = {}) {
  let query = supabase.from('eventos').select(CAMPOS).order('fecha_inicio', { ascending: true })
  if (desde) query = query.gte('fecha_inicio', desde)
  if (hasta) query = query.lte('fecha_inicio', hasta)
  const { data, error } = await query
  if (error) throw error
  return data
}

// Agenda: solo lo que viene de hoy en adelante. Un evento con fecha_fin sigue vigente hasta
// que termina, así que se incluye si aún no ha terminado aunque ya haya empezado.
export async function listarProximosEventos(limite = 50) {
  const ahora = new Date().toISOString()
  const { data, error } = await supabase
    .from('eventos')
    .select(CAMPOS)
    .or(`fecha_fin.gte.${ahora},and(fecha_fin.is.null,fecha_inicio.gte.${ahora})`)
    .order('fecha_inicio', { ascending: true })
    .limit(limite)
  if (error) throw error
  return data
}

export async function listarEventosPasados(limite = 50) {
  const ahora = new Date().toISOString()
  const { data, error } = await supabase
    .from('eventos')
    .select(CAMPOS)
    .or(`fecha_fin.lt.${ahora},and(fecha_fin.is.null,fecha_inicio.lt.${ahora})`)
    .order('fecha_inicio', { ascending: false })
    .limit(limite)
  if (error) throw error
  return data
}

export async function obtenerEventoDestacado() {
  const { data, error } = await supabase.from('eventos').select(CAMPOS).eq('destacado', true).maybeSingle()
  if (error) throw error
  return data
}

export async function crearEvento(payload) {
  if (payload.destacado) await quitarDestacadoActual()
  const { data, error } = await supabase.from('eventos').insert(payload).select(CAMPOS).single()
  if (error) throw error
  return data
}

export async function actualizarEvento(id, payload) {
  if (payload.destacado) await quitarDestacadoActual(id)
  const { data, error } = await supabase.from('eventos').update(payload).eq('id', id).select(CAMPOS).single()
  if (error) throw error
  return data
}

export async function eliminarEvento(id) {
  const { error } = await supabase.from('eventos').delete().eq('id', id)
  if (error) throw error
}

// La base tiene un índice único parcial que impide dos destacados por institución. En vez de
// dejar que el insert falle con un error de constraint incomprensible para el usuario, se
// interpreta "destacar este" como "reemplaza al que estuviera destacado".
async function quitarDestacadoActual(exceptoId) {
  let query = supabase.from('eventos').update({ destacado: false }).eq('destacado', true)
  if (exceptoId) query = query.neq('id', exceptoId)
  const { error } = await query
  if (error) throw error
}
