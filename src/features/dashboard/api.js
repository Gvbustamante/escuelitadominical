import { supabase } from '../../lib/supabaseClient'

async function contar(query) {
  const { count, error } = await query
  if (error) throw error
  return count || 0
}

export async function statsAdministrador() {
  const inicioMes = new Date()
  inicioMes.setDate(1)
  const inicioMesStr = inicioMes.toISOString().slice(0, 10)

  const [diplomadosActivos, estudiantes, pagosPendientes, tareasVencidas, certificadosMes] = await Promise.all([
    contar(supabase.from('diplomados').select('id', { count: 'exact', head: true }).eq('estado', 'activo')),
    contar(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'estudiante')),
    contar(supabase.from('pagos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente')),
    contar(
      supabase.from('tareas_gestion').select('id', { count: 'exact', head: true })
        .not('estado', 'in', '(completada,cancelada)')
        .lt('fecha_limite', new Date().toISOString().slice(0, 10)),
    ),
    contar(supabase.from('certificados').select('id', { count: 'exact', head: true }).gte('fecha_emision', inicioMesStr)),
  ])

  return { diplomadosActivos, estudiantes, pagosPendientes, tareasVencidas, certificadosMes }
}

async function idsModulosDe(diplomadoId) {
  const { data, error } = await supabase.from('modulos').select('id').eq('diplomado_id', diplomadoId)
  if (error) throw error
  return data.map((m) => m.id)
}

async function idsModulosDeDocente(docenteId) {
  const { data, error } = await supabase.from('modulo_docentes').select('modulo_id').eq('docente_id', docenteId)
  if (error) throw error
  return data.map((m) => m.modulo_id)
}

async function entregasPorCalificar(moduloIds) {
  if (moduloIds.length === 0) return 0
  const { data: tareas } = await supabase.from('tareas_academicas').select('id').in('modulo_id', moduloIds)
  const tareaIds = (tareas || []).map((t) => t.id)
  if (tareaIds.length === 0) return 0
  return contar(supabase.from('tareas_academicas_entregas').select('id', { count: 'exact', head: true }).eq('estado', 'entregada').in('tarea_id', tareaIds))
}

async function examenesPorRevisar(moduloIds) {
  if (moduloIds.length === 0) return 0
  const { data: examenes } = await supabase.from('examenes').select('id').in('modulo_id', moduloIds)
  const examenIds = (examenes || []).map((e) => e.id)
  if (examenIds.length === 0) return 0
  return contar(supabase.from('examen_intentos').select('id', { count: 'exact', head: true }).eq('estado', 'entregado').in('examen_id', examenIds))
}

export async function statsLider(liderId) {
  const { data: diplomado } = await supabase.from('diplomados').select('id, nombre').eq('lider_id', liderId).maybeSingle()
  if (!diplomado) return { diplomado: null }

  const moduloIds = await idsModulosDe(diplomado.id)
  const [modulos, estudiantesMatriculados, entregas, examenes] = await Promise.all([
    Promise.resolve(moduloIds.length),
    contar(supabase.from('matriculas').select('id', { count: 'exact', head: true }).eq('diplomado_id', diplomado.id).eq('estado', 'activa')),
    entregasPorCalificar(moduloIds),
    examenesPorRevisar(moduloIds),
  ])

  return { diplomado, modulos, estudiantesMatriculados, entregas, examenes }
}

export async function statsDocente(docenteId) {
  const moduloIds = await idsModulosDeDocente(docenteId)
  const [entregas, examenes, asistenciaPendiente] = await Promise.all([
    entregasPorCalificar(moduloIds),
    examenesPorRevisar(moduloIds),
    contar(
      moduloIds.length
        ? supabase.from('asistencia_sesiones').select('id', { count: 'exact', head: true }).in('modulo_id', moduloIds).eq('fecha', new Date().toISOString().slice(0, 10))
        : Promise.resolve({ count: 0, error: null }),
    ),
  ])
  return { modulos: moduloIds.length, entregas, examenes, asistenciaHoyRegistrada: asistenciaPendiente > 0 }
}

export async function statsEstudiante(estudianteId) {
  const [diplomados, pagosPendientes, certificados] = await Promise.all([
    contar(supabase.from('matriculas').select('id', { count: 'exact', head: true }).eq('estudiante_id', estudianteId).eq('estado', 'activa')),
    contar(supabase.from('pagos').select('id', { count: 'exact', head: true }).eq('estudiante_id', estudianteId).eq('estado', 'pendiente')),
    contar(supabase.from('certificados').select('id', { count: 'exact', head: true }).eq('estudiante_id', estudianteId)),
  ])
  return { diplomados, pagosPendientes, certificados }
}
