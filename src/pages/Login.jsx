import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { fetchInstitucionPorSlug, ULTIMO_INSTITUTO_KEY } from '../lib/tenant'
import AppLogo from '../components/AppLogo'

export default function Login() {
  const { session, signIn, loading } = useAuth()
  const { slug: slugDeRuta } = useParams()
  const [slug, setSlug] = useState(slugDeRuta || localStorage.getItem(ULTIMO_INSTITUTO_KEY) || '')
  const [institucion, setInstitucion] = useState(null)
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const esCorreo = usuario.includes('@')

  useEffect(() => {
    if (!slug) return setInstitucion(null)
    fetchInstitucionPorSlug(slug).then(setInstitucion)
  }, [slug])

  if (!loading && session) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    const { error } = await signIn(usuario, password, esCorreo ? null : slug)
    setBusy(false)
    if (error) setError('Usuario o contraseña incorrectos.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <div className="card w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <AppLogo institucion={institucion} className="h-14 w-14 object-contain rounded-lg" />
          <h1 className="text-xl font-semibold text-ink">{institucion?.nombre || 'Plataforma académica'}</h1>
          <p className="text-sm text-ink-soft">ERP académico para institutos bíblicos</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!esCorreo && (
            <div>
              <label className="label">Código de instituto</label>
              <input
                className="input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ej. la-cosecha"
                autoComplete="organization"
              />
            </div>
          )}
          <div>
            <label className="label">Usuario o correo</label>
            <input
              required
              className="input"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Tu documento o correo"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="rounded-md bg-danger-50 px-3 py-2 text-sm font-medium text-danger-600">{error}</p>}
          <button type="submit" disabled={busy} className="btn-primary mt-1 justify-center">
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-faint">
          ¿No tienes cuenta? Pide a tu administrador o líder que te invite.
        </p>
      </div>
    </div>
  )
}
