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
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(data)
    if (data?.institucion_id) {
      const inst = await fetchInstitucionPorId(data.institucion_id)
      setInstitucion(inst)
      applyBrand(inst)
    }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      loadProfile(session?.user?.id).finally(() => setLoading(false))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      setSession(session)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setLoading(true)
        loadProfile(session?.user?.id).finally(() => setLoading(false))
      } else {
        loadProfile(session?.user?.id)
      }
    })

    return () => listener.subscription.unsubscribe()
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
