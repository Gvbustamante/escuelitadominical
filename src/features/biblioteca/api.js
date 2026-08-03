import { supabase } from '../../lib/supabaseClient'
import { subirArchivo, urlFirmada, slugArchivo } from '../../lib/storage'

const BUCKET = 'biblioteca'

export async function listarCategorias() {
  const { data, error } = await supabase.from('biblioteca_categorias').select('*').order('orden')
  if (error) throw error
  return data
}

export async function crearCategoria(institucionId, nombre, orden) {
  const { error } = await supabase.from('biblioteca_categorias').insert({ institucion_id: institucionId, nombre, orden })
  if (error) throw error
}

export async function listarRecursos(categoriaId) {
  let query = supabase.from('biblioteca_recursos').select('*').order('created_at', { ascending: false })
  if (categoriaId) query = query.eq('categoria_id', categoriaId)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function crearRecurso({ institucionId, categoriaId, titulo, descripcion, urlExterna, archivo, subidoPor }) {
  let storagePath = null
  if (archivo) {
    storagePath = `${institucionId}/${slugArchivo(archivo.name)}`
    await subirArchivo(BUCKET, storagePath, archivo)
  }
  const { error } = await supabase.from('biblioteca_recursos').insert({
    institucion_id: institucionId, categoria_id: categoriaId || null, titulo, descripcion: descripcion || null,
    tipo: archivo ? 'archivo' : 'enlace', storage_path: storagePath, url_externa: urlExterna || null, subido_por: subidoPor,
  })
  if (error) throw error
}

export async function eliminarRecurso(recurso) {
  const { error } = await supabase.from('biblioteca_recursos').delete().eq('id', recurso.id)
  if (error) throw error
}

export async function abrirRecurso(recurso) {
  if (recurso.url_externa) return recurso.url_externa
  return urlFirmada(BUCKET, recurso.storage_path)
}
