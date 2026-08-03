import { supabase } from '../../lib/supabaseClient'
import { subirArchivo, urlFirmada, slugArchivo } from '../../lib/storage'
import { ROLES } from '../../lib/roles'

const BUCKET = 'mensajes-adjuntos'

export async function listarContactosDisponibles(role, userId) {
  if (role === ROLES.ADMINISTRADOR) {
    const { data, error } = await supabase.from('profiles').select('id, nombre_completo, role').in('role', ['lider', 'docente']).order('nombre_completo')
    if (error) throw error
    return data
  }

  if (role === ROLES.LIDER) {
    const { data: admins, error: e1 } = await supabase.from('profiles').select('id, nombre_completo, role').eq('role', 'administrador')
    if (e1) throw e1
    const { data: miDiplomado } = await supabase.from('diplomados').select('id').eq('lider_id', userId).maybeSingle()
    if (!miDiplomado) return admins
    const { data: asignaciones, error: e2 } = await supabase
      .from('modulo_docentes')
      .select('docente:docente_id(id, nombre_completo, role), modulo:modulo_id(diplomado_id)')
    if (e2) throw e2
    const docentesFiltrados = asignaciones.filter((row) => row.modulo?.diplomado_id === miDiplomado.id).map((row) => row.docente)
    const vistos = new Set()
    return [...admins, ...docentesFiltrados].filter((p) => (vistos.has(p.id) ? false : vistos.add(p.id)))
  }

  if (role === ROLES.DOCENTE) {
    const { data, error } = await supabase.from('profiles').select('id, nombre_completo, role').in('role', ['administrador', 'lider'])
    if (error) throw error
    return data
  }

  return []
}

export async function listarConversaciones(userId) {
  const { data, error } = await supabase
    .from('conversacion_participantes')
    .select('conversacion:conversacion_id(id, tipo, titulo, created_at, mensajes(id, contenido, autor_id, created_at))')
    .eq('profile_id', userId)
  if (error) throw error
  return data
    .map((r) => r.conversacion)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

export async function obtenerOCrearConversacion(institucionId, misterId, otroId) {
  const { data: existentes, error: e1 } = await supabase
    .from('conversacion_participantes')
    .select('conversacion_id')
    .eq('profile_id', misterId)
  if (e1) throw e1

  for (const row of existentes) {
    const { data: participantes } = await supabase.from('conversacion_participantes').select('profile_id').eq('conversacion_id', row.conversacion_id)
    const ids = participantes.map((p) => p.profile_id)
    if (ids.length === 2 && ids.includes(otroId)) return row.conversacion_id
  }

  const { data: nueva, error: e2 } = await supabase
    .from('conversaciones')
    .insert({ institucion_id: institucionId, tipo: 'directa', created_by: misterId })
    .select()
    .single()
  if (e2) throw e2

  const { error: e3 } = await supabase.from('conversacion_participantes').insert([
    { conversacion_id: nueva.id, profile_id: misterId },
    { conversacion_id: nueva.id, profile_id: otroId },
  ])
  if (e3) throw e3

  return nueva.id
}

export async function listarMensajes(conversacionId) {
  const { data, error } = await supabase
    .from('mensajes')
    .select('*, autor:autor_id(nombre_completo), mensaje_adjuntos(*)')
    .eq('conversacion_id', conversacionId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function enviarMensaje({ conversacionId, autorId, institucionId, contenido, archivo }) {
  const { data: mensaje, error } = await supabase
    .from('mensajes')
    .insert({ conversacion_id: conversacionId, autor_id: autorId, contenido })
    .select()
    .single()
  if (error) throw error

  if (archivo) {
    const path = `${institucionId}/${conversacionId}/${slugArchivo(archivo.name)}`
    await subirArchivo(BUCKET, path, archivo)
    const { error: e2 } = await supabase.from('mensaje_adjuntos').insert({
      mensaje_id: mensaje.id, storage_path: path, nombre_archivo: archivo.name, tipo_archivo: archivo.type,
    })
    if (e2) throw e2
  }
  return mensaje
}

export async function fijarMensaje(id, fijado) {
  const { error } = await supabase.from('mensajes').update({ fijado }).eq('id', id)
  if (error) throw error
}

export async function marcarLeido(mensajeId, profileId) {
  const { error } = await supabase.from('mensaje_lecturas').upsert({ mensaje_id: mensajeId, profile_id: profileId }, { onConflict: 'mensaje_id,profile_id', ignoreDuplicates: true })
  if (error) throw error
}

export async function verAdjunto(path) {
  return urlFirmada(BUCKET, path)
}
