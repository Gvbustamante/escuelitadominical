import { supabase } from '../../lib/supabaseClient'

async function contar(query) {
  const { count, error } = await query
  if (error) throw error
  return count || 0
}

// Estado real de la configuración del instituto, leído de la base en cada visita en vez de
// guardarse como "checklist completado" en una tabla aparte. Así el checklist nunca miente:
// si un administrador borra el último diplomado, el paso vuelve a aparecer como pendiente.
// Todas estas consultas ya están acotadas al instituto del usuario por RLS.
export async function estadoPuestaEnMarcha() {
  const [
    diplomados,
    diplomadosSinLider,
    modulos,
    lideres,
    docentes,
    asignacionesDocente,
    estudiantes,
    matriculas,
    conceptosPago,
    plantillasCertificado,
    recursosBiblioteca,
  ] = await Promise.all([
    contar(supabase.from('diplomados').select('id', { count: 'exact', head: true })),
    contar(supabase.from('diplomados').select('id', { count: 'exact', head: true }).is('lider_id', null)),
    contar(supabase.from('modulos').select('id', { count: 'exact', head: true })),
    contar(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'lider')),
    contar(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'docente')),
    contar(supabase.from('modulo_docentes').select('modulo_id', { count: 'exact', head: true })),
    contar(supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'estudiante')),
    contar(supabase.from('matriculas').select('id', { count: 'exact', head: true })),
    contar(supabase.from('conceptos_pago').select('id', { count: 'exact', head: true })),
    contar(supabase.from('plantillas_certificado').select('id', { count: 'exact', head: true })),
    contar(supabase.from('biblioteca_recursos').select('id', { count: 'exact', head: true })),
  ])

  return {
    diplomados,
    diplomadosSinLider,
    modulos,
    lideres,
    docentes,
    asignacionesDocente,
    estudiantes,
    matriculas,
    conceptosPago,
    plantillasCertificado,
    recursosBiblioteca,
  }
}
