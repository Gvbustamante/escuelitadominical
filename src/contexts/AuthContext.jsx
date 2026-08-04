import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { fetchInstitucionPorId, ULTIMO_INSTITUTO_KEY } from '../lib/tenant'
import { applyBrand, resetBrand } from '../lib/brand'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [institucion, setInstitucion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      setInstitucion(null)
      resetBrand()
      return
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) {
      // Un error aquí (ej. RLS mal configurada, red caída) se ve idéntico a "el perfil no
      // existe" si se ignora silenciosamente — indistinguible en la UI y muy difícil de
      // diagnosticar en producción. Se deja explícito en consola para no repetir eso.
      console.error('Error al cargar el perfil:', error)
    }
    setProfile(data)
    if (data?.institucion_id) {
      const inst = await fetchInstitucionPorId(data.institucion_id)
      setInstitucion(inst)
      applyBrand(inst)
    }
  }, [])

  useEffect(() => {
    // Antes había además una llamada a supabase.auth.getSession() en el mount, en paralelo a
    // este listener. supabase-js ya emite un evento INITIAL_SESSION aquí mismo al suscribirse,
    // así que esa llamada extra era redundante — y peor, una carrera real: si el login se
    // completaba antes de que esa promesa (lanzada al montar, con la sesión de ESE momento)
    // resolviera, su callback llegaba tarde y pisaba el perfil recién cargado con null,
    // dejando la pantalla trabada. Con un solo camino de eventos esa carrera desaparece.
    let activo = true
    const eventosConCargaVisible = new Set(['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT'])

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      setSession(session)
      const mostrarCarga = eventosConCargaVisible.has(event)
      if (mostrarCarga) setLoading(true)
      loadProfile(session?.user?.id)
        .catch((err) => console.error('No se pudo cargar el perfil:', err))
        .finally(() => {
          if (activo && mostrarCarga) setLoading(false)
        })
    })

    return () => {
      activo = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  function buildEmail(identificador, institutoSlug) {
    const valor = identificador.trim()
    if (valor.includes('@')) return valor
    if (!institutoSlug) throw new Error('Falta el código de tu instituto')
    const documento = valor.toLowerCase().replace(/[^a-z0-9]/g, '')
    return `${documento}@${institutoSlug.trim().toLowerCase()}.celm.local`
  }

  const signIn = async (identificador, password, institutoSlug) => {
    let email
    try {
      email = buildEmail(identificador, institutoSlug)
    } catch (err) {
      return { error: { message: err.message } }
    }
    if (institutoSlug) localStorage.setItem(ULTIMO_INSTITUTO_KEY, institutoSlug.trim().toLowerCase())
    return supabase.auth.signInWithPassword({ email, password })
  }

  const signOut = () => supabase.auth.signOut()
  const refreshProfile = () => loadProfile(session?.user?.id)

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    institucion,
    loading,
    signIn,
    signOut,
    refreshProfile,
    passwordRecovery,
    clearPasswordRecovery: () => setPasswordRecovery(false),
    debeCambiarPassword: !!profile?.debe_cambiar_password,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
