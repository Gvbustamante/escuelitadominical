import { supabase } from '../../lib/supabaseClient'

export async function listarCalificaciones(moduloId, diplomadoId) {
  const [{ data: matriculas, error: e1 }, { data: calificaciones, error: e2 }] = await Promise.all([
    supabase.from('matriculas').select('estudiante:estudiante_id(id, nombre_completo)').eq('diplomado_id', diplomadoId).eq('estado', 'activa'),
    supabase.from('calificaciones_modulo').select('*').eq('modulo_id', moduloId),
  ])
  if (e1) throw e1
  if (e2) throw e2
  return matriculas.map((m) => ({
    estudiante: m.estudiante,
    calificacion: calificaciones.find((c) => c.estudiante_id === m.estudiante.id) || null,
  }))
}

export async function guardarCalificacion(moduloId, estudianteId, notaFinal, aprobado) {
  const { error } = await supabase.from('calificaciones_modulo').upsert(
    { modulo_id: moduloId, estudiante_id: estudianteId, nota_final: notaFinal, aprobado },
    { onConflict: 'modulo_id,estudiante_id' },
  )
  if (error) throw error
}

export async function publicarCalificacion(id, publicada) {
  const { error } = await supabase.from('calificaciones_modulo').update({ publicada }).eq('id', id)
  if (error) throw error
}
