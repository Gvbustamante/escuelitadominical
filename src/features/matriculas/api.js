import { supabase } from '../../lib/supabaseClient'

export async function listarMatriculasPorDiplomado(diplomadoId) {
  const { data, error } = await supabase
    .from('matriculas')
    .select('*, estudiante:estudiante_id(id, nombre_completo, documento_identidad)')
    .eq('diplomado_id', diplomadoId)
    .order('fecha_matricula', { ascending: false })
  if (error) throw error
  return data
}

export async function buscarEstudiantes(texto) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre_completo')
    .eq('role', 'estudiante')
    .ilike('nombre_completo', `%${texto}%`)
    .limit(10)
  if (error) throw error
  return data
}

export async function matricular(diplomadoId, estudianteId) {
  const { error } = await supabase.from('matriculas').insert({ diplomado_id: diplomadoId, estudiante_id: estudianteId })
  if (error) throw error
}

export async function actualizarEstadoMatricula(id, estado) {
  const { error } = await supabase.from('matriculas').update({ estado }).eq('id', id)
  if (error) throw error
}
