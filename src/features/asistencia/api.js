import { supabase } from '../../lib/supabaseClient'

export async function listarSesiones(moduloId) {
  const { data, error } = await supabase
    .from('asistencia_sesiones')
    .select('*, asistencia_registros(id, estudiante_id, estado)')
    .eq('modulo_id', moduloId)
    .order('fecha', { ascending: false })
  if (error) throw error
  return data
}

export async function listarEstudiantesDelModulo(diplomadoId) {
  const { data, error } = await supabase
    .from('matriculas')
    .select('estudiante:estudiante_id(id, nombre_completo)')
    .eq('diplomado_id', diplomadoId)
    .eq('estado', 'activa')
  if (error) throw error
  return data.map((m) => m.estudiante)
}

export async function crearSesion(moduloId, fecha) {
  const { data, error } = await supabase.from('asistencia_sesiones').insert({ modulo_id: moduloId, fecha }).select().single()
  if (error) throw error
  return data
}

export async function guardarRegistros(sesionId, registros) {
  const filas = registros.map((r) => ({ sesion_id: sesionId, estudiante_id: r.estudiante_id, estado: r.estado }))
  const { error } = await supabase.from('asistencia_registros').upsert(filas, { onConflict: 'sesion_id,estudiante_id' })
  if (error) throw error
}
