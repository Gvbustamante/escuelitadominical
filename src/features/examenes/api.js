import { supabase } from '../../lib/supabaseClient'

export async function listarExamenes(moduloId) {
  const { data, error } = await supabase
    .from('examenes')
    .select('*, examen_intentos(id, estudiante_id, estado, calificacion)')
    .eq('modulo_id', moduloId)
    .order('fecha_disponible_desde')
  if (error) throw error
  return data
}

export async function crearExamen(payload) {
  const { data, error } = await supabase.from('examenes').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function eliminarExamen(id) {
  const { error } = await supabase.from('examenes').delete().eq('id', id)
  if (error) throw error
}

export async function listarPreguntas(examenId) {
  const { data, error } = await supabase
    .from('examen_preguntas')
    .select('*, examen_opciones(*)')
    .eq('examen_id', examenId)
    .order('orden')
  if (error) throw error
  return data
}

export async function crearPregunta({ examenId, orden, enunciado, tipo, puntos, opciones }) {
  const { data: pregunta, error } = await supabase
    .from('examen_preguntas')
    .insert({ examen_id: examenId, orden, enunciado, tipo, puntos })
    .select()
    .single()
  if (error) throw error

  if (tipo !== 'abierta' && opciones?.length) {
    const filas = opciones.map((o, i) => ({ pregunta_id: pregunta.id, texto: o.texto, es_correcta: o.es_correcta, orden: i }))
    const { error: e2 } = await supabase.from('examen_opciones').insert(filas)
    if (e2) throw e2
  }
  return pregunta
}

export async function eliminarPregunta(id) {
  const { error } = await supabase.from('examen_preguntas').delete().eq('id', id)
  if (error) throw error
}

export async function listarIntentos(examenId) {
  const { data, error } = await supabase
    .from('examen_intentos')
    .select('*, estudiante:estudiante_id(id, nombre_completo)')
    .eq('examen_id', examenId)
    .order('entregado_at', { ascending: false })
  if (error) throw error
  return data
}

export async function listarRespuestas(intentoId) {
  const { data, error } = await supabase
    .from('examen_respuestas')
    .select('*, pregunta:pregunta_id(enunciado, tipo, puntos), opcion:opcion_id(texto, es_correcta)')
    .eq('intento_id', intentoId)
  if (error) throw error
  return data
}

export async function calificarRespuestaAbierta(respuestaId, puntos) {
  const { error } = await supabase.rpc('calificar_respuesta_abierta', { p_respuesta_id: respuestaId, p_puntos: puntos })
  if (error) throw error
}

// --- Lado estudiante ---

export async function iniciarIntento(examenId, estudianteId) {
  const { data, error } = await supabase
    .from('examen_intentos')
    .upsert({ examen_id: examenId, estudiante_id: estudianteId }, { onConflict: 'examen_id,estudiante_id', ignoreDuplicates: true })
    .select()
  if (error) throw error
  if (data?.[0]) return data[0]
  const { data: existente, error: e2 } = await supabase
    .from('examen_intentos')
    .select('*')
    .eq('examen_id', examenId)
    .eq('estudiante_id', estudianteId)
    .single()
  if (e2) throw e2
  return existente
}

export async function guardarRespuesta({ intentoId, preguntaId, opcionId, respuestaTexto }) {
  const { error } = await supabase.from('examen_respuestas').upsert(
    { intento_id: intentoId, pregunta_id: preguntaId, opcion_id: opcionId || null, respuesta_texto: respuestaTexto || null },
    { onConflict: 'intento_id,pregunta_id' },
  )
  if (error) throw error
}

export async function entregarIntento(intentoId) {
  const { error } = await supabase.from('examen_intentos').update({ entregado_at: new Date().toISOString(), estado: 'entregado' }).eq('id', intentoId)
  if (error) throw error
}
