import { supabase } from './supabaseClient'

export async function crearUsuarioInvitado({ documento, role, nombreCompleto, emailContacto, telefono }) {
  const { data, error } = await supabase.rpc('crear_usuario_invitado', {
    p_documento: documento,
    p_role: role,
    p_nombre_completo: nombreCompleto,
    p_email_contacto: emailContacto ?? null,
    p_telefono: telefono ?? null,
  })
  if (error) throw new Error(error.message)
  const row = Array.isArray(data) ? data[0] : data
  return { id: row.id, password: row.password }
}
