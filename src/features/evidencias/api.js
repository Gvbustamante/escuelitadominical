import { supabase } from '../../lib/supabaseClient'
import { subirArchivo, slugArchivo } from '../../lib/storage'

const BUCKET = 'evidencias-clase'

export async function listarEvidencias(moduloId) {
  const { data, error } = await supabase
    .from('evidencias_clase')
    .select('*')
    .eq('modulo_id', moduloId)
    .order('fecha', { ascending: false })
  if (error) throw error
  return data
}

export async function crearEvidencia({ moduloId, institucionId, docenteId, fecha, estadoInicialTexto, fotoInicial, estadoFinalTexto, fotoFinal, observaciones }) {
  let fotoInicialUrl = null
  let fotoFinalUrl = null
  if (fotoInicial) {
    const path = `${institucionId}/${moduloId}/${slugArchivo(fotoInicial.name)}`
    await subirArchivo(BUCKET, path, fotoInicial)
    fotoInicialUrl = path
  }
  if (fotoFinal) {
    const path = `${institucionId}/${moduloId}/${slugArchivo(fotoFinal.name)}`
    await subirArchivo(BUCKET, path, fotoFinal)
    fotoFinalUrl = path
  }
  const { error } = await supabase.from('evidencias_clase').insert({
    modulo_id: moduloId, docente_id: docenteId, fecha,
    estado_inicial_texto: estadoInicialTexto || null, foto_inicial_url: fotoInicialUrl,
    estado_final_texto: estadoFinalTexto || null, foto_final_url: fotoFinalUrl,
    observaciones: observaciones || null,
  })
  if (error) throw error
}

export { BUCKET as BUCKET_EVIDENCIAS }
