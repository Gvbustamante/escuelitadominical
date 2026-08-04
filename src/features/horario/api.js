import { supabase } from '../../lib/supabaseClient'

// Módulos del diplomado con su horario y sus docentes.
export async function modulosConHorario(diplomadoId) {
  const { data, error } = await supabase
    .from('modulos')
    .select(`
      id, nombre, salon, dia_semana, hora_inicio, hora_fin, fecha_inicio, fecha_fin,
      modulo_docentes (docente:profiles!modulo_docentes_docente_id_fkey (id, nombre_completo))
    `)
    .eq('diplomado_id', diplomadoId)
    .order('orden')
  if (error) throw error
  return data
}

// Carga de los docentes del diplomado en TODOS los diplomados donde dan clase, no solo en
// este. Es el dato que hoy le falta al líder para no chocar: un docente suyo puede tener
// módulos en otro diplomado que el líder no ve, y asignarle una hora ya ocupada no produce
// ningún aviso hasta el día de la clase.
//
// La RLS de modulos solo deja ver los módulos propios, así que un líder no puede consultar
// los de otro diplomado por la vía normal. Por eso va por una función security definer que
// devuelve únicamente lo mínimo para detectar el choque —día, hora y nombre del diplomado—
// sin exponer nada más de ese otro diplomado.
export async function ocupacionExternaDeDocentes(diplomadoId) {
  const { data, error } = await supabase.rpc('ocupacion_docentes_fuera_del_diplomado', {
    p_diplomado_id: diplomadoId,
  })
  if (error) throw error
  return data
}
