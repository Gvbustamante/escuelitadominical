import { supabase } from '../../lib/supabaseClient'

export async function listarPerfiles({ role } = {}) {
  let query = supabase
    .from('profiles')
    .select('id, nombre_completo, role, documento_identidad, email_contacto, telefono, activo, created_at')
    .order('nombre_completo')
  if (role) query = query.eq('role', role)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function actualizarActivo(id, activo) {
  const { error } = await supabase.from('profiles').update({ activo }).eq('id', id)
  if (error) throw error
}
