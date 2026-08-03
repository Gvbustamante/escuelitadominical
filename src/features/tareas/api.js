import { supabase } from '../../lib/supabaseClient'
import { subirArchivo, eliminarArchivo, urlFirmada, slugArchivo } from '../../lib/storage'

const BUCKET = 'entregas-tareas'

export async function listarTareas(moduloId) {
  const { data, error } = await supabase
    .from('tareas_academicas')
    .select('*, tareas_academicas_entregas(id, estudiante_id, estado, calificacion)')
    .eq('modulo_id', moduloId)
    .order('fecha_limite')
  if (error) throw error
  return data
}

export async function crearTarea(payload) {
  const { error } = await supabase.from('tareas_academicas').insert(payload)
  if (error) throw error
}

export async function eliminarTarea(id) {
  const { error } = await supabase.from('tareas_academicas').delete().eq('id', id)
  if (error) throw error
}

export async function listarEntregas(tareaId) {
  const { data, error } = await supabase
    .from('tareas_academicas_entregas')
    .select('*, estudiante:estudiante_id(id, nombre_completo)')
    .eq('tarea_id', tareaId)
  if (error) throw error
  return data
}

export async function calificarEntrega(id, calificacion, retroalimentacion) {
  const { error } = await supabase
    .from('tareas_academicas_entregas')
    .update({ calificacion, retroalimentacion, estado: 'calificada', calificado_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function abrirEntrega(storagePath) {
  return urlFirmada(BUCKET, storagePath)
}

// --- Lado estudiante ---

export async function obtenerMiEntrega(tareaId, estudianteId) {
  const { data, error } = await supabase
    .from('tareas_academicas_entregas')
    .select('*')
    .eq('tarea_id', tareaId)
    .eq('estudiante_id', estudianteId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function entregarTarea({ tareaId, estudianteId, institucionId, comentario, archivo }) {
  let storagePath = null
  if (archivo) {
    storagePath = `${institucionId}/${estudianteId}/${slugArchivo(archivo.name)}`
    await subirArchivo(BUCKET, storagePath, archivo)
  }
  const { error } = await supabase.from('tareas_academicas_entregas').upsert(
    {
      tarea_id: tareaId,
      estudiante_id: estudianteId,
      storage_path: storagePath,
      comentario: comentario || null,
      estado: 'entregada',
      entregado_at: new Date().toISOString(),
    },
    { onConflict: 'tarea_id,estudiante_id' },
  )
  if (error) throw error
}

export { BUCKET as BUCKET_ENTREGAS }
export { eliminarArchivo as eliminarArchivoEntrega }
