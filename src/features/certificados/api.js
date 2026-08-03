import { supabase } from '../../lib/supabaseClient'
import { subirArchivo, slugArchivo } from '../../lib/storage'

const BUCKET = 'marca'

export async function listarPlantillas() {
  const { data, error } = await supabase.from('plantillas_certificado').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function crearPlantilla(payload) {
  const { error } = await supabase.from('plantillas_certificado').insert(payload)
  if (error) throw error
}

export async function subirImagenPlantilla(institucionId, archivo) {
  const path = `${institucionId}/certificados/${slugArchivo(archivo.name)}`
  await subirArchivo(BUCKET, path, archivo)
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function listarCertificados() {
  const { data, error } = await supabase
    .from('certificados')
    .select('*, estudiante:estudiante_id(nombre_completo), diplomado:diplomado_id(nombre)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listarMisCertificados(estudianteId) {
  const { data, error } = await supabase
    .from('certificados')
    .select('*, diplomado:diplomado_id(nombre), institucion:institucion_id(nombre, logo_url)')
    .eq('estudiante_id', estudianteId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function obtenerCertificado(id) {
  const { data, error } = await supabase
    .from('certificados')
    .select('*, estudiante:estudiante_id(nombre_completo), diplomado:diplomado_id(nombre), institucion:institucion_id(nombre, logo_url), plantilla:plantilla_id(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function listarEstudiantesCertificables(diplomadoId) {
  const { data, error } = await supabase
    .from('matriculas')
    .select('estudiante:estudiante_id(id, nombre_completo)')
    .eq('diplomado_id', diplomadoId)
  if (error) throw error
  return data.map((m) => m.estudiante)
}

export async function emitirCertificado(estudianteId, diplomadoId, plantillaId) {
  const { data, error } = await supabase.rpc('emitir_certificado', {
    p_estudiante_id: estudianteId, p_diplomado_id: diplomadoId, p_plantilla_id: plantillaId || null,
  })
  if (error) throw error
  return data
}
