import { supabase } from './supabaseClient'

export async function fetchInstitucionPorSlug(slug) {
  if (!slug) return null
  const { data } = await supabase
    .from('instituciones')
    .select('id, nombre, slug, logo_url, color_primario, color_secundario, activo')
    .eq('slug', slug.trim().toLowerCase())
    .maybeSingle()
  return data
}

export async function fetchInstitucionPorId(id) {
  if (!id) return null
  const { data } = await supabase
    .from('instituciones')
    .select('id, nombre, slug, logo_url, color_primario, color_secundario, activo')
    .eq('id', id)
    .maybeSingle()
  return data
}

export const ULTIMO_INSTITUTO_KEY = 'celm.ultimo_instituto_slug'
