import { supabase } from '../../lib/supabaseClient'
import { subirArchivo, urlFirmada, slugArchivo } from '../../lib/storage'

const BUCKET = 'comprobantes-pago'

// --- Conceptos de pago (administrador) ---

export async function listarConceptos() {
  const { data, error } = await supabase.from('conceptos_pago').select('*, diplomado:diplomado_id(nombre)').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listarConceptosActivos() {
  const { data, error } = await supabase.from('conceptos_pago').select('*').eq('activo', true).order('nombre')
  if (error) throw error
  return data
}

export async function crearConcepto(payload) {
  const { error } = await supabase.from('conceptos_pago').insert(payload)
  if (error) throw error
}

export async function actualizarConcepto(id, payload) {
  const { error } = await supabase.from('conceptos_pago').update(payload).eq('id', id)
  if (error) throw error
}

// --- Pagos ---

export async function listarPagos({ estado } = {}) {
  let query = supabase
    .from('pagos')
    .select('*, estudiante:estudiante_id(id, nombre_completo), concepto:concepto_id(nombre, tipo)')
    .order('created_at', { ascending: false })
  if (estado) query = query.eq('estado', estado)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function listarMisPagos(estudianteId) {
  const { data, error } = await supabase
    .from('pagos')
    .select('*, concepto:concepto_id(nombre, tipo, monto)')
    .eq('estudiante_id', estudianteId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function registrarPago({ institucionId, estudianteId, conceptoId, monto, metodoPago, referencia, comprobante }) {
  let comprobanteUrl = null
  if (comprobante) {
    const path = `${institucionId}/${estudianteId}/${slugArchivo(comprobante.name)}`
    await subirArchivo(BUCKET, path, comprobante)
    comprobanteUrl = path
  }
  const { error } = await supabase.from('pagos').insert({
    institucion_id: institucionId, estudiante_id: estudianteId, concepto_id: conceptoId,
    monto, metodo_pago: metodoPago || null, referencia: referencia || null, comprobante_url: comprobanteUrl,
  })
  if (error) throw error
}

export async function verComprobante(path) {
  return urlFirmada(BUCKET, path)
}

export async function aprobarPago(pagoId, aprobar, notas) {
  const { error } = await supabase.rpc('aprobar_pago', { p_pago_id: pagoId, p_aprobar: aprobar, p_notas: notas || null })
  if (error) throw error
}

// --- Ofrendas (administrador) ---

export async function listarOfrendas() {
  const { data, error } = await supabase.from('ofrendas').select('*, donante:donante_id(nombre_completo)').order('fecha', { ascending: false })
  if (error) throw error
  return data
}

export async function crearOfrenda(payload) {
  const { error } = await supabase.from('ofrendas').insert(payload)
  if (error) throw error
}

export async function buscarPerfiles(texto) {
  const { data, error } = await supabase.from('profiles').select('id, nombre_completo').ilike('nombre_completo', `%${texto}%`).limit(10)
  if (error) throw error
  return data
}
