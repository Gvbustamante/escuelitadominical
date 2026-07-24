import { supabase } from './supabaseClient'

export async function inviteUser(payload) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ ...payload, redirectTo: window.location.origin }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error al invitar')
  return data
}
