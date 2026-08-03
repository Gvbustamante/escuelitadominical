import { supabase } from '../../lib/supabaseClient'
import { subirArchivo, urlFirmada, slugArchivo } from '../../lib/storage'

const BUCKET = 'tareas-gestion'

export async function listarTareas() {
  const { data, error } = await supabase
    .from('tareas_gestion')
    .select('*, responsable:responsable_id(nombre_completo), asignado_por_perfil:asignado_por(nombre_completo)')
    .order('fecha_limite', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function listarResponsablesDisponibles() {
  const { data, error } = await supabase.from('profiles').select('id, nombre_completo, role').in('role', ['administrador', 'lider', 'docente']).order('nombre_completo')
  if (error) throw error
  return data
}

export async function crearTarea({ institucionId, titulo, descripcion, responsableId, asignadoPor, prioridad, fechaLimite }) {
  const { error } = await supabase.from('tareas_gestion').insert({
    institucion_id: institucionId, titulo, descripcion: descripcion || null,
    responsable_id: responsableId, asignado_por: asignadoPor, prioridad, fecha_limite: fechaLimite || null,
  })
  if (error) throw error
}

export async function actualizarEstado(tarea, nuevoEstado, cambiadoPor) {
  const { error: e1 } = await supabase.from('tareas_gestion').update({ estado: nuevoEstado }).eq('id', tarea.id)
  if (e1) throw e1
  const { error: e2 } = await supabase.from('tareas_gestion_historial').insert({
    tarea_id: tarea.id, campo: 'estado', valor_anterior: tarea.estado, valor_nuevo: nuevoEstado, cambiado_por: cambiadoPor,
  })
  if (e2) throw e2
}

export async function listarComentarios(tareaId) {
  const { data, error } = await supabase
    .from('tareas_gestion_comentarios')
    .select('*, autor:autor_id(nombre_completo)')
    .eq('tarea_id', tareaId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function crearComentario(tareaId, autorId, comentario) {
  const { error } = await supabase.from('tareas_gestion_comentarios').insert({ tarea_id: tareaId, autor_id: autorId, comentario })
  if (error) throw error
}

export async function listarArchivos(tareaId) {
  const { data, error } = await supabase.from('tareas_gestion_archivos').select('*').eq('tarea_id', tareaId).order('created_at')
  if (error) throw error
  return data
}

export async function subirArchivoTarea(tareaId, institucionId, subidoPor, archivo) {
  const path = `${institucionId}/${tareaId}/${slugArchivo(archivo.name)}`
  await subirArchivo(BUCKET, path, archivo)
  const { error } = await supabase.from('tareas_gestion_archivos').insert({ tarea_id: tareaId, storage_path: path, nombre_archivo: archivo.name, subido_por: subidoPor })
  if (error) throw error
}

export async function verArchivoTarea(path) {
  return urlFirmada(BUCKET, path)
}

export async function listarHistorial(tareaId) {
  const { data, error } = await supabase
    .from('tareas_gestion_historial')
    .select('*, cambiado_por_perfil:cambiado_por(nombre_completo)')
    .eq('tarea_id', tareaId)
    .order('created_at')
  if (error) throw error
  return data
}

export { BUCKET }
