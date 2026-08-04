import { supabase } from '../../lib/supabaseClient'

// instituciones tiene lectura abierta (el login necesita la marca antes de autenticar), así
// que este listado no expone nada que no se pueda ver ya desde la pantalla de acceso.
export async function listarProgramas() {
  const { data, error } = await supabase
    .from('instituciones')
    .select('id, nombre, slug, logo_url, color_primario, color_secundario, activo, created_at')
    .order('created_at')
  if (error) throw error
  return data
}

// Crea el programa y su primer administrador de una sola vez. Devuelve el usuario y la
// contraseña temporal: es la única vez que esa contraseña se puede ver, después solo queda
// el hash en la base.
export async function crearPrograma({ nombre, codigo, adminNombre, adminEmail, adminDocumento, colorPrimario, colorSecundario }) {
  const { data, error } = await supabase.rpc('crear_programa', {
    p_nombre: nombre,
    p_codigo: codigo,
    p_admin_nombre: adminNombre,
    p_admin_email: adminEmail || null,
    p_admin_documento: adminDocumento || null,
    p_color_primario: colorPrimario || null,
    p_color_secundario: colorSecundario || null,
  })
  if (error) throw error
  return data[0]
}

// Sugiere un código a partir del nombre, con las mismas reglas que valida la función SQL.
export function codigoSugerido(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
