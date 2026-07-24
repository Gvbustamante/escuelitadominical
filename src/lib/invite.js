import { supabase } from './supabaseClient'

export async function inviteUser({ email, nombre_completo, role, nino_id, parentesco }) {
  const { error: rpcError } = await supabase.rpc('admin_create_invited_user', {
    p_email: email,
    p_role: role,
    p_nombre_completo: nombre_completo,
    p_nino_id: nino_id ?? null,
    p_parentesco: parentesco ?? null,
  })
  if (rpcError) throw new Error(rpcError.message)

  const base = window.location.origin + import.meta.env.BASE_URL
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: base,
  })
  if (resetError) throw new Error(resetError.message)
}
