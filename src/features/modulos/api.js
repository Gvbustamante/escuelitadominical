import { supabase } from '../../lib/supabaseClient'

const SELECT = '*, modulo_docentes(docente:docente_id(id, nombre_completo))'

export async function listarModulosPorDiplomado(diplomadoId) {
  const { data, error } = await supabase
    .from('modulos')
    .select(SELECT)
    .eq('diplomado_id', diplomadoId)
    .order('orden')
  if (error) throw error
  return data
}

export async function obtenerModulo(id) {
  const { data, error } = await supabase.from('modulos').select(SELECT).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function crearModulo(payload) {
  const { data, error } = await supabase.from('modulos').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function actualizarModulo(id, payload) {
  const { data, error } = await supabase.from('modulos').update(payload).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function eliminarModulo(id) {
  const { error } = await supabase.from('modulos').delete().eq('id', id)
  if (error) throw error
}

export async function listarDocentesDisponibles() {
  const { data, error } = await supabase.from('profiles').select('id, nombre_completo').eq('role', 'docente').order('nombre_completo')
  if (error) throw error
  return data
}

export async function asignarDocentes(moduloId, docenteIds) {
  const { data: actuales, error: e1 } = await supabase.from('modulo_docentes').select('docente_id').eq('modulo_id', moduloId)
  if (e1) throw e1
  const actualesIds = actuales.map((r) => r.docente_id)
  const aAgregar = docenteIds.filter((id) => !actualesIds.includes(id))
  const aQuitar = actualesIds.filter((id) => !docenteIds.includes(id))

  if (aAgregar.length) {
    const { error } = await supabase.from('modulo_docentes').insert(aAgregar.map((docente_id) => ({ modulo_id: moduloId, docente_id })))
    if (error) throw error
  }
  if (aQuitar.length) {
    const { error } = await supabase.from('modulo_docentes').delete().eq('modulo_id', moduloId).in('docente_id', aQuitar)
    if (error) throw error
  }
}
