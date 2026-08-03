import { supabase } from './supabaseClient'

export async function subirArchivo(bucket, path, file) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false })
  if (error) throw error
  return path
}

export async function urlFirmada(bucket, path, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export async function eliminarArchivo(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}

export function slugArchivo(nombre) {
  const partes = nombre.split('.')
  const ext = partes.length > 1 ? '.' + partes.pop() : ''
  const base = partes.join('.').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return `${Date.now()}-${base || 'archivo'}${ext}`
}
