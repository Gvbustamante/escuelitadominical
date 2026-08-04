import { supabase } from '../../lib/supabaseClient'
import { subirArchivo, urlFirmada, slugArchivo } from '../../lib/storage'
import { ROLES } from '../../lib/roles'

const BUCKET = 'tareas-gestion'

export async function listarTareas() {
  const { data, error } = await supabase
    .from('tareas_gestion')
    .select('*, responsable:responsable_id(nombre_completo), asignado_por_perfil:asignado_por(nombre_completo)')
    .order('fecha_limite', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

// A quién puede asignarle tareas quien está mirando la pantalla. La RLS ya rechaza un
// responsable fuera de alcance, pero ofrecerlo en el desplegable sería mentirle al usuario:
// elegiría a alguien y el guardado fallaría.
//
// El administrador manda sobre todo el staff. El líder solo sobre los docentes de su propio
// diplomado, así que se parte de sus módulos y no de la lista de perfiles.
export async function listarResponsablesDisponibles(role, profileId) {
  if (role === ROLES.LIDER) return listarDocentesDeMiDiplomado(profileId)

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nombre_completo, role')
    .in('role', ['administrador', 'lider', 'docente'])
    .order('nombre_completo')
  if (error) throw error
  return data
}

async function listarDocentesDeMiDiplomado(liderId) {
  const { data: diplomado, error: errorDiplomado } = await supabase
    .from('diplomados').select('id').eq('lider_id', liderId).maybeSingle()
  if (errorDiplomado) throw errorDiplomado
  if (!diplomado) return []

  const { data, error } = await supabase
    .from('modulo_docentes')
    .select('docente:profiles!modulo_docentes_docente_id_fkey (id, nombre_completo, role), modulo:modulos!inner (diplomado_id)')
    .eq('modulo.diplomado_id', diplomado.id)
  if (error) throw error

  // Un docente puede dictar varios módulos del mismo diplomado: se deduplica por id.
  const porId = new Map()
  for (const fila of data) {
    if (fila.docente) porId.set(fila.docente.id, fila.docente)
  }
  return [...porId.values()].sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo))
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
