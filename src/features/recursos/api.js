import { supabase } from '../../lib/supabaseClient'
import { subirArchivo, eliminarArchivo, slugArchivo } from '../../lib/storage'

const BUCKET = 'recursos-modulo'

export async function listarRecursos(moduloId) {
  const { data, error } = await supabase.from('recursos_modulo').select('*').eq('modulo_id', moduloId).order('orden')
  if (error) throw error
  return data
}

export async function crearRecurso({ moduloId, institucionId, tipo, titulo, urlExterna, archivo }) {
  let storagePath = null
  if (archivo) {
    storagePath = `${institucionId}/${moduloId}/${slugArchivo(archivo.name)}`
    await subirArchivo(BUCKET, storagePath, archivo)
  }
  const { error } = await supabase.from('recursos_modulo').insert({
    modulo_id: moduloId, tipo, titulo, storage_path: storagePath, url_externa: urlExterna || null,
  })
  if (error) throw error
}

export async function eliminarRecurso(recurso) {
  if (recurso.storage_path) await eliminarArchivo(BUCKET, recurso.storage_path)
  const { error } = await supabase.from('recursos_modulo').delete().eq('id', recurso.id)
  if (error) throw error
}

export { BUCKET as BUCKET_RECURSOS }
